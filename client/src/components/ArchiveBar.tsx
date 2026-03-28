import { useState } from 'react';
import type { Task } from '@agenthive/shared';
import { hexPath } from '../utils/hex';
import styles from './ArchiveBar.module.css';

interface ArchiveBarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const miniSize = 28;
const miniPath = hexPath(miniSize);
const miniW = Math.sqrt(3) * miniSize;
const miniH = 2 * miniSize;

function MiniHex({ task, onClick }: { task: Task; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const firstChar = task.name.charAt(0);

  return (
    <div
      className={styles.miniHex}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width={miniW}
        height={miniH}
        viewBox={`${-miniW / 2} ${-miniH / 2} ${miniW} ${miniH}`}
      >
        <path d={miniPath} fill="var(--honey-500)" />
        <path
          d={miniPath}
          fill="none"
          stroke="var(--wax-dark)"
          strokeWidth={2}
        />
      </svg>
      <div className={styles.miniHexChar}>{firstChar}</div>
      {hovered && (
        <div className={styles.tooltip}>
          {task.name} - {new Date(task.updated_at).toLocaleString('zh-CN')}
        </div>
      )}
    </div>
  );
}

export default function ArchiveBar({ tasks, onTaskClick }: ArchiveBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${styles.archiveBar} ${expanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.header} onClick={() => setExpanded(v => !v)}>
        <span className={styles.headerLabel}>归档 ({tasks.length})</span>
        <button className={`${styles.toggleBtn} ${expanded ? styles.toggleBtnExpanded : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 4.5L6 8.5L10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className={styles.scrollArea}>
          {tasks.map(task => (
            <MiniHex key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      )}
    </div>
  );
}
