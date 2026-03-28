import { useMemo } from "react";
import { hexToPixel } from "../utils/hex";
import type { Task } from "@agenthive/shared";
import styles from './DependencyLines.module.css';

interface DependencyLinesProps {
  tasks: Task[];
  visible: boolean;
  hoveredTaskId: string | null;
}

interface Line {
  id: string;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  completed: boolean;
  fromId: string;
  toId: string;
}

export default function DependencyLines({
  tasks,
  visible,
  hoveredTaskId,
}: DependencyLinesProps) {
  const lines = useMemo(() => {
    const taskMap = new Map<string, Task>();
    for (const t of tasks) {
      taskMap.set(t.id, t);
    }

    const result: Line[] = [];
    for (const task of tasks) {
      if (task.canvas_q == null || task.canvas_r == null) continue;
      const end = hexToPixel({ q: task.canvas_q, r: task.canvas_r });

      for (const depId of task.dependencies) {
        const upstream = taskMap.get(depId);
        if (!upstream || upstream.canvas_q == null || upstream.canvas_r == null)
          continue;
        const start = hexToPixel({
          q: upstream.canvas_q,
          r: upstream.canvas_r,
        });
        result.push({
          id: `${depId}->${task.id}`,
          sx: start.x,
          sy: start.y,
          ex: end.x,
          ey: end.y,
          completed: upstream.status === "completed",
          fromId: depId,
          toId: task.id,
        });
      }
    }
    return result;
  }, [tasks]);

  if (!visible) return null;

  const relatedToHover = (line: Line) =>
    hoveredTaskId != null &&
    (line.fromId === hoveredTaskId || line.toId === hoveredTaskId);

  return (
    <svg className={styles.svg}>
      <defs>
        <marker
          id="dep-arrow-completed"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--status-completed)" />
        </marker>
        <marker
          id="dep-arrow-pending"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--wax-dark)" />
        </marker>
      </defs>
      {lines.map((line) => {
        const dx = (line.ex - line.sx) * 0.4;
        const cx1 = line.sx + dx;
        const cy1 = line.sy;
        const cx2 = line.ex - dx;
        const cy2 = line.ey;
        const d = `M${line.sx},${line.sy} C${cx1},${cy1} ${cx2},${cy2} ${line.ex},${line.ey}`;
        const marker = line.completed
          ? "url(#dep-arrow-completed)"
          : "url(#dep-arrow-pending)";

        let opacityClass = '';
        if (hoveredTaskId != null) {
          opacityClass = relatedToHover(line) ? styles.highlighted : styles.dimmed;
        }

        const lineClass = line.completed ? styles.lineCompleted : styles.linePending;

        return (
          <path
            key={line.id}
            d={d}
            className={`${lineClass}${opacityClass ? ` ${opacityClass}` : ''}`}
            markerEnd={marker}
          />
        );
      })}
    </svg>
  );
}
