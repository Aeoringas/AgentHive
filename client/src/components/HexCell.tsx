import React from 'react';
import { hexToPixel, hexWidth, hexHeight } from '../utils/hex';
import type { HexCoord } from '../utils/hex';
import styles from './HexCell.module.css';

interface HexCellProps {
  coord: HexCoord;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const w = hexWidth();
const h = hexHeight();

export default function HexCell({ coord, children, onClick, className, style }: HexCellProps) {
  const px = hexToPixel(coord);

  const cellStyle = {
    '--hex-x': px.x + 'px',
    '--hex-y': px.y + 'px',
    '--hex-width': w + 'px',
    '--hex-height': h + 'px',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  } as React.CSSProperties;

  return (
    <div
      onClick={onClick}
      className={`${styles.cell}${className ? ` ${className}` : ''}`}
      style={cellStyle}
    >
      {children}
    </div>
  );
}
