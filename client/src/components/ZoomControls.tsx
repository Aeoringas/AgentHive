import styles from './ZoomControls.module.css';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitAll: () => void;
}

export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onZoomReset, onFitAll }: ZoomControlsProps) {
  return (
    <div className={styles.container}>
      <button className={styles.btn} onClick={onZoomIn} title="放大">+</button>
      <div className={styles.zoomLabel}>
        {Math.round(zoom * 100)}%
      </div>
      <button className={styles.btn} onClick={onZoomOut} title="缩小">-</button>
      <button className={styles.btn} onClick={onZoomReset} title="归位">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          <line x1="7" y1="0" x2="7" y2="3" stroke="currentColor" strokeWidth="1.2" />
          <line x1="7" y1="11" x2="7" y2="14" stroke="currentColor" strokeWidth="1.2" />
          <line x1="0" y1="7" x2="3" y2="7" stroke="currentColor" strokeWidth="1.2" />
          <line x1="11" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      <button className={styles.btn} onClick={onFitAll} title="适应全部">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <polyline points="1,4.5 1,1 4.5,1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="9.5,1 13,1 13,4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="13,9.5 13,13 9.5,13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="4.5,13 1,13 1,9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
