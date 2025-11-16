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
import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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

  // Search functionality
  const [searchText, setSearchText] = useState("");

  // Persistent dimming state
  const [persistentDimNodeId, setPersistentDimNodeId] = useState(null);

  // 2b. Filter nodes based on search text
  const filteredNodes = useMemo(() => {
    if (!searchText.trim()) return nodes;
    return nodes.filter((node) =>
      node.data.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [nodes, searchText]);

  // 2c. Filter edges to only show those connected to visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  // 3. Highlight function
  const highlight = useCallback(
    (nodeId, flag, isPersistent = false) => {
      // find all outgoing targets from this node
      const node = nodes.find((n) => n.id === nodeId);
      const alertLevel = node?.data?.alertLevel;
      let highlightColor = "#00aaff";
      if (alertLevel === "High") highlightColor = "red";
      else if (alertLevel === "Medium") highlightColor = "yellow";

      const targets = filteredEdges
        .filter((e) => e.source === nodeId)
        .map((e) => e.target);
      const affectedEdgeIds = filteredEdges
        .filter((e) => e.source === nodeId)
        .map((e) => e.id);

      // 3a. Update nodes -> data.highlighted and dim unconnected nodes
      setNodes((nds) => {
        const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
        return nds.map((n) => {
          if (!filteredNodeIds.has(n.id)) return n; // Skip hidden nodes

          const isConnected = targets.includes(n.id) || n.id === nodeId;

          let shouldHighlight = flag;
          let shouldDim = false;

          // If persistent dimming is active on another node, override hover highlighting
          if (persistentDimNodeId && persistentDimNodeId !== nodeId) {
            const persistentTargets = filteredEdges
              .filter((e) => e.source === persistentDimNodeId)
              .map((e) => e.target);
            const isPersistentConnected =
              persistentTargets.includes(n.id) || n.id === persistentDimNodeId;

            if (!isPersistentConnected) {
              shouldHighlight = false;
              shouldDim = true;
            } else {
              shouldHighlight = false;
              shouldDim = false;
            }
          } else if (flag) {
            // Normal highlighting behavior
            shouldHighlight = isConnected;
            shouldDim = !isConnected;
          } else {
            // No highlighting - only dim if persistent dimming is active
            shouldHighlight = false;
            shouldDim = false;
          }

          return {
            ...n,
            data: {
              ...n.data,
              highlighted: shouldHighlight,
              dimmed: shouldDim,
            },
          };
        });
      });

      // 3b. Update edges -> style + markerEnd color
      setEdges((eds) => {
        const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
        return eds.map((e) => {
          // Only update edges between visible nodes
          if (
            !filteredNodeIds.has(e.source) ||
            !filteredNodeIds.has(e.target)
          ) {
            return e;
          }

          let edgeHighlightColor = "rgba(255,255,255,0.08)";

          // If persistent dimming is active, highlight those edges
          if (persistentDimNodeId && affectedEdgeIds.includes(e.id)) {
            edgeHighlightColor = highlightColor;
          } else if (flag && affectedEdgeIds.includes(e.id)) {
            edgeHighlightColor = highlightColor;
          }

          return {
            ...e,
            style: {
              ...e.style,
              stroke: edgeHighlightColor,
            },
            markerEnd: {
              ...e.markerEnd,
              color: edgeHighlightColor,
            },
          };
        });
      });
    },
    [edges, setEdges, setNodes, nodes, filteredNodes, persistentDimNodeId]
  );

  // Tooltip open state (global)
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [clickedNodeId, setClickedNodeId] = useState(null);

  // 4. Event handlers
  const [activeNodeId, setActiveNodeId] = useState(null);

  // Highlight on hover
  const handleNodeMouseEnter = useCallback(
    (nodeId) => {
      const node = filteredNodes.find((n) => n.id === nodeId);
      if (!node?.data?.alerted) return;
      highlight(nodeId, true);
      setHoveredNodeId(nodeId);
    },
    [highlight, filteredNodes]
  );
  const handleNodeMouseLeave = useCallback(
    (nodeId) => {
      const node = filteredNodes.find((n) => n.id === nodeId);
      if (!node?.data?.alerted) return;
      setHoveredNodeId((prev) => {
        // Only remove highlight if no persistent dimming is active
        if (!persistentDimNodeId && clickedNodeId !== nodeId) {
          highlight(nodeId, false);
        }
        return null;
      });
    },
    [highlight, clickedNodeId, filteredNodes, persistentDimNodeId]
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

      // Handle persistent dimming
      setPersistentDimNodeId((prev) => {
        if (prev === node.id) {
          // Toggle off - remove persistent dimming
          highlight(node.id, false, false);
          return null;
        } else {
          // Toggle on or switch - activate persistent dimming for this node
          highlight(node.id, true, true);
          return node.id;
        }
      });
    },
    [highlight]
  );

  // Remove highlight and tooltip on click outside the graph
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest(".react-flow")) {
        if (activeNodeId) highlight(activeNodeId, false);
        if (persistentDimNodeId) {
          highlight(persistentDimNodeId, false);
          setPersistentDimNodeId(null);
        }
        setActiveNodeId(null);
        setHoveredNodeId(null);
        setClickedNodeId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeNodeId, highlight, persistentDimNodeId]);

  // Pass hoveredNodeId, clickedNodeId, and their setters to each node
  const nodesWithTooltip = filteredNodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      openTooltip: hoveredNodeId === n.id || clickedNodeId === n.id,
      setHoveredNodeId,
      setClickedNodeId,
      nodeId: n.id,
      handleNodeMouseEnter,
      handleNodeMouseLeave,
      persistentDimActive: persistentDimNodeId === n.id,
    },
  }));

  return (
    <ReactFlowProvider>
      <Box sx={{ width: "100vw", height: "100vh", bgcolor: "#121212" }}>
        {/* Search Bar */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: 300,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search nodes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#fff" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#00aaff",
                },
              },
              "& .MuiInputBase-input": {
                color: "#fff",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(255, 255, 255, 0.7)",
              },
            }}
          />
        </Box>

        <ReactFlow
          nodes={nodesWithTooltip}
          edges={filteredEdges}
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
