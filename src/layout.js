import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceCollide,
} from "d3-force";

/**
 * Force-directed layout using d3-force for a compact, organic graph.
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Object} Layouted nodes and edges
 */
export function layoutElements(nodes, edges) {
  // Copy nodes and edges to avoid mutating original arrays
  const simNodes = nodes.map((n) => ({ ...n }));
  const simLinks = edges.map((e) => ({
    ...e,
    source: e.source,
    target: e.target,
  }));

  // Create the simulation
  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d) => d.id)
        .distance(90)
        .strength(0.2)
    )
    .force("charge", forceManyBody().strength(-300))
    .force("center", forceCenter(500, 400)) // Center in a 1000x800 area
    .force("collide", forceCollide(80)); // Prevent overlap (node radius + margin)

  // Run the simulation synchronously for a fixed number of ticks
  simulation.stop();
  for (let i = 0; i < 200; ++i) simulation.tick();

  // Map positions back to nodes
  const layoutedNodes = simNodes.map((n, i) => ({
    ...nodes[i],
    position: { x: n.x, y: n.y },
  }));

  return { nodes: layoutedNodes, edges };
}
