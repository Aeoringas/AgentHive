import React, { useState } from 'react';
import { Task, TaskStatus } from '@agenthive/shared';
import HexCell from './HexCell';
import HoneyFill from './HoneyFill';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import type { HexCoord } from '../utils/hex';
import styles from './TaskCell.module.css';

interface TaskCellProps {
  task: Task;
  onClick: (task: Task) => void;
  onHover?: (taskId: string | null) => void;
}

const statusColors: Record<TaskStatus, string> = {
  waiting: 'var(--status-waiting)',
  running: 'var(--status-running)',
  paused: 'var(--status-paused)',
  reviewing: 'var(--status-reviewing)',
  completed: 'var(--status-completed)',
  needs_intervention: 'var(--status-intervention)',
  interrupted: 'var(--status-interrupted)',
  conflict_resolving: 'var(--status-conflict)',
};

function getProgress(status: TaskStatus): number {
  switch (status) {
    case 'waiting': return 0;
    case 'running': return 40;
    case 'needs_intervention': return 40;
    case 'conflict_resolving': return 40;
    case 'reviewing': return 90;
    case 'completed': return 100;
    case 'paused': return 30;
    case 'interrupted': return 30;
  }
}

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function TaskCell({ task, onClick, onHover }: TaskCellProps) {
  const [hovered, setHovered] = useState(false);
  const q = task.canvas_q ?? 0;
  const r = task.canvas_r ?? 2;
  const coord: HexCoord = { q, r };
  const isIntervention = task.status === 'needs_intervention';
  const isInterrupted = task.status === 'interrupted';
  const isRunning = task.status === 'running';

  const cellStyle: React.CSSProperties = {
    transform: hovered ? 'scale(1.06)' : 'scale(1)',
    transition: `transform var(--duration-fast) var(--ease-default)`,
    zIndex: hovered ? 10 : 1,
  };

  const innerClasses = [
    styles.inner,
    isIntervention ? styles.intervention : '',
    isInterrupted ? styles.interrupted : '',
  ].filter(Boolean).join(' ');

  return (
    <HexCell
      coord={coord}
      onClick={() => onClick(task)}
      style={cellStyle}
    >
      <div
        className={innerClasses}
        onMouseEnter={() => { setHovered(true); onHover?.(task.id); }}
        onMouseLeave={() => { setHovered(false); onHover?.(null); }}
      >
        <HoneyFill progress={getProgress(task.status)} status={task.status} />
        <svg
          className={styles.svg}
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          overflow="visible"
        >
          <path
            d={path}
            className={styles.hexBorder}
            style={{ '--border-color': statusColors[task.status] } as React.CSSProperties}
            fill="none"
          />
        </svg>
        {isInterrupted && <div className={styles.interruptedOverlay} />}
        <div className={styles.content}>
          <div className={styles.taskName}>{task.name}</div>
          {isRunning && task.current_phase && (
            <div className={styles.phase}>{task.current_phase}</div>
          )}
        </div>
      </div>
    </HexCell>
  );
}
