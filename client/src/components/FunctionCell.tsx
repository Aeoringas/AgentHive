import React, { useState, useEffect } from 'react';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import type { HexCoord } from '../utils/hex';
import { useDrag } from '../hooks/useDrag';
import styles from './FunctionCell.module.css';

interface FunctionCellProps {
  coord: HexCoord;
  label: string;
  onClick: () => void;
  onDragEnd?: (label: string, coord: HexCoord) => void;
  onSnapPreview?: (preview: HexCoord | null) => void;
}

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function FunctionCell({ coord, label, onClick, onDragEnd, onSnapPreview }: FunctionCellProps) {
  const [hovered, setHovered] = useState(false);

  const { isDragging, dragOffset, snapPreview, suppressTransition, handleMouseDown } = useDrag({
    currentCoord: coord,
    onDragEnd: (newCoord) => onDragEnd?.(label, newCoord),
  });

  useEffect(() => {
    onSnapPreview?.(snapPreview);
  }, [snapPreview?.q, snapPreview?.r]);

  const cellStyle: React.CSSProperties = isDragging
    ? {
        transform: `translate(${dragOffset!.x}px, ${dragOffset!.y}px)`,
        opacity: 0.8,
        zIndex: 100,
      }
    : {
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
        transition: suppressTransition ? 'none' : `transform var(--duration-fast) var(--ease-default)`,
        zIndex: hovered ? 10 : 1,
      };

  return (
    <HexCell
      coord={coord}
      onClick={isDragging ? undefined : onClick}
      style={cellStyle}
    >
      <div
        className={styles.inner}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={handleMouseDown}
      >
        <svg
          className={styles.svg}
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          overflow="visible"
        >
          <defs>
            <linearGradient id="funcSheen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.15" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={path} className={styles.hexDefault} />
          <path d={path} className={styles.hexSheen} />
        </svg>
        <div className={styles.content}>
          <div className={styles.label}>{label}</div>
        </div>
      </div>
    </HexCell>
  );
}
