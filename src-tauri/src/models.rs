use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    pub process_name: String,
    pub window_title: String,
    pub is_study_app: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TrackingStatus {
    Focus,
    Allowed,
    Diverted,
}

impl TrackingStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TrackingStatus::Focus => "FOCUS",
            TrackingStatus::Allowed => "ALLOWED",
            TrackingStatus::Diverted => "DIVERTED",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingTickEvent {
    pub session_id: String,
    pub subject_id: String,
    pub status: String,
    pub current_process: String,
    pub current_title: String,
    pub grace_remaining_sec: u32,
    pub pure_focus_sec: u64,
    pub allowed_usage_sec: u64,
    pub diverted_sec: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subject {
    pub id: String,
    pub name: String,
    pub color_hex: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhitelistRule {
    pub id: String,
    pub subject_id: Option<String>,
    pub rule_type: String, // "process" | "window_title"
    pub pattern: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudySession {
    pub id: String,
    pub subject_id: String,
    pub start_time_utc: i64,
    pub end_time_utc: Option<i64>,
    pub pure_focus_sec: i64,
    pub allowed_usage_sec: i64,
    pub diverted_sec: i64,
    pub logical_date: String,
    pub status: String, // "in_progress" | "completed" | "discarded"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSetting {
    pub key: String,
    pub value: String,
}
