import React from 'react';
import { hexCorners, HEX_SIZE } from '../utils/hex';
import styles from './HoneyFill.module.css';

interface HoneyFillProps {
  progress: number;
  status?: string;
}

function buildClipPolygon(): string {
  const corners = hexCorners(HEX_SIZE);
  const w = Math.sqrt(3) * HEX_SIZE;
  const h = 2 * HEX_SIZE;
  const points = corners.map(p => {
    const px = ((p.x + w / 2) / w) * 100;
    const py = ((p.y + h / 2) / h) * 100;
    return `${px.toFixed(2)}% ${py.toFixed(2)}%`;
  });
  return `polygon(${points.join(', ')})`;
}

const clipPolygon = buildClipPolygon();

export default function HoneyFill({ progress }: HoneyFillProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className={styles.container} style={{ clipPath: clipPolygon }}>
      <div
        className={styles.fill}
        style={{ '--fill-height': `${clamped}%` } as React.CSSProperties}
      />
      {clamped === 100 && <div className={styles.seal} />}
    </div>
  );
}
