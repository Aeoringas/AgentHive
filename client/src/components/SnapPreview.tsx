import { hexToPixel, hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import type { HexCoord } from '../utils/hex';
import styles from './SnapPreview.module.css';

interface SnapPreviewProps {
  coord: HexCoord;
}

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function SnapPreview({ coord }: SnapPreviewProps) {
  const px = hexToPixel(coord);

  const style = {
    '--hex-x': px.x + 'px',
    '--hex-y': px.y + 'px',
    '--hex-width': w + 'px',
    '--hex-height': h + 'px',
  } as React.CSSProperties;

  return (
    <div className={styles.preview} style={style}>
      <svg
        className={styles.svg}
        viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
        overflow="visible"
      >
        <path d={path} className={styles.hex} />
      </svg>
    </div>
  );
}
