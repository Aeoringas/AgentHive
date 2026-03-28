export const HEX_SIZE = 52;

export interface HexCoord {
  col: number;
  row: number;
}

export interface Point {
  x: number;
  y: number;
}

export function hexWidth(): number {
  return Math.sqrt(3) * HEX_SIZE;
}

export function hexHeight(): number {
  return 2 * HEX_SIZE;
}

export function hexToPixel(coord: HexCoord): Point {
  const w = hexWidth();
  const h = hexHeight();
  const offset = Math.abs(coord.row) % 2 === 1 ? w / 2 : 0;
  return {
    x: coord.col * w + offset,
    y: coord.row * h * 0.75,
  };
}

export function pixelToHex(point: Point): HexCoord {
  const h = hexHeight();
  const w = hexWidth();
  const row = Math.round(point.y / (h * 0.75));
  const offset = Math.abs(row) % 2 === 1 ? w / 2 : 0;
  const col = Math.round((point.x - offset) / w);
  return { col, row };
}

export function hexCorners(size: number = HEX_SIZE): Point[] {
  const corners: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 30 + 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: size * Math.cos(angleRad),
      y: size * Math.sin(angleRad),
    });
  }
  return corners;
}

export function hexPath(size: number = HEX_SIZE): string {
  const corners = hexCorners(size);
  const parts = corners.map((p, i) => {
    const prefix = i === 0 ? "M" : "L";
    return `${prefix}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  });
  return parts.join(" ") + " Z";
}

export function isPointInHex(point: Point, center: Point, size: number = HEX_SIZE): boolean {
  const dx = Math.abs(point.x - center.x);
  const dy = Math.abs(point.y - center.y);
  const w = Math.sqrt(3) * size / 2;
  const h = size;
  if (dx > w || dy > h) return false;
  return w * h - w * dy - h / 2 * dx >= 0;
}
