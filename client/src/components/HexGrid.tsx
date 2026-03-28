import { useContext } from "react";
import { CanvasContext } from "./HexCanvas";
import { hexToPixel, pixelToHex, hexPath, hexWidth, hexHeight } from "../utils/hex";

interface HexGridProps {
  visible: boolean;
}

const path = hexPath();
const w = hexWidth();
const h = hexHeight();

export default function HexGrid({ visible }: HexGridProps) {
  const { panX, panY, zoom } = useContext(CanvasContext);

  if (!visible) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const left = -panX / zoom - w;
  const top = -panY / zoom - h;
  const right = (vw - panX) / zoom + w;
  const bottom = (vh - panY) / zoom + h;

  const topLeft = pixelToHex({ x: left, y: top });
  const bottomRight = pixelToHex({ x: right, y: bottom });

  const minCol = topLeft.col - 1;
  const maxCol = bottomRight.col + 1;
  const minRow = topLeft.row - 1;
  const maxRow = bottomRight.row + 1;

  const cells: { key: string; x: number; y: number }[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
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
