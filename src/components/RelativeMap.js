import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Box, TextField, InputAdornment, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import CustomNode from "../CustomNode";
import { generateNodes } from "../nodes";
import { generateEdges } from "../edges";

const nodeTypes = { custom: CustomNode };

export default function RelativeMap() {
  // 1. Generate data once
  const rawNodes = useMemo(() => generateNodes(), []);
  const rawEdges = useMemo(() => generateEdges(rawNodes), [rawNodes]);

  // 2. Distribute nodes 50/50 between Site A and Site B
  const nodesWithSites = useMemo(() => {
    return rawNodes.map((node, index) => {
      // Split exactly in half
      const site = index < rawNodes.length / 2 ? "Site A" : "Site B";

      return {
        ...node,
        data: {
          ...node.data,
          site: site,
        },
      };
    });
  }, [rawNodes]);

  // 3. Create layout with Site A on left, Site B on right
  const createSiteLayout = (nodes) => {
    const siteWidth = 600; // Width for each site
    const siteHeight = 600; // Height for the entire graph
    const margin = 50;
    const nodesPerRow = 8;
    const nodeSpacingX = 120;
    const nodeSpacingY = 140;

    return nodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;

      // Calculate position based on which site
      let x, y;
      if (node.data.site === "Site A") {
        x = margin + col * nodeSpacingX;
        y = margin + row * nodeSpacingY;
      } else {
        x = siteWidth + margin + col * nodeSpacingX;
        y = margin + row * nodeSpacingY;
      }

      return {
        ...node,
        position: { x, y },
      };
    });
  };

  // 4. Apply layout to all nodes
  const layoutedNodes = useMemo(() => {
    return createSiteLayout(nodesWithSites);
  }, [nodesWithSites]);

  // 5. Filter edges to show cross-site connections and intra-site connections
  const layoutedEdges = useMemo(() => {
    // Filter edges to only show relevant connections
    const filteredEdges = rawEdges.filter((edge) => {
      const sourceNode = nodesWithSites.find((n) => n.id === edge.source);
      const targetNode = nodesWithSites.find((n) => n.id === edge.target);

      // Show edges between different sites or within sites
      if (sourceNode && targetNode) {
        return (
          sourceNode.data.site !== targetNode.data.site ||
          Math.abs(
            nodesWithSites.indexOf(sourceNode) -
              nodesWithSites.indexOf(targetNode)
          ) < 5
        );
      }
      return false;
    });

    // Apply default transparent styling (matching FullMap behavior)
    return filteredEdges.map((edge) => ({
      ...edge,
      markerEnd: {
        type: "arrowclosed",
        color: "rgba(255,255,255,0.08)",
      },
      style: {
        stroke: "rgba(255,255,255,0.08)",
        strokeWidth: 2,
      },
    }));
  }, [rawEdges, nodesWithSites]);

  // 6. React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Search functionality
  const [searchText, setSearchText] = useState("");

  // Persistent dimming state
  const [persistentDimNodeId, setPersistentDimNodeId] = useState(null);

  // 7. Filter nodes based on search text
  const filteredNodes = useMemo(() => {
    if (!searchText.trim()) return nodes;
    return nodes.filter((node) =>
      node.data.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [nodes, searchText]);

  // 8. Filter edges to only show those connected to visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  // 9. Highlight function
  const highlight = useCallback(
    (nodeId, flag) => {
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

      setNodes((nds) => {
        const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
        return nds.map((n) => {
          if (!filteredNodeIds.has(n.id)) return n;

          const isConnected = targets.includes(n.id) || n.id === nodeId;

          let shouldHighlight = flag;
          let shouldDim = false;

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
            shouldHighlight = isConnected;
            shouldDim = !isConnected;
          } else {
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

      setEdges((eds) => {
        const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
        return eds.map((e) => {
          if (
            !filteredNodeIds.has(e.source) ||
            !filteredNodeIds.has(e.target)
          ) {
            return e;
          }

          let edgeHighlightColor = "rgba(255,255,255,0.08)";

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

  // 10. Tooltip states
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [clickedNodeId, setClickedNodeId] = useState(null);

  // 11. Event handlers
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
        if (!persistentDimNodeId && clickedNodeId !== nodeId) {
          highlight(nodeId, false);
        }
        return null;
      });
    },
    [highlight, clickedNodeId, filteredNodes, persistentDimNodeId]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      if (!node.data.alerted) return;

      setPersistentDimNodeId((prev) => {
        if (prev === node.id) {
          // Toggle off - remove persistent dimming
          highlight(node.id, false);
          return null;
        } else {
          // Toggle on or switch - activate persistent dimming
          highlight(node.id, true);
          return node.id;
        }
      });
    },
    [highlight]
  );

  // 12. Pass props to each node
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
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        bgcolor: "#121212",
        position: "relative",
      }}
    >
      {/* Search Bar */}
      <Box
        sx={{
          position: "absolute",
          top: 80,
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

      {/* Site Labels */}
      <Box
        sx={{
          position: "absolute",
          top: 140,
          left: 200,
          zIndex: 1000,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "#ff4444",
            fontWeight: "bold",
            textShadow: "0 0 10px #ff444480",
          }}
        >
          Site A
        </Typography>
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: 140,
          right: 200,
          zIndex: 1000,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "#ffff44",
            fontWeight: "bold",
            textShadow: "0 0 10px #ffff4480",
          }}
        >
          Site B
        </Typography>
      </Box>

      {/* Central Divider */}
      <Box
        sx={{
          position: "absolute",
          top: 180,
          left: "50%",
          transform: "translateX(-50%)",
          width: 2,
          height: "70%",
          bgcolor:
            "linear-gradient(to bottom, transparent, #00aaff, transparent)",
          zIndex: 100,
        }}
      />

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
        <MiniMap
          nodeColor={(node) => {
            if (node.data.site === "Site A") return "#ff4444";
            if (node.data.site === "Site B") return "#ffff44";
            return "#666";
          }}
          maskColor="rgba(18, 18, 18, 0.8)"
        />
      </ReactFlow>
    </Box>
  );
}
