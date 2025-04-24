import React, { useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import "./CustomNode.css";

export default function CustomNode({ data }) {
  const [flash, setFlash] = useState(false);

  // Persistent flash if alerted
  useEffect(() => {
    setFlash(data.alerted);
  }, [data.alerted]);

  return (
    <div
      className={`circle-node ${flash ? "flashing" : ""} ${
        data.highlighted ? "highlighted" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <img src={data.image} alt={data.label} className="node-image" />
      <div className="node-label">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
