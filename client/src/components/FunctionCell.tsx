import React, { useState } from 'react';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';

interface FunctionCellProps {
  col: number;
  label: string;
  icon?: string;
  onClick: () => void;
}

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function FunctionCell({ col, label, icon, onClick }: FunctionCellProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <HexCell col={col} row={0} onClick={onClick}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', width: w, height: h }}
      >
        <svg
          width={w}
          height={h}
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <path
            d={path}
            fill={hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)'}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={1}
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
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {icon && (
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
          )}
          <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
            {label}
          </div>
        </div>
      </div>
    </HexCell>
  );
}
