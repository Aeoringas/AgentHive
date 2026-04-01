import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Task, TaskStatus, Project } from "@agenthive/shared";
import HexCanvas, { type HexCanvasHandle } from "../components/HexCanvas";
import HexGrid from "../components/HexGrid";
import LogoCell from "../components/LogoCell";
import FunctionCell from "../components/FunctionCell";
import TaskCell from "../components/TaskCell";
import SnapPreview from "../components/SnapPreview";
import DependencyLines from "../components/DependencyLines";
import SidePanel from "../components/SidePanel";
import Toolbar from "../components/Toolbar";
import ZoomControls from "../components/ZoomControls";
import StatusLegend from "../components/StatusLegend";
import TopBar from "../components/TopBar";
import ArchiveBar from "../components/ArchiveBar";
import CommitOverlay from "../components/CommitOverlay";
import UsageOverlay from "../components/UsageOverlay";
import { hexHeight, hexWidth, hexToPixel, ringCoords } from "../utils/hex";
import type { HexCoord } from "../utils/hex";

const FUNCTION_DEFS: { q: number; r: number; label: string }[] = [
  { q: 1, r: 0, label: "\u5bf9\u8bdd" },
  { q: 0, r: 1, label: "\u6587\u4ef6" },
  { q: -1, r: 1, label: "Skill" },
  { q: -1, r: 0, label: "\u8bbe\u7f6e" },
  { q: 0, r: -1, label: "\u63d0\u4ea4" },
  { q: 1, r: -1, label: "\u7528\u91cf" },
];

const RING_2_STATUSES: TaskStatus[] = ['running', 'needs_intervention', 'conflict_resolving', 'paused'];
const RING_3_STATUSES: TaskStatus[] = ['reviewing'];
const RING_4_STATUSES: TaskStatus[] = ['waiting'];

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function assignRingPositions(tasks: Task[]): Task[] {
  const manuallyPositioned = new Set<string>();
  const result = tasks.map(t => {
    if (t.canvas_q != null && t.canvas_r != null) {
      manuallyPositioned.add(`${t.canvas_q},${t.canvas_r}`);
    }
    return { ...t };
  });

  const ring2Coords = ringCoords(2);
  const ring3Coords = ringCoords(3);
  const ring4Coords = ringCoords(4);

  function nextAvailable(coords: HexCoord[], idx: { value: number }): HexCoord | null {
    while (idx.value < coords.length) {
      const c = coords[idx.value];
      const key = `${c.q},${c.r}`;
      idx.value++;
      if (!manuallyPositioned.has(key)) {
        manuallyPositioned.add(key);
        return c;
      }
    }
    return null;
  }

  const r2Idx = { value: 0 };
  const r3Idx = { value: 0 };
  const r4Idx = { value: 0 };

  for (const task of result) {
    if (task.status === 'completed') continue;
    if (task.status === 'interrupted') continue;
    if (task.canvas_q != null && task.canvas_r != null) continue;

    let coord: HexCoord | null = null;

    if (RING_2_STATUSES.includes(task.status)) {
      coord = nextAvailable(ring2Coords, r2Idx);
      if (!coord) coord = nextAvailable(ring3Coords, r3Idx);
    } else if (RING_3_STATUSES.includes(task.status)) {
      coord = nextAvailable(ring3Coords, r3Idx);
      if (!coord) coord = nextAvailable(ring4Coords, r4Idx);
    } else if (RING_4_STATUSES.includes(task.status)) {
      coord = nextAvailable(ring4Coords, r4Idx);
    }

    if (coord) {
      task.canvas_q = coord.q;
      task.canvas_r = coord.r;
    }
  }

  for (const task of result) {
    if (task.status === 'interrupted' && task.canvas_q == null) {
      const coord = nextAvailable(ring2Coords, r2Idx)
        ?? nextAvailable(ring3Coords, r3Idx)
        ?? nextAvailable(ring4Coords, r4Idx);
      if (coord) {
        task.canvas_q = coord.q;
        task.canvas_r = coord.r;
      }
    }
  }

  return result;
}

function CanvasInner({
  tasks,
  gridVisible,
  depVisible,
  hoveredTaskId,
  funcPositions,
  snapPreview,
  onTaskClick,
  onTaskHover,
  onTaskDragEnd,
  onFuncClick,
  onFuncDragEnd,
  onSnapPreview,
}: {
  tasks: Task[];
  gridVisible: boolean;
  depVisible: boolean;
  hoveredTaskId: string | null;
  funcPositions: Record<string, HexCoord>;
  snapPreview: HexCoord | null;
  onTaskClick: (task: Task) => void;
  onTaskHover: (taskId: string | null) => void;
  onTaskDragEnd: (taskId: string, coord: HexCoord) => void;
  onFuncClick: (label: string) => void;
  onFuncDragEnd: (label: string, coord: HexCoord) => void;
  onSnapPreview: (preview: HexCoord | null) => void;
}) {
  return (
    <>
      <HexGrid visible={gridVisible} />
      <DependencyLines tasks={tasks} visible={depVisible} hoveredTaskId={hoveredTaskId} />
      {snapPreview && <SnapPreview coord={snapPreview} />}
      <LogoCell />
      {FUNCTION_DEFS.map((def) => {
        const pos = funcPositions[def.label] ?? { q: def.q, r: def.r };
        return (
          <FunctionCell
            key={def.label}
            coord={pos}
            label={def.label}
            onClick={() => onFuncClick(def.label)}
            onDragEnd={onFuncDragEnd}
            onSnapPreview={onSnapPreview}
          />
        );
      })}
      {tasks.map((task) => (
        <TaskCell
          key={task.id}
          task={task}
          onClick={onTaskClick}
          onHover={onTaskHover}
          onDragEnd={onTaskDragEnd}
          onSnapPreview={onSnapPreview}
        />
      ))}
    </>
  );
}

export function Canvas() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gridVisible, setGridVisible] = useState(true);
  const [depVisible, setDepVisible] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [canvasState, setCanvasState] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [snapPreview, setSnapPreview] = useState<HexCoord | null>(null);
  const [funcPositions, setFuncPositions] = useState<Record<string, HexCoord>>({});
  const [commitOverlayVisible, setCommitOverlayVisible] = useState(false);
  const [usageOverlayVisible, setUsageOverlayVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HexCanvasHandle>(null);

  useEffect(() => {
    fetch("/api/projects", { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        const list: Project[] = data.projects ?? [];
        setProjects(list);
        if (list.length > 0) setProjectId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/tasks?project_id=${projectId}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setTasks(assignRingPositions(data)))
      .catch(() => {});
  }, [projectId]);

  const handleTaskDragEnd = useCallback((taskId: string, coord: HexCoord) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, canvas_q: coord.q, canvas_r: coord.r } : t
    ));
    setSnapPreview(null);
    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ canvas_q: coord.q, canvas_r: coord.r }),
    }).catch(() => {});
  }, []);

  const handleFuncDragEnd = useCallback((label: string, coord: HexCoord) => {
    setFuncPositions(prev => ({ ...prev, [label]: coord }));
    setSnapPreview(null);
  }, []);

  const handleProjectChange = useCallback((id: string) => {
    setProjectId(id);
    fetch(`/api/projects/${id}/access`, { method: 'POST', headers: getAuthHeaders() })
      .then(() => {
        setProjects(prev => {
          const source = prev.filter(p => p.is_source);
          const target = prev.find(p => p.id === id && !p.is_source);
          const rest = prev.filter(p => !p.is_source && p.id !== id);
          return [...source, ...(target ? [target] : []), ...rest];
        });
      })
      .catch(() => {});
  }, []);

  const handleCreateProject = useCallback((data: { name: string; description: string; repo_path: string }) => {
    fetch('/api/projects', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(result => {
        if (result.project) {
          setProjects(prev => {
            const source = prev.filter(p => p.is_source);
            const rest = prev.filter(p => !p.is_source);
            return [...source, result.project, ...rest];
          });
          setProjectId(result.project.id);
        }
      })
      .catch(() => {});
  }, []);

  const handleDeleteProject = useCallback((id: string) => {
    fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
      .then(res => {
        if (!res.ok) return;
        setProjects(prev => {
          const next = prev.filter(p => p.id !== id);
          if (projectId === id && next.length > 0) {
            setProjectId(next[0].id);
          }
          return next;
        });
      })
      .catch(() => {});
  }, [projectId]);

  const handleFuncClick = useCallback((label: string) => {
    if (label === '\u63d0\u4ea4') setCommitOverlayVisible(true);
    if (label === '\u7528\u91cf') setUsageOverlayVisible(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const initialPanX = (containerRef.current?.clientWidth ?? window.innerWidth) / 2;
  const initialPanY = (containerRef.current?.clientHeight ?? (window.innerHeight - 48)) / 2;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar
        projects={projects}
        currentProjectId={projectId}
        onProjectChange={handleProjectChange}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onLogout={handleLogout}
      />

      <div ref={containerRef} style={{ flex: 1, position: "relative" }}>
        <HexCanvas ref={canvasRef} onStateChange={setCanvasState} initialPanX={initialPanX} initialPanY={initialPanY}>
          <CanvasInner
            tasks={activeTasks}
            gridVisible={gridVisible}
            depVisible={depVisible}
            hoveredTaskId={hoveredTaskId}
            funcPositions={funcPositions}
            snapPreview={snapPreview}
            onTaskClick={setSelectedTask}
            onTaskHover={setHoveredTaskId}
            onTaskDragEnd={handleTaskDragEnd}
            onFuncClick={handleFuncClick}
            onFuncDragEnd={handleFuncDragEnd}
            onSnapPreview={setSnapPreview}
          />
        </HexCanvas>

        <ArchiveBar tasks={completedTasks} onTaskClick={setSelectedTask} />

        <SidePanel task={selectedTask} onClose={() => setSelectedTask(null)} />

        <CommitOverlay
          visible={commitOverlayVisible}
          onClose={() => setCommitOverlayVisible(false)}
          projectId={projectId}
        />

        <UsageOverlay
          visible={usageOverlayVisible}
          onClose={() => setUsageOverlayVisible(false)}
        />

        <StatusLegend />

        <Toolbar
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((v) => !v)}
          depVisible={depVisible}
          onToggleDep={() => setDepVisible((v) => !v)}
          autoExecute={autoExecute}
          onToggleAutoExecute={() => setAutoExecute((v) => !v)}
          onAutoArrange={() => {}}
          onAnalyze={() => {}}
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
              { q: 0, r: 0 },
              ...FUNCTION_DEFS.map((d) => {
                const pos = funcPositions[d.label];
                return pos ?? { q: d.q, r: d.r };
              }),
              ...activeTasks.map((t) => ({ q: t.canvas_q ?? 0, r: t.canvas_r ?? 2 })),
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
