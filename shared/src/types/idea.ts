export type IdeaStatus = 'pending' | 'archived';

export interface Idea {
  id: string;
  project_id: string;
  description: string;
  status: IdeaStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}
