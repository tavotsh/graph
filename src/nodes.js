/**
 * Generate an array of 40 nodes with:
 *  - unique id
 *  - random alerted flag
 *  - random alertLevel: 'High', 'Medium', or undefined
 *  - alert message if alerted
 *  - placeholder image + label
 *  - initial position (0,0)
 */
const messages = [
  "CPU usage is high.",
  "Disk space running low.",
  "Network latency detected.",
  "Service restart required.",
  "Unexpected shutdown detected.",
  "Memory usage spike.",
  "Database connection lost.",
  "Unauthorized access attempt.",
  "Backup failed.",
  "Temperature threshold exceeded.",
];

export function generateNodes() {
  return Array.from({ length: 70 }, (_, i) => {
    let alertLevel;
    const rand = Math.random();
    if (rand < 0.2) alertLevel = "High";
    else if (rand < 0.4) alertLevel = "Medium";
    // else undefined
    const alerted = !!alertLevel;
    const message = alerted
      ? messages[Math.floor(Math.random() * messages.length)]
      : undefined;
    return {
      id: `node-${i}`,
      type: "custom",
      data: {
        label: `Node ${i + 1}`,
        image: `https://robohash.org/${i}.png?size=50x50`,
        alerted,
        alertLevel,
        message,
        highlighted: false,
      },
      position: { x: 0, y: 0 },
    };
  });
}
