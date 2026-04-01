export type SubAgentStatus = 'running' | 'completed' | 'failed';

export interface SubAgentRecord {
  id: string;
  task_id: string;
  session_id: string;
  subagent_type: string;
  skills: string[];
  status: SubAgentStatus;
  input_summary: string;
  output_summary: string | null;
  started_at: string;
  finished_at: string | null;
}
