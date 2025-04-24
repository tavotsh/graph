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
      const targets = edges
        .filter((e) => e.source === nodeId)
        .map((e) => e.target);
      const affectedEdgeIds = edges
        .filter((e) => e.source === nodeId)
        .map((e) => e.id);

      // 3a. Update nodes -> data.highlighted
      setNodes((nds) =>
        nds.map((n) =>
          targets.includes(n.id)
            ? { ...n, data: { ...n.data, highlighted: flag } }
            : n
        )
      );

      // 3b. Update edges -> style + markerEnd color
      setEdges((eds) =>
        eds.map((e) =>
          affectedEdgeIds.includes(e.id)
            ? {
                ...e,
                style: {
                  ...e.style,
                  stroke: flag ? "#00aaff" : "rgba(255,255,255,0.2)",
                },
                markerEnd: {
                  ...e.markerEnd,
                  color: flag ? "#00aaff" : "rgba(255,255,255,0.2)",
                },
              }
            : e
        )
      );
    },
    [edges, setEdges, setNodes]
  );

  // 4. Event handlers
  const onNodeMouseEnter = useCallback(
    (_, node) => {
      if (node.data.alerted) highlight(node.id, true);
    },
    [highlight]
  );
  const onNodeMouseLeave = useCallback(
    (_, node) => {
      if (node.data.alerted) highlight(node.id, false);
    },
    [highlight]
  );
  const onNodeClick = onNodeMouseEnter; // same behavior on click

  return (
    <Box sx={{ width: "100vw", height: "100vh", bgcolor: "#121212" }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeClick={onNodeClick}
          fitView
          nodesDraggable={false} // lock nodes
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={true} // allow zoom
          panOnDrag={true} // allow pan
        >
          <MiniMap />
          <Controls />
          <Background color="#444" gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </Box>
  );
}
