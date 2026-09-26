pub mod macos;
pub mod windows;

use crate::models::{TrackingStatus, TrackingTickEvent, WhitelistRule, WindowInfo};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub const DEFAULT_GRACE_PERIOD_SEC: f32 = 30.0;
pub const TICK_INTERVAL_MS: u64 = 1500;
pub const TICK_SECONDS: f32 = (TICK_INTERVAL_MS as f32) / 1000.0;

#[derive(Debug, Clone)]
pub struct ActiveSessionState {
    pub session_id: String,
    pub subject_id: String,
    pub is_paused: bool,
    pub grace_remaining_sec: f32,
    pub pure_focus_sec: f64,
    pub allowed_usage_sec: f64,
    pub diverted_sec: f64,
    pub rules: Vec<WhitelistRule>,
}

pub struct TrackerCoordinator {
    state: Arc<Mutex<Option<ActiveSessionState>>>,
    is_running: Arc<AtomicBool>,
}

impl TrackerCoordinator {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(None)),
            is_running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Spawns the tracking thread loop if not already running.
    pub fn start(
        &self,
        app_handle: AppHandle,
        session_id: String,
        subject_id: String,
        rules: Vec<WhitelistRule>,
    ) {
        {
            let mut state_guard = self.state.lock().unwrap();
            *state_guard = Some(ActiveSessionState {
                session_id,
                subject_id,
                is_paused: false,
                grace_remaining_sec: DEFAULT_GRACE_PERIOD_SEC,
                pure_focus_sec: 0.0,
                allowed_usage_sec: 0.0,
                diverted_sec: 0.0,
                rules,
            });
        }

        if !self.is_running.load(Ordering::SeqCst) {
            self.is_running.store(true, Ordering::SeqCst);
            let state_clone = Arc::clone(&self.state);
            let is_running_clone = Arc::clone(&self.is_running);

            std::thread::spawn(move || {
                while is_running_clone.load(Ordering::SeqCst) {
                    std::thread::sleep(Duration::from_millis(TICK_INTERVAL_MS));

                    let mut guard = state_clone.lock().unwrap();
                    if let Some(ref mut active) = *guard {
                        if active.is_paused {
                            continue;
                        }

                        let window_info = get_active_window_info();
                        let decision = evaluate_window_state(&window_info, &active.rules, &active.subject_id);

                        let current_status: TrackingStatus;

                        match decision {
                            RuleDecision::Focus => {
                                active.grace_remaining_sec = DEFAULT_GRACE_PERIOD_SEC;
                                active.pure_focus_sec += TICK_SECONDS as f64;
                                current_status = TrackingStatus::Focus;
                            }
                            RuleDecision::Allowed => {
                                active.grace_remaining_sec = DEFAULT_GRACE_PERIOD_SEC;
                                active.allowed_usage_sec += TICK_SECONDS as f64;
                                current_status = TrackingStatus::Allowed;
                            }
                            RuleDecision::Unauthorized => {
                                active.grace_remaining_sec = (active.grace_remaining_sec - TICK_SECONDS).max(0.0);

                                if active.grace_remaining_sec > 0.0 {
                                    // In grace period: still categorized as allowed
                                    active.allowed_usage_sec += TICK_SECONDS as f64;
                                    current_status = TrackingStatus::Allowed;
                                } else {
                                    // Grace expired: penalized as diverted
                                    active.diverted_sec += TICK_SECONDS as f64;
                                    current_status = TrackingStatus::Diverted;
                                }
                            }
                        }

                        let tick_event = TrackingTickEvent {
                            session_id: active.session_id.clone(),
                            subject_id: active.subject_id.clone(),
                            status: current_status.as_str().to_string(),
                            current_process: window_info.process_name,
                            current_title: window_info.window_title,
                            grace_remaining_sec: active.grace_remaining_sec.ceil() as u32,
                            pure_focus_sec: active.pure_focus_sec.round() as u64,
                            allowed_usage_sec: active.allowed_usage_sec.round() as u64,
                            diverted_sec: active.diverted_sec.round() as u64,
                        };

                        let _ = app_handle.emit("tracking-tick", tick_event);
                    }
                }
            });
        }
    }

    /// Pauses tracking without ending the session
    pub fn pause(&self) {
        let mut guard = self.state.lock().unwrap();
        if let Some(ref mut active) = *guard {
            active.is_paused = true;
        }
    }

    /// Resumes tracking for an existing session
    pub fn resume(&self) {
        let mut guard = self.state.lock().unwrap();
        if let Some(ref mut active) = *guard {
            active.is_paused = false;
        }
    }

    /// Updates active whitelist rules dynamically without restarting session
    pub fn update_rules(&self, rules: Vec<WhitelistRule>) {
        let mut guard = self.state.lock().unwrap();
        if let Some(ref mut active) = *guard {
            active.rules = rules;
        }
    }

    /// Stops tracking and returns final aggregated seconds (pure, allowed, diverted)
    pub fn stop(&self) -> Option<(u64, u64, u64)> {
        let mut guard = self.state.lock().unwrap();
        if let Some(active) = guard.take() {
            Some((
                active.pure_focus_sec.round() as u64,
                active.allowed_usage_sec.round() as u64,
                active.diverted_sec.round() as u64,
            ))
        } else {
            None
        }
    }
}

pub enum RuleDecision {
    Focus,
    Allowed,
    Unauthorized,
}

pub fn evaluate_window_state(
    window: &WindowInfo,
    rules: &[WhitelistRule],
    subject_id: &str,
) -> RuleDecision {
    // 1. Study App frontmost -> FOCUS
    if window.is_study_app {
        return RuleDecision::Focus;
    }

    let process_lower = window.process_name.to_lowercase();
    let title_lower = window.window_title.to_lowercase();

    // 2. Check process whitelist rules (global or matching current subject)
    for rule in rules {
        let is_applicable = rule.subject_id.is_none()
            || rule.subject_id.as_deref() == Some(subject_id)
            || rule.subject_id.as_deref() == Some("");

        if !is_applicable {
            continue;
        }

        if rule.rule_type == "process" {
            let pattern_lower = rule.pattern.to_lowercase();
            if process_lower == pattern_lower || process_lower.starts_with(&pattern_lower) {
                return RuleDecision::Allowed;
            }
        }
    }

    // 3. Known browser check + window_title whitelist rules
    let is_browser = is_known_browser(&process_lower);
    if is_browser {
        for rule in rules {
            let is_applicable = rule.subject_id.is_none()
                || rule.subject_id.as_deref() == Some(subject_id)
                || rule.subject_id.as_deref() == Some("");

            if !is_applicable {
                continue;
            }

            if rule.rule_type == "window_title" {
                let pattern_lower = rule.pattern.to_lowercase();
                if !pattern_lower.is_empty() && title_lower.contains(&pattern_lower) {
                    return RuleDecision::Allowed;
                }
            }
        }
    }

    // 4. Default -> Unauthorized
    RuleDecision::Unauthorized
}

pub fn is_known_browser(process_name: &str) -> bool {
    let browsers = [
        "chrome.exe",
        "msedge.exe",
        "firefox.exe",
        "brave.exe",
        "opera.exe",
        "vivaldi.exe",
        "arc.exe",
        "waterfox.exe",
        "google chrome",
        "microsoft edge",
        "safari",
    ];

    browsers.iter().any(|b| process_name.eq_ignore_ascii_case(b))
}

pub fn get_active_window_info() -> WindowInfo {
    #[cfg(windows)]
    {
        windows::get_foreground_window_info()
    }

    #[cfg(target_os = "macos")]
    {
        macos::get_foreground_window_info()
    }

    #[cfg(all(not(windows), not(target_os = "macos")))]
    {
        WindowInfo {
            process_name: "unknown_os".to_string(),
            window_title: "".to_string(),
            is_study_app: true,
        }
    }
}
