export type SessionType = 'auxiliary' | 'planning' | 'task' | 'governance';

export interface Session {
  id: string;
  type: SessionType;
  title: string;
  task_id: string | null;
  project_id: string;
  status: 'active' | 'paused' | 'completed';
  is_archived: boolean;
  token_total: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
