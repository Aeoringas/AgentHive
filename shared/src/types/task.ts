export type TaskStatus =
  | 'waiting'
  | 'running'
  | 'paused'
  | 'conflict_resolving'
  | 'reviewing'
  | 'interrupted'
  | 'completed'
  | 'needs_intervention';

export type TaskType = 'frontend' | 'backend' | 'fullstack';

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  interrupted_status: TaskStatus | null;
  sort_order: number;
  dependencies: string[];
  requirement_doc: string | null;
  technical_plan: string | null;
  worktree_branch: string | null;
  current_phase: string | null;
  canvas_q: number | null;
  canvas_r: number | null;
  created_at: string;
  updated_at: string;
}
