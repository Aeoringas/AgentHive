export const HEX_SIZE = 56;

export interface HexCoord {
  q: number;
  r: number;
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
  const x = HEX_SIZE * (Math.sqrt(3) * coord.q + Math.sqrt(3) / 2 * coord.r);
  const y = HEX_SIZE * (3 / 2 * coord.r);
  return { x, y };
}

function hexRound(q: number, r: number): HexCoord {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

export function pixelToHex(point: Point): HexCoord {
  const q = (Math.sqrt(3) / 3 * point.x - 1 / 3 * point.y) / HEX_SIZE;
  const r = (2 / 3 * point.y) / HEX_SIZE;
  return hexRound(q, r);
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

export function ringCoords(n: number): HexCoord[] {
  if (n === 0) return [{ q: 0, r: 0 }];
  const results: HexCoord[] = [];
  const directions: HexCoord[] = [
    { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
  ];
  let current: HexCoord = { q: n, r: 0 };
  for (let side = 0; side < 6; side++) {
    for (let step = 0; step < n; step++) {
      results.push({ ...current });
      current = {
        q: current.q + directions[(side + 2) % 6].q,
        r: current.r + directions[(side + 2) % 6].r,
      };
    }
  }
  return results;
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

export { hexRound };
