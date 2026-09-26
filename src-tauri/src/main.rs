// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod models;
mod tracker;

use models::{WhitelistRule, WindowInfo};
use serde_json::json;
use std::sync::Arc;
use tauri::{AppHandle, State};
use tracker::{get_active_window_info, TrackerCoordinator};

pub struct AppState {
    pub tracker: Arc<TrackerCoordinator>,
}

#[tauri::command]
fn start_tracking_session(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    subject_id: String,
    rules: Vec<WhitelistRule>,
) -> Result<(), String> {
    state
        .tracker
        .start(app_handle, session_id, subject_id, rules);
    Ok(())
}

#[tauri::command]
fn pause_tracking_session(state: State<'_, AppState>) -> Result<(), String> {
    state.tracker.pause();
    Ok(())
}

#[tauri::command]
fn resume_tracking_session(state: State<'_, AppState>) -> Result<(), String> {
    state.tracker.resume();
    Ok(())
}

#[tauri::command]
fn stop_tracking_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<serde_json::Value, String> {
    if let Some((pure_focus, allowed, diverted)) = state.tracker.stop() {
        Ok(json!({
            "session_id": session_id,
            "pure_focus_sec": pure_focus,
            "allowed_usage_sec": allowed,
            "diverted_sec": diverted,
        }))
    } else {
        Ok(json!({
            "session_id": session_id,
            "pure_focus_sec": 0,
            "allowed_usage_sec": 0,
            "diverted_sec": 0,
        }))
    }
}

#[tauri::command]
fn update_session_rules(
    state: State<'_, AppState>,
    rules: Vec<WhitelistRule>,
) -> Result<(), String> {
    state.tracker.update_rules(rules);
    Ok(())
}

#[tauri::command]
fn get_current_window_info() -> Result<WindowInfo, String> {
    Ok(get_active_window_info())
}

fn main() {
    let coordinator = Arc::new(TrackerCoordinator::new());

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:study_tracker.db", db::get_migrations())
                .build(),
        )
        .manage(AppState {
            tracker: coordinator,
        })
        .invoke_handler(tauri::generate_handler![
            start_tracking_session,
            pause_tracking_session,
            resume_tracking_session,
            stop_tracking_session,
            update_session_rules,
            get_current_window_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running VibeFlow desktop application");
}
