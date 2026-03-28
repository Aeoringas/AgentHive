import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Task } from "@agenthive/shared";
import HexCanvas from "../components/HexCanvas";
import HexGrid from "../components/HexGrid";
import LogoCell from "../components/LogoCell";
import FunctionCell from "../components/FunctionCell";
import TaskCell from "../components/TaskCell";
import ColumnHeaders from "../components/ColumnHeaders";
import Toolbar from "../components/Toolbar";
import ZoomControls from "../components/ZoomControls";

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

export function Canvas() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [autoExecute, setAutoExecute] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetch("/api/projects", { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setProjectId(data[0].id);
        }
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

  const columnCounts = COLUMN_DEFS.map((def) => ({
    ...def,
    count: tasks.filter((t) => {
      const col = t.canvas_col ?? STATUS_COLUMNS[t.status] ?? -1;
      return col === def.col;
    }).length,
  }));

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1))), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1))), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

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

      <div style={{ flex: 1, position: "relative" }}>
        <HexCanvas>
          <HexGrid visible={gridVisible} rows={12} cols={8} />
          <LogoCell />
          <FunctionCell col={-3} label="设置" onClick={() => {}} />
          <FunctionCell col={-2} label="Skill" onClick={() => {}} />
          <FunctionCell col={-1} label="对话" onClick={() => {}} />
          <FunctionCell col={1} label="文件" onClick={() => {}} />
          <FunctionCell col={2} label="提交" onClick={() => {}} />
          <FunctionCell col={3} label="用量" onClick={() => {}} />
          <ColumnHeaders columns={columnCounts} />
          {tasks.map((task) => (
            <TaskCell key={task.id} task={task} onClick={setSelectedTask} />
          ))}
        </HexCanvas>

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
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onFitAll={() => {}}
        />
      </div>
    </div>
  );
}
