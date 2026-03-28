import { hexToPixel, hexPath } from "../utils/hex";

interface HexGridProps {
  visible: boolean;
  rows: number;
  cols: number;
}

const path = hexPath();

export default function HexGrid({ visible, rows, cols }: HexGridProps) {
  if (!visible) return null;

  const cells: { key: string; x: number; y: number }[] = [];
  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      const center = hexToPixel({ col, row });
      cells.push({ key: `${col},${row}`, x: center.x, y: center.y });
    }
  }

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {cells.map((cell) => (
        <path
          key={cell.key}
          d={path}
          transform={`translate(${cell.x},${cell.y})`}
          stroke="#e5e7eb"
          strokeWidth={1}
          fill="none"
          opacity={0.5}
        />
      ))}
    </svg>
  );
}
