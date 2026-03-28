import React, { useState } from 'react';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import type { HexCoord } from '../utils/hex';
import styles from './FunctionCell.module.css';

interface FunctionCellProps {
  coord: HexCoord;
  label: string;
  onClick: () => void;
}

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function FunctionCell({ coord, label, onClick }: FunctionCellProps) {
  const [hovered, setHovered] = useState(false);

  const cellStyle: React.CSSProperties = {
    transform: hovered ? 'scale(1.06)' : 'scale(1)',
    transition: `transform var(--duration-fast) var(--ease-default)`,
    zIndex: hovered ? 10 : 1,
  };

  return (
    <HexCell
      coord={coord}
      onClick={onClick}
      style={cellStyle}
    >
      <div
        className={styles.inner}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <svg
          className={styles.svg}
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          overflow="visible"
        >
          <path d={path} className={styles.hexDefault} />
        </svg>
        <div className={styles.content}>
          <div className={styles.label}>{label}</div>
        </div>
      </div>
    </HexCell>
  );
}
