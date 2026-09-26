use crate::models::WindowInfo;

/// macOS frontmost application tracker stub
#[allow(dead_code)]
pub fn get_foreground_window_info() -> WindowInfo {
    #[cfg(target_os = "macos")]
    {
        // On macOS: Query NSWorkspace frontmostApplication
        // Fallback for build compatibility
        WindowInfo {
            process_name: "macos_app".to_string(),
            window_title: "".to_string(),
            is_study_app: true,
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        WindowInfo {
            process_name: "unsupported".to_string(),
            window_title: "".to_string(),
            is_study_app: false,
        }
    }
}
