/**
 * Generate an array of 20 nodes with:
 *  - unique id
 *  - random alerted flag
 *  - placeholder image + label
 *  - initial position (0,0)
 */
export function generateNodes() {
  return Array.from({ length: 40 }, (_, i) => ({
    id: `node-${i}`,
    type: "custom",
    data: {
      label: `Node ${i + 1}`,
      image: `https://robohash.org/${i}.png?size=50x50`,
      alerted: Math.random() < 0.2,
      hovered: false,
      highlighted: false,
    },
    position: { x: 0, y: 0 },
  }));
}
