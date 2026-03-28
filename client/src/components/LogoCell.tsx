import React from 'react';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

const pulseKeyframes = `
@keyframes logoPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
`;

export default function LogoCell() {
  return (
    <>
      <style>{pulseKeyframes}</style>
      <HexCell col={0} row={0}>
        <div style={{ position: 'relative', width: w, height: h, animation: 'logoPulse 3s ease-in-out infinite' }}>
          <svg
            width={w}
            height={h}
            viewBox={`${-w / 2 - 2} ${-h / 2 - 2} ${w + 4} ${h + 4}`}
            style={{ position: 'absolute', top: -2, left: -2, width: w + 4, height: h + 4 }}
            overflow="visible"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <path d={path} fill="url(#logoGradient)" />
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
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 700,
              userSelect: 'none',
            }}
          >
            AH
          </div>
        </div>
      </HexCell>
    </>
  );
}
