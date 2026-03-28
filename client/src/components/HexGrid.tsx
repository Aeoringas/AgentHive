import { useContext } from "react";
import { CanvasContext } from "./HexCanvas";
import { hexToPixel, pixelToHex, hexPath, hexWidth, hexHeight } from "../utils/hex";
import styles from './HexGrid.module.css';

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

  const corners = [
    pixelToHex({ x: left, y: top }),
    pixelToHex({ x: right, y: top }),
    pixelToHex({ x: left, y: bottom }),
    pixelToHex({ x: right, y: bottom }),
  ];

  let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
  for (const c of corners) {
    if (c.q < minQ) minQ = c.q;
    if (c.q > maxQ) maxQ = c.q;
    if (c.r < minR) minR = c.r;
    if (c.r > maxR) maxR = c.r;
  }
  minQ -= 1; maxQ += 1; minR -= 1; maxR += 1;

  const cells: { key: string; x: number; y: number }[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      const center = hexToPixel({ q, r });
      cells.push({ key: `${q},${r}`, x: center.x, y: center.y });
    }
  }

  return (
    <svg className={styles.grid}>
      {cells.map((cell) => (
        <path
          key={cell.key}
          d={path}
          transform={`translate(${cell.x},${cell.y})`}
          className={styles.cell}
        />
      ))}
    </svg>
  );
}
