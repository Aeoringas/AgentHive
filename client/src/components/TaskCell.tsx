import React, { useState } from 'react';
import { Task, TaskStatus } from '@agenthive/shared';
import HexCell from './HexCell';
import { hexPath, hexWidth, hexHeight, HEX_SIZE } from '../utils/hex';

interface TaskCellProps {
  task: Task;
  onClick: (task: Task) => void;
}

const statusColors: Record<TaskStatus, string> = {
  waiting: '#9ca3af',
  running: '#f59e0b',
  paused: '#f59e0b',
  reviewing: '#8b5cf6',
  completed: '#10b981',
  needs_intervention: '#ef4444',
  interrupted: '#6b7280',
  conflict_resolving: '#f59e0b',
};

const w = hexWidth();
const h = hexHeight();
const path = hexPath(HEX_SIZE);

export default function TaskCell({ task, onClick }: TaskCellProps) {
  const [hovered, setHovered] = useState(false);
  const col = task.canvas_col ?? 0;
  const row = task.canvas_row ?? 2;
  const color = statusColors[task.status];
  const isIntervention = task.status === 'needs_intervention';

  return (
    <HexCell
      col={col}
      row={row}
      onClick={() => onClick(task)}
      style={{
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.15s ease',
        zIndex: hovered ? 10 : 1,
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', width: w, height: h }}
      >
        <svg
          width={w}
          height={h}
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <path
            d={path}
            fill="rgba(255,255,255,0.8)"
            stroke={color}
            strokeWidth={isIntervention ? 3 : 1.5}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: w,
            height: h,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 10px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#1f2937',
              textAlign: 'center',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.3',
              maxWidth: '100%',
            }}
          >
            {task.name}
          </div>
          {task.current_phase && (
            <div
              style={{
                fontSize: 10,
                color: '#9ca3af',
                marginTop: 2,
                textAlign: 'center',
              }}
            >
              {task.current_phase}
            </div>
          )}
        </div>
      </div>
    </HexCell>
  );
}
