export type TrackingStatus = 'FOCUS' | 'ALLOWED' | 'DIVERTED';

export interface Subject {
  id: string;
  name: string;
  color_hex: string;
  created_at: number;
  seconds_today?: number;
}

export type RuleType = 'process' | 'window_title';

export interface WhitelistRule {
  id: string;
  subject_id: string | null; // null means global rule
  rule_type: RuleType;
  pattern: string;
}

export type SessionStatus = 'in_progress' | 'completed' | 'discarded';

export interface StudySession {
  id: string;
  subject_id: string;
  start_time_utc: number;
  end_time_utc: number | null;
  pure_focus_sec: number;
  allowed_usage_sec: number;
  diverted_sec: number;
  logical_date: string; // 'YYYY-MM-DD' calculated via user rollover
  status: SessionStatus;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface WindowInfo {
  process_name: string;
  window_title: string;
  is_study_app: boolean;
}

export interface TrackingTickEvent {
  session_id: string;
  subject_id: string;
  status: TrackingStatus;
  current_process: string;
  current_title: string;
  grace_remaining_sec: number;
  pure_focus_sec: number;
  allowed_usage_sec: number;
  diverted_sec: number;
}
