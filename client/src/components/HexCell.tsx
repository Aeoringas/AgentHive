import React from 'react';
import { hexToPixel, hexWidth, hexHeight } from '../utils/hex';

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
      {children}
    </div>
  );
}
