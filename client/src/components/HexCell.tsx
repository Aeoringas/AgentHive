import React from 'react';
import { hexToPixel, hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';

interface HexCellProps {
  col: number;
  row: number;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function HexCell({ col, row, children, onClick, className, style }: HexCellProps) {
  const { x, y } = hexToPixel({ col, row });

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <path d={path} fill="transparent" stroke="transparent" />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: w,
          height: h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
