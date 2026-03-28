import React, { useMemo } from 'react';
import { Task, TaskStatus } from '@agenthive/shared';
import { hexToPixel, hexWidth, hexHeight } from '../utils/hex';

interface MiniMapProps {
  tasks: Task[];
  canvasState: { panX: number; panY: number; zoom: number };
  containerWidth: number;
  containerHeight: number;
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

const MAP_W = 160;
const MAP_H = 120;
const PAD = 8;

const FUNC_CELLS: { col: number; row: number }[] = [
  { col: 0, row: -1 },
  { col: -1, row: 0 },
  { col: 0, row: 0 },
  { col: -1, row: 1 },
  { col: 0, row: 1 },
];

export default function MiniMap({ tasks, canvasState, containerWidth, containerHeight }: MiniMapProps) {
  const hw = hexWidth() / 2;
  const hh = hexHeight() / 2;

  const { dots, viewBox, vpRect } = useMemo(() => {
    const allPoints: { x: number; y: number; color: string }[] = [];

    const logoPos = hexToPixel({ col: 0, row: 0 });
    allPoints.push({ x: logoPos.x, y: logoPos.y, color: '#8b5cf6' });

    for (const fc of FUNC_CELLS) {
      const p = hexToPixel(fc);
      allPoints.push({ x: p.x, y: p.y, color: '#d1d5db' });
    }

    for (const t of tasks) {
      const col = t.canvas_col ?? 0;
      const row = t.canvas_row ?? 2;
      const p = hexToPixel({ col, row });
      allPoints.push({ x: p.x, y: p.y, color: statusColors[t.status] });
    }

    if (allPoints.length === 0) {
      return { dots: [], viewBox: '0 0 160 120', vpRect: null };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of allPoints) {
      if (p.x - hw < minX) minX = p.x - hw;
      if (p.x + hw > maxX) maxX = p.x + hw;
      if (p.y - hh < minY) minY = p.y - hh;
      if (p.y + hh > maxY) maxY = p.y + hh;
    }

    const rangeW = maxX - minX || 1;
    const rangeH = maxY - minY || 1;
    const innerW = MAP_W - PAD * 2;
    const innerH = MAP_H - PAD * 2;
    const scale = Math.min(innerW / rangeW, innerH / rangeH);

    const mappedDots = allPoints.map((p) => ({
      cx: PAD + (p.x - minX) * scale + (innerW - rangeW * scale) / 2,
      cy: PAD + (p.y - minY) * scale + (innerH - rangeH * scale) / 2,
      color: p.color,
    }));

    const { panX, panY, zoom } = canvasState;
    const vpLeft = (-panX / zoom - minX) * scale + PAD + (innerW - rangeW * scale) / 2;
    const vpTop = (-panY / zoom - minY) * scale + PAD + (innerH - rangeH * scale) / 2;
    const vpW = (containerWidth / zoom) * scale;
    const vpH = (containerHeight / zoom) * scale;

    return {
      dots: mappedDots,
      viewBox: `0 0 ${MAP_W} ${MAP_H}`,
      vpRect: { x: vpLeft, y: vpTop, w: vpW, h: vpH },
    };
  }, [tasks, canvasState, containerWidth, containerHeight, hw, hh]);

  return (
    <div
      style={{
        position: 'fixed',
        left: 20,
        bottom: 20,
        width: MAP_W,
        height: MAP_H,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
        zIndex: 40,
      }}
    >
      <svg width={MAP_W} height={MAP_H} viewBox={viewBox}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={2.5} fill={d.color} />
        ))}
        {vpRect && (
          <rect
            x={vpRect.x}
            y={vpRect.y}
            width={vpRect.w}
            height={vpRect.h}
            stroke="#4f46e5"
            strokeWidth={1}
            fill="rgba(79,70,229,0.08)"
            rx={1}
          />
        )}
      </svg>
    </div>
  );
}
