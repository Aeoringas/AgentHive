import React from 'react';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import styles from './LogoCell.module.css';

const logoSize = HEX_SIZE * 1.3;
const w = hexWidth();
const h = hexHeight();
const logoW = Math.sqrt(3) * logoSize;
const logoH = 2 * logoSize;
const path = hexPath(logoSize);

export default function LogoCell() {
  return (
    <HexCell
      coord={{ q: 0, r: 0 }}
      style={{
        '--hex-width': logoW + 'px',
        '--hex-height': logoH + 'px',
      } as React.CSSProperties}
    >
      <div className={styles.wrapper}>
        <svg
          className={styles.svg}
          viewBox={`${-logoW / 2} ${-logoH / 2} ${logoW} ${logoH}`}
          overflow="visible"
        >
          <defs>
            <radialGradient id="logoRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--honey-500)" />
              <stop offset="100%" stopColor="var(--honey-700)" />
            </radialGradient>
          </defs>
          <path d={path} fill="url(#logoRadial)" />
        </svg>
        <div className={styles.label}>AH</div>
      </div>
    </HexCell>
  );
}
