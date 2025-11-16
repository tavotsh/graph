import React, { useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import "./CustomNode.css";

export default function CustomNode({ data }) {
  const {
    openTooltip,
    setHoveredNodeId,
    setClickedNodeId,
    nodeId,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
  } = data;
  const [flash, setFlash] = React.useState(false);
  const nodeRef = useRef();

  // Persistent flash if alerted
  useEffect(() => {
    setFlash(data.alerted);
  }, [data.alerted]);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (nodeRef.current && !nodeRef.current.contains(event.target)) {
        setClickedNodeId(null);
        setHoveredNodeId(null);
      }
    }
    if (openTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openTooltip, setClickedNodeId, setHoveredNodeId]);

  // Determine alert class
  let alertClass = "";
  if (data.alertLevel === "High") alertClass = "alert-high";
  else if (data.alertLevel === "Medium") alertClass = "alert-medium";

  // Determine highlight class - alerted nodes keep their alert colors
  let highlightClass = "";
  if (data.highlighted) {
    if (data.alertLevel === "High") {
      highlightClass = "highlighted-high";
    } else if (data.alertLevel === "Medium") {
      highlightClass = "highlighted-medium";
    } else {
      highlightClass = "highlighted-orange";
    }
  }

  // Dimmed class for unconnected nodes
  let dimmedClass = "";
  if (data.dimmed) {
    dimmedClass = "dimmed";
  }

  // Tooltip content
  const tooltipContent = (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        minWidth: 180,
        bgcolor: "#222",
        color: "#fff",
        borderRadius: 2,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          color:
            data.alertLevel === "High"
              ? "red"
              : data.alertLevel === "Medium"
              ? "gold"
              : "#fff",
        }}
      >
        {data.alertLevel} Alert
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: "#fff" }}>
        {data.message}
      </Typography>
    </Paper>
  );

  const handleClick = (e) => {
    e.stopPropagation();
    setClickedNodeId((prev) => (prev === nodeId ? null : nodeId));
  };
  const handleMouseEnter = () => handleNodeMouseEnter(nodeId);
  const handleMouseLeave = () => handleNodeMouseLeave(nodeId);

  const nodeDiv = (
    <div
      key={`${data.id}-${data.position?.x ?? 0}-${data.position?.y ?? 0}`}
      ref={nodeRef}
      className={`circle-node ${
        flash ? "flashing" : ""
      } ${alertClass} ${highlightClass} ${dimmedClass}`
        .replace(/\s+/g, " ")
        .trim()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      style={{ cursor: data.alerted ? "pointer" : "default" }}
    >
      <Handle type="target" position={Position.Top} />
      <img src={data.image} alt={data.label} className="node-image" />
      <div className="node-label">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );

  return data.alerted ? (
    <Tooltip
      open={openTooltip}
      title={tooltipContent}
      placement="top"
      arrow
      disableFocusListener
      disableTouchListener
      componentsProps={{ tooltip: { sx: { bgcolor: "transparent", p: 0 } } }}
    >
      {nodeDiv}
    </Tooltip>
  ) : (
    nodeDiv
  );
}
