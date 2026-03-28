import { useState } from 'react';
import styles from './StatusLegend.module.css';

const STATUS_ITEMS = [
  { color: 'var(--status-running)', label: '运行中' },
  { color: 'var(--status-reviewing)', label: '审查中' },
  { color: 'var(--status-waiting)', label: '待执行' },
  { color: 'var(--status-completed)', label: '已完成' },
  { color: 'var(--status-intervention)', label: '需介入' },
  { color: 'var(--status-interrupted)', label: '已中断' },
];

export default function StatusLegend() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={styles.container} onClick={() => setCollapsed((v) => !v)}>
      {collapsed ? (
        <div className={styles.iconWrapper}>
          <div className={styles.dotGrid}>
            {STATUS_ITEMS.slice(0, 4).map((item) => (
              <div
                key={item.label}
                className={styles.miniDot}
                style={{ background: item.color }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {STATUS_ITEMS.map((item) => (
            <div key={item.label} className={styles.item}>
              <div className={styles.dot} style={{ background: item.color }} />
              <span className={styles.label}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
