import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Box } from "@mui/material";

import CustomNode from "./CustomNode";
import { generateNodes } from "./nodes";
import { generateEdges } from "./edges";
import { layoutElements } from "./layout";

const nodeTypes = { custom: CustomNode };

export default function App() {
  // 1. Generate & layout once
  const rawNodes = useMemo(() => generateNodes(), []);
  const rawEdges = useMemo(() => generateEdges(rawNodes), [rawNodes]);
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => layoutElements(rawNodes, rawEdges, "LR"),
    [rawNodes, rawEdges]
  );

  // 2. React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // 3. Highlight function
  const highlight = useCallback(
    (nodeId, flag) => {
      // find all outgoing targets from this node
      const node = nodes.find((n) => n.id === nodeId);
      const alertLevel = node?.data?.alertLevel;
      let highlightColor = "#00aaff";
      if (alertLevel === "High") highlightColor = "red";
      else if (alertLevel === "Medium") highlightColor = "yellow";

      const targets = edges
        .filter((e) => e.source === nodeId)
        .map((e) => e.target);
      const affectedEdgeIds = edges
        .filter((e) => e.source === nodeId)
        .map((e) => e.id);

      // 3a. Update nodes -> data.highlighted
      setNodes((nds) =>
        nds.map((n) => {
          if (targets.includes(n.id)) {
            return {
              ...n,
              data: {
                ...n.data,
                highlighted: flag,
              },
            };
          }
          return n;
        })
      );

      // 3b. Update edges -> style + markerEnd color
      setEdges((eds) =>
        eds.map((e) => {
          if (affectedEdgeIds.includes(e.id)) {
            return {
              ...e,
              style: {
                ...e.style,
                stroke: flag ? highlightColor : "rgba(255,255,255,0.08)",
              },
              markerEnd: {
                ...e.markerEnd,
                color: flag ? highlightColor : "rgba(255,255,255,0.08)",
              },
            };
          }
          return e;
        })
      );
    },
    [edges, setEdges, setNodes, nodes]
  );

  // Tooltip open state (global)
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [clickedNodeId, setClickedNodeId] = useState(null);

  // 4. Event handlers
  const [activeNodeId, setActiveNodeId] = useState(null);

  // Highlight on hover
  const handleNodeMouseEnter = useCallback(
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data?.alerted) return;
      highlight(nodeId, true);
      setHoveredNodeId(nodeId);
    },
    [highlight, nodes]
  );
  const handleNodeMouseLeave = useCallback(
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data?.alerted) return;
      setHoveredNodeId((prev) => {
        if (clickedNodeId !== nodeId) {
          highlight(nodeId, false);
        }
        return null;
      });
    },
    [highlight, clickedNodeId, nodes]
  );

  // Highlight on click
  const onNodeClick = useCallback(
    (_, node) => {
      if (!node.data.alerted) return;
      setActiveNodeId((prev) => {
        const newFlag = prev !== node.id;
        // Always remove highlight from previous node if different
        if (prev && prev !== node.id) highlight(prev, false);
        if (newFlag) highlight(node.id, true);
        if (!newFlag) highlight(node.id, false);
        return newFlag ? node.id : null;
      });
      setClickedNodeId((prev) => {
        const newFlag = prev !== node.id;
        // Always remove highlight from previous node if different
        if (prev && prev !== node.id) highlight(prev, false);
        if (!newFlag) highlight(node.id, false);
        return newFlag ? node.id : null;
      });
    },
    [highlight]
  );

  // Remove highlight and tooltip on click outside the graph
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest(".react-flow")) {
        if (activeNodeId) highlight(activeNodeId, false);
        setActiveNodeId(null);
        setHoveredNodeId(null);
        setClickedNodeId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeNodeId, highlight]);

  // Pass hoveredNodeId, clickedNodeId, and their setters to each node
  const nodesWithTooltip = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      openTooltip: hoveredNodeId === n.id || clickedNodeId === n.id,
      setHoveredNodeId,
      setClickedNodeId,
      nodeId: n.id,
      handleNodeMouseEnter,
      handleNodeMouseLeave,
    },
  }));

  return (
    <ReactFlowProvider>
      <Box sx={{ width: "100vw", height: "100vh", bgcolor: "#121212" }}>
        <ReactFlow
          nodes={nodesWithTooltip}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={true}
          panOnDrag={true}
        >
          <Controls />
          <Background color="#444" gap={16} />
        </ReactFlow>
      </Box>
    </ReactFlowProvider>
  );
}
