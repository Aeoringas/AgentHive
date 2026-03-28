import React from 'react';
import { hexToPixel, hexWidth } from '../utils/hex';

interface ColumnHeadersProps {
  columns: Array<{
    col: number;
    label: string;
    color: string;
    count: number;
  }>;
}

const w = hexWidth();

export default function ColumnHeaders({ columns }: ColumnHeadersProps) {
  return (
    <>
      {columns.map((column) => {
        const { x, y } = hexToPixel({ col: column.col, row: 1 });
        return (
          <div
            key={column.col}
            style={{
              position: 'absolute',
              left: x - w / 2,
              top: y - 10,
              width: w,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: 13,
              color: '#6b7280',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: column.color,
                flexShrink: 0,
              }}
            />
            <span>{column.label}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{column.count}</span>
          </div>
        );
      })}
    </>
  );
}
