import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '@agenthive/shared';
import HexCell from './HexCell';
import HoneyFill from './HoneyFill';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';
import type { HexCoord } from '../utils/hex';
import { useDrag } from '../hooks/useDrag';
import styles from './TaskCell.module.css';

interface TaskCellProps {
  task: Task;
  onClick: (task: Task) => void;
  onHover?: (taskId: string | null) => void;
  onDragEnd?: (taskId: string, coord: HexCoord) => void;
  onSnapPreview?: (preview: HexCoord | null) => void;
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

export default function TaskCell({ task, onClick, onHover, onDragEnd, onSnapPreview }: TaskCellProps) {
  const [hovered, setHovered] = useState(false);
  const q = task.canvas_q ?? 0;
  const r = task.canvas_r ?? 2;
  const coord: HexCoord = { q, r };
  const isIntervention = task.status === 'needs_intervention';
  const isInterrupted = task.status === 'interrupted';
  const isRunning = task.status === 'running';

  const { isDragging, dragOffset, snapPreview, suppressTransition, handleMouseDown } = useDrag({
    currentCoord: coord,
    onDragEnd: (newCoord) => onDragEnd?.(task.id, newCoord),
  });

  useEffect(() => {
    onSnapPreview?.(snapPreview);
  }, [snapPreview?.q, snapPreview?.r]);

  const cellStyle: React.CSSProperties = isDragging
    ? {
        transform: `translate(${dragOffset!.x}px, ${dragOffset!.y}px)`,
        opacity: 0.8,
        zIndex: 100,
      }
    : {
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
        transition: suppressTransition ? 'none' : `transform var(--duration-fast) var(--ease-default)`,
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
      onClick={isDragging ? undefined : () => onClick(task)}
      style={cellStyle}
    >
      <div
        className={innerClasses}
        onMouseEnter={() => { setHovered(true); onHover?.(task.id); }}
        onMouseLeave={() => { setHovered(false); onHover?.(null); }}
        onMouseDown={handleMouseDown}
      >
        <HoneyFill progress={getProgress(task.status)} status={task.status} />
        <svg
          className={styles.svg}
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          overflow="visible"
        >
          <defs>
            <linearGradient id={`taskSheen-${task.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.12" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={path}
            className={styles.hexBorder}
            style={{ '--border-color': statusColors[task.status] } as React.CSSProperties}
            fill="none"
          />
          <path d={path} fill={`url(#taskSheen-${task.id})`} className={styles.hexSheen} />
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
