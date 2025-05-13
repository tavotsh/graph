import { v4 as uuidv4 } from "uuid";

/**
 * Given an array of nodes, connect each node to
 * 1–2 random other nodes (no self-link).
 * Edges are directed, with very transparent arrow by default.
 */
export function generateEdges(nodes) {
  const edges = [];

  nodes.forEach((sourceNode) => {
    // pick 1–2 targets
    const targets = nodes
      .filter((n) => n.id !== sourceNode.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    targets.forEach((t) => {
      edges.push({
        id: uuidv4(),
        source: sourceNode.id,
        target: t.id,
        markerEnd: {
          type: "arrowclosed",
          color: "rgba(255,255,255,0.08)",
        },
        style: {
          stroke: "rgba(255,255,255,0.08)",
          strokeWidth: 2,
        },
      });
    });
  });

  return edges;
}
