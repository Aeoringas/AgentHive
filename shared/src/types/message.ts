export type MessageType =
  | 'normal'
  | 'subagent_card'
  | 'task_checklist'
  | 'planning_suggestion'
  | 'system';

export type SenderType = 'user' | 'main_agent' | 'sub_agent';

export interface Message {
  id: string;
  session_id: string;
  message_type: MessageType;
  sender_type: SenderType;
  subagent_type: string | null;
  content: string;
  attachments: string | null;
  created_at: string;
}
