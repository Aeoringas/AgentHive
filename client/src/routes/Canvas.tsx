import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Task } from "@agenthive/shared";
import HexCanvas, { type HexCanvasHandle } from "../components/HexCanvas";
import HexGrid from "../components/HexGrid";
import LogoCell from "../components/LogoCell";
import FunctionCell from "../components/FunctionCell";
import TaskCell from "../components/TaskCell";
import ColumnHeaders from "../components/ColumnHeaders";
import DependencyLines from "../components/DependencyLines";
import SidePanel from "../components/SidePanel";
import Toolbar from "../components/Toolbar";
import ZoomControls from "../components/ZoomControls";
import StatusLegend from "../components/StatusLegend";
import { hexHeight, hexWidth, hexToPixel } from "../utils/hex";
import type { HexCoord } from "../utils/hex";

const STATUS_COLUMNS: Record<string, number> = {
  waiting: -1,
  running: 0,
  paused: 0,
  conflict_resolving: 0,
  needs_intervention: 0,
  interrupted: 0,
  reviewing: 1,
  completed: 2,
};

const COLUMN_DEFS = [
  { col: -2, label: "待办", color: "#9ca3af" },
  { col: -1, label: "任务", color: "#f59e0b" },
  { col: 0, label: "运行中", color: "#eab308" },
  { col: 1, label: "审查", color: "#8b5cf6" },
  { col: 2, label: "完成", color: "#10b981" },
];

const FUNC_COLOR = "#6366f1";

const FUNCTION_DEFS = [
  { col: -3, row: 0, label: "设置" },
  { col: -2, row: 0, label: "Skill" },
  { col: -1, row: 0, label: "对话" },
  { col: 1, row: 0, label: "文件" },
  { col: 2, row: 0, label: "提交" },
  { col: 3, row: 0, label: "用量" },
];

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function assignCanvasPositions(tasks: Task[]): Task[] {
  const columnRows: Record<number, number> = {};
  return tasks.map((task) => {
    if (task.canvas_col != null && task.canvas_row != null) return task;
    const col = STATUS_COLUMNS[task.status] ?? -1;
    const row = (columnRows[col] ?? 1) + 1;
    columnRows[col] = row;
    return { ...task, canvas_col: col, canvas_row: row };
  });
}

function CanvasInner({
  tasks,
  gridVisible,
  depVisible,
  hoveredTaskId,
  funcPositions,
  onTaskClick,
  onTaskDragEnd,
  onTaskHover,
  onFuncDragEnd,
}: {
  tasks: Task[];
  gridVisible: boolean;
  depVisible: boolean;
  hoveredTaskId: string | null;
  funcPositions: Record<string, HexCoord>;
  onTaskClick: (task: Task) => void;
  onTaskDragEnd: (taskId: string, coord: HexCoord) => void;
  onTaskHover: (taskId: string | null) => void;
  onFuncDragEnd: (label: string, coord: HexCoord) => void;
}) {
  return (
    <>
      <HexGrid visible={gridVisible} />
      <DependencyLines tasks={tasks} visible={depVisible} hoveredTaskId={hoveredTaskId} />
      <LogoCell />
      {FUNCTION_DEFS.map((def) => {
        const pos = funcPositions[def.label] ?? { col: def.col, row: def.row };
        return (
          <FunctionCell
            key={def.label}
            col={pos.col}
            row={pos.row}
            label={def.label}
            color={FUNC_COLOR}
            onClick={() => {}}
            onDragEnd={onFuncDragEnd}
          />
        );
      })}
      <ColumnHeaders
        columns={COLUMN_DEFS.map((def) => ({
          ...def,
          count: tasks.filter((t) => (t.canvas_col ?? STATUS_COLUMNS[t.status] ?? -1) === def.col).length,
        }))}
      />
      {tasks.map((task) => (
        <TaskCell
          key={task.id}
          task={task}
          onClick={onTaskClick}
          onDragEnd={onTaskDragEnd}
          onHover={onTaskHover}
        />
      ))}
    </>
  );
}

export function Canvas() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [depVisible, setDepVisible] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [canvasState, setCanvasState] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [funcPositions, setFuncPositions] = useState<Record<string, HexCoord>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HexCanvasHandle>(null);

  useEffect(() => {
    fetch("/api/projects", { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) setProjectId(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/tasks?project_id=${projectId}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setTasks(assignCanvasPositions(data)))
      .catch(() => {});
  }, [projectId]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const handleTaskDragEnd = useCallback((taskId: string, coord: HexCoord) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, canvas_col: coord.col, canvas_row: coord.row } : t))
    );
  }, []);

  const handleFuncDragEnd = useCallback((label: string, coord: HexCoord) => {
    setFuncPositions((prev) => ({ ...prev, [label]: coord }));
  }, []);

  const h = hexHeight();
  const initialPanX = (containerRef.current?.clientWidth ?? window.innerWidth) / 2;
  const initialPanY = h * 0.75 + h / 2;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          position: "relative",
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e1b4b" }}>AgentHive</span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 14,
            padding: "4px 12px",
            borderRadius: 6,
          }}
        >
          退出
        </button>
      </header>

      <div ref={containerRef} style={{ flex: 1, position: "relative" }}>
        <HexCanvas ref={canvasRef} onStateChange={setCanvasState} initialPanX={initialPanX} initialPanY={initialPanY}>
          <CanvasInner
            tasks={tasks}
            gridVisible={gridVisible}
            depVisible={depVisible}
            hoveredTaskId={hoveredTaskId}
            funcPositions={funcPositions}
            onTaskClick={setSelectedTask}
            onTaskDragEnd={handleTaskDragEnd}
            onTaskHover={setHoveredTaskId}
            onFuncDragEnd={handleFuncDragEnd}
          />
        </HexCanvas>

        <SidePanel task={selectedTask} onClose={() => setSelectedTask(null)} />

        <StatusLegend />

        <Toolbar
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((v) => !v)}
          autoExecute={autoExecute}
          onToggleAutoExecute={() => setAutoExecute((v) => !v)}
          onAutoArrange={() => {}}
          onNewIdea={() => {}}
          onNewTask={() => {}}
          onPlan={() => {}}
        />
        <ZoomControls
          zoom={canvasState.zoom}
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onZoomReset={() => canvasRef.current?.zoomReset()}
          onFitAll={() => {
            const allCoords: HexCoord[] = [
              { col: 0, row: 0 },
              ...FUNCTION_DEFS.map((d) => funcPositions[d.label] ?? { col: d.col, row: d.row }),
              ...tasks.map((t) => ({ col: t.canvas_col ?? 0, row: t.canvas_row ?? 2 })),
            ];
            const hw = hexWidth() / 2;
            const hh = hexHeight() / 2;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const c of allCoords) {
              const p = hexToPixel(c);
              if (p.x - hw < minX) minX = p.x - hw;
              if (p.y - hh < minY) minY = p.y - hh;
              if (p.x + hw > maxX) maxX = p.x + hw;
              if (p.y + hh > maxY) maxY = p.y + hh;
            }
            canvasRef.current?.fitAll({ minX, minY, maxX, maxY });
          }}
        />
      </div>
    </div>
  );
}
