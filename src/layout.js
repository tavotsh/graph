import dagre from "dagre";

// a single Dagre graph instance
const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

/**
 * Tight “boxy” layout:
 *  - small nodesep/ranksep for close packing
 *  - marginx/marginy for padding
 *  - shifts so minX/minY = 0
 */
export function layoutElements(nodes, edges, direction = "LR") {
  const nodeWidth = 100,
    nodeHeight = 100;

  g.setGraph({
    rankdir: direction,
    nodesep: 10,
    ranksep: 10,
    marginx: 10,
    marginy: 10000,
  });

  // register nodes/edges
  nodes.forEach((n) =>
    g.setNode(n.id, { width: nodeWidth, height: nodeHeight })
  );
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  // find min x/y
  let minX = Infinity,
    minY = Infinity;
  nodes.forEach((n) => {
    const { x, y } = g.node(n.id);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  });

  // apply positions with shift
  const layoutedNodes = nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return {
      ...n,
      position: {
        x: x - minX + nodeWidth / 2,
        y: y - minY + nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
