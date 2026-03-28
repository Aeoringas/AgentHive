import React, { useState } from 'react';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import type { HexCoord } from '../utils/hex';
import { useDrag } from '../hooks/useDrag';

interface FunctionCellProps {
  col: number;
  row: number;
  label: string;
  color: string;
  onClick: () => void;
  onDragEnd?: (label: string, coord: HexCoord) => void;
}

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function FunctionCell({ col, row, label, color, onClick, onDragEnd }: FunctionCellProps) {
  const [hovered, setHovered] = useState(false);

  const { isDragging, dragOffset, handleMouseDown } = useDrag({
    currentCoord: { col, row },
    onDragEnd: (coord) => onDragEnd?.(label, coord),
  });

  return (
    <HexCell
      col={col}
      row={row}
      onClick={() => { if (!isDragging) onClick(); }}
      style={{
        transform: isDragging && dragOffset
          ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
          : hovered ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.15s ease',
        zIndex: isDragging ? 100 : hovered ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', width: w, height: h }}
      >
        <svg
          width={w}
          height={h}
          viewBox={`${-w / 2 - 2} ${-h / 2 - 2} ${w + 4} ${h + 4}`}
          style={{ position: 'absolute', top: -2, left: -2, width: w + 4, height: h + 4 }}
          overflow="visible"
        >
          <path
            d={path}
            fill={hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)'}
            stroke={color}
            strokeWidth={2}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: w,
            height: h,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
            {label}
          </div>
        </div>
      </div>
    </HexCell>
  );
}
