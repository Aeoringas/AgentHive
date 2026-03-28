export interface GeneralSettings {
  max_parallel_worktrees: number;
  auto_execute: boolean;
  consecutive_failure_limit: number;
  no_output_timeout_min: number;
  task_max_duration_min: number;
  subscription_tier: 'pro' | 'max5' | 'max20';
  budget_warning_threshold: number;
  default_model: string;
  auto_resolve_conflicts: boolean;
  upload_size_limit_mb: number;
  language: 'zh' | 'en';
}

export interface Settings {
  id: string;
  general: GeneralSettings;
  created_at: string;
  updated_at: string;
}
