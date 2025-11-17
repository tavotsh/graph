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

  // 2. Distribute nodes between Site A, Site B, and Cross Site
  const nodesWithSites = useMemo(() => {
    return rawNodes.map((node) => {
      // Random assignment of nodes to sites (happens on page refresh)
      const siteIndex = Math.floor(Math.random() * 3);
      let site;
      switch (siteIndex) {
        case 0:
          site = "Site A";
          break;
        case 1:
          site = "Site A";
          break;
        case 2:
        default:
          site = "Site A";
          break;
      }

      return {
        ...node,
        data: {
          ...node.data,
          site: site,
        },
      };
    });
  }, [rawNodes]);

  // 3. Create adaptive layout based on number of occupied sites
  const createSiteLayout = (nodes) => {
    // Viewport dimensions
    const viewportWidth = 1920;
    const viewportHeight = 1080;
    
    // Group nodes by site
    const siteGroups = {
      "Site A": nodes.filter(n => n.data.site === "Site A"),
      "Site B": nodes.filter(n => n.data.site === "Site B"),
      "Cross Site": nodes.filter(n => n.data.site === "Cross Site")
    };
    
    // Determine which sites have nodes
    const occupiedSites = Object.entries(siteGroups)
      .filter(([_, siteNodes]) => siteNodes.length > 0)
      .map(([siteName, _]) => siteName);
    
    const numOccupiedSites = occupiedSites.length;
    
    // Node layout parameters
    const nodesPerRow = 4;
    const nodeSpacingX = 140;
    const nodeSpacingY = 160;
    
    let positionedNodes = [];
    let sitePositions = {};
    
    if (numOccupiedSites === 1) {
      // Single group: Maximize use of available space while preserving title bar
      const titleBarHeight = 160; // Space for search bar and site label
      const bottomMargin = 80;
      const availableHeight = viewportHeight - titleBarHeight - bottomMargin;
      const availableWidth = viewportWidth - 200; // Side margins
      
      const [siteName] = occupiedSites;
      const siteNodes = siteGroups[siteName];
      const nodeCount = siteNodes.length;
      
      // Dynamically calculate optimal grid layout
      const rowsNeeded = Math.ceil(nodeCount / nodesPerRow);
      const totalHeight = rowsNeeded * nodeSpacingY;
      
      // Center the entire grid in available space
      const startY = titleBarHeight + (availableHeight - totalHeight) / 2;
      const centerX = viewportWidth / 2;
      
      sitePositions[siteName] = { x: centerX, y: startY + totalHeight / 2 };
      
      positionedNodes = siteNodes.map((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        const offsetX = (nodesPerRow - 1) * nodeSpacingX / 2;
        
        return {
          ...node,
          position: {
            x: centerX - offsetX + col * nodeSpacingX,
            y: startY + row * nodeSpacingY
          },
        };
      });
      
    } else if (numOccupiedSites === 2) {
      // Two groups: Left and right positioning
      const margin = 300;
      const leftX = margin;
      const rightX = viewportWidth - margin;
      const centerY = viewportHeight / 2;
      
      const sites = occupiedSites.sort();
      sitePositions[sites[0]] = { x: leftX, y: centerY };
      sitePositions[sites[1]] = { x: rightX, y: centerY };
      
      // Position nodes for each site
      sites.forEach(siteName => {
        const siteNodes = siteGroups[siteName];
        const { x: baseX, y: baseY } = sitePositions[siteName];
        
        positionedNodes.push(...siteNodes.map((node, index) => {
          const row = Math.floor(index / nodesPerRow);
          const col = index % nodesPerRow;
          const offsetX = (nodesPerRow - 1) * nodeSpacingX / 2;
          
          return {
            ...node,
            position: {
              x: baseX - offsetX + col * nodeSpacingX,
              y: baseY + row * nodeSpacingY
            },
          };
        }));
      });
      
    } else {
      // Three groups: Triangle positioning
      const centerX = viewportWidth / 2;
      const margin = 200;
      
      // Triangle vertices positions
      const siteATopY = margin + 100;
      const sitesBottomY = viewportHeight - margin - 50;
      
      // Base positions for triangle
      const triangleWidth = viewportWidth - (2 * margin);
      
      // Site positions in triangle
      sitePositions["Site A"] = { x: centerX, y: siteATopY };
      sitePositions["Site B"] = { x: centerX - (triangleWidth * 0.4), y: sitesBottomY };
      sitePositions["Cross Site"] = { x: centerX + (triangleWidth * 0.4), y: sitesBottomY };
      
      // Position nodes for each site
      Object.entries(siteGroups).forEach(([siteName, siteNodes]) => {
        if (siteNodes.length === 0) return;
        
        const { x: baseX, y: baseY } = sitePositions[siteName];
        
        positionedNodes.push(...siteNodes.map((node, index) => {
          const row = Math.floor(index / nodesPerRow);
          const col = index % nodesPerRow;
          const offsetX = (nodesPerRow - 1) * nodeSpacingX / 2;
          
          return {
            ...node,
            position: {
              x: baseX - offsetX + col * nodeSpacingX,
              y: baseY + row * nodeSpacingY
            },
          };
        }));
      });
    }
    
    return positionedNodes;
  };

  // 4. Determine occupied sites for adaptive layout
  const occupiedSites = useMemo(() => {
    const siteGroups = {
      "Site A": nodesWithSites.filter(n => n.data.site === "Site A"),
      "Site B": nodesWithSites.filter(n => n.data.site === "Site B"),
      "Cross Site": nodesWithSites.filter(n => n.data.site === "Cross Site")
    };
    
    return Object.entries(siteGroups)
      .filter(([_, siteNodes]) => siteNodes.length > 0)
      .map(([siteName, _]) => siteName);
  }, [nodesWithSites]);

  // 5. Apply layout to all nodes
  const layoutedNodes = useMemo(() => {
    return createSiteLayout(nodesWithSites);
  }, [nodesWithSites]);

  // 6. Filter edges to show cross-site connections and intra-site connections
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

  // 7. React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // 8. Search functionality
  const [searchText, setSearchText] = useState("");

  // 9. Persistent dimming state
  const [persistentDimNodeId, setPersistentDimNodeId] = useState(null);

  // 10. Filter nodes based on search text
  const filteredNodes = useMemo(() => {
    if (!searchText.trim()) return nodes;
    return nodes.filter((node) =>
      node.data.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [nodes, searchText]);

  // 11. Filter edges to only show those connected to visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  // 12. Highlight function
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

  // 13. Tooltip states
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [clickedNodeId, setClickedNodeId] = useState(null);

  // 14. Event handlers
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

  // 15. Pass props to each node
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

      {/* Adaptive Site Labels - only show for occupied sites */}
      {occupiedSites.map((siteName) => {
        const siteColors = {
          "Site A": { color: "#ff4444", shadow: "#ff444480", position: "top" },
          "Site B": { color: "#ffff44", shadow: "#ffff4480", position: "bottom-left" },
          "Cross Site": { color: "#44ff44", shadow: "#44ff4480", position: "bottom-right" }
        };
        
        const siteStyle = siteColors[siteName];
        
        let labelStyle = {};
        if (occupiedSites.length === 1) {
          // Single site: center
          labelStyle = {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          };
        } else if (occupiedSites.length === 2) {
          // Two sites: left and right
          const sortedSites = [...occupiedSites].sort();
          const isFirst = sortedSites[0] === siteName;
          labelStyle = {
            top: "50%",
            left: isFirst ? "25%" : "75%",
            transform: "translate(-50%, -50%)",
          };
        } else {
          // Three sites: triangle layout
          switch (siteName) {
            case "Site A":
              labelStyle = {
                top: 80,
                left: "50%",
                transform: "translateX(-50%)",
              };
              break;
            case "Site B":
              labelStyle = {
                bottom: 80,
                left: "25%",
                transform: "translateX(-50%)",
              };
              break;
            case "Cross Site":
              labelStyle = {
                bottom: 80,
                right: "25%",
                transform: "translateX(50%)",
              };
              break;
          }
        }
        
        return (
          <Box
            key={siteName}
            sx={{
              position: "absolute",
              zIndex: 1000,
              textAlign: "center",
              ...labelStyle,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: siteStyle.color,
                fontWeight: "bold",
                textShadow: `0 0 10px ${siteStyle.shadow}`,
              }}
            >
              {siteName}
            </Typography>
          </Box>
        );
      })}

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
            const siteColors = {
              "Site A": "#ff4444",
              "Site B": "#ffff44",
              "Cross Site": "#44ff44"
            };
            return siteColors[node.data.site] || "#666";
          }}
          maskColor="rgba(18, 18, 18, 0.8)"
        />
      </ReactFlow>
    </Box>
  );
}
