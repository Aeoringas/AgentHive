export interface Notification {
  id: string;
  type: string;
  task_id: string | null;
  session_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}
