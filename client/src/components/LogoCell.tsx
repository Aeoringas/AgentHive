import React from 'react';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import styles from './LogoCell.module.css';

const w = hexWidth();
const h = hexHeight();
const outerPath = hexPath(HEX_SIZE);

export default function LogoCell() {
  return (
    <HexCell coord={{ q: 0, r: 0 }}>
      <div className={styles.wrapper}>
        <svg
          className={styles.svg}
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          overflow="visible"
        >
          <path d={outerPath} className={styles.hexBg} />
          <path d={outerPath} className={styles.hexBorder} />
          <g className={styles.bee} transform="translate(0, 2)">
            {/* 翅膀 - 尖叶形 */}
            <path d="M -4 -6 Q -22 -18 -14 0 Q -10 4 -4 -2 Z" />
            <path d="M 4 -6 Q 22 -18 14 0 Q 10 4 4 -2 Z" />
            {/* 头 - 倒三角圆角 */}
            <path d="M 0 -19 C -6 -19 -7 -14 -5 -10 L 0 -7 L 5 -10 C 7 -14 6 -19 0 -19 Z" />
            {/* 胸 - 菱形 */}
            <path d="M 0 -7 L -7 -2 L 0 3 L 7 -2 Z" />
            {/* 腹 - 尖底椭圆 */}
            <path d="M -8 6 C -8 2 -5 0 0 0 C 5 0 8 2 8 6 C 8 14 4 22 0 22 C -4 22 -8 14 -8 6 Z" />
            {/* 腹部条纹 */}
            <line x1={-7} y1={6} x2={7} y2={6} />
            <line x1={-8} y1={11} x2={8} y2={11} />
            <line x1={-6} y1={16} x2={6} y2={16} />
            {/* 王冠 - 三尖 */}
            <path d="M -6 -19 L -4 -26 L 0 -21 L 4 -26 L 6 -19" />
          </g>
        </svg>
      </div>
    </HexCell>
  );
}
