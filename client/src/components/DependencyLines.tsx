import React, { useMemo } from "react";
import { hexToPixel } from "../utils/hex";
import type { Task } from "@agenthive/shared";

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
      if (task.canvas_col == null || task.canvas_row == null) continue;
      const end = hexToPixel({ col: task.canvas_col, row: task.canvas_row });

      for (const depId of task.dependencies) {
        const upstream = taskMap.get(depId);
        if (!upstream || upstream.canvas_col == null || upstream.canvas_row == null)
          continue;
        const start = hexToPixel({
          col: upstream.canvas_col,
          row: upstream.canvas_row,
        });
        result.push({
          id: `${depId}->${task.id}`,
          sx: start.x,
          sy: start.y,
          ex: end.x,
          ey: end.y,
          completed: upstream.status === "done",
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
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 0,
      }}
    >
      <defs>
        <marker
          id="dep-arrow-green"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#10b981" />
        </marker>
        <marker
          id="dep-arrow-gray"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#d1d5db" />
        </marker>
      </defs>
      {lines.map((line) => {
        const dx = (line.ex - line.sx) * 0.4;
        const cx1 = line.sx + dx;
        const cy1 = line.sy;
        const cx2 = line.ex - dx;
        const cy2 = line.ey;
        const d = `M${line.sx},${line.sy} C${cx1},${cy1} ${cx2},${cy2} ${line.ex},${line.ey}`;
        const color = line.completed ? "#10b981" : "#d1d5db";
        const marker = line.completed
          ? "url(#dep-arrow-green)"
          : "url(#dep-arrow-gray)";

        let opacity = 1;
        if (hoveredTaskId != null) {
          opacity = relatedToHover(line) ? 1 : 0.15;
        }

        return (
          <path
            key={line.id}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray={line.completed ? undefined : "6 4"}
            markerEnd={marker}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}
