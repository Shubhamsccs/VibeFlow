use crate::models::WindowInfo;
use std::path::Path;
use windows::core::PWSTR;
use windows::Win32::Foundation::CloseHandle;
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT,
    PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
};

/// Queries the frontmost foreground window and extracts process name and window title.
pub fn get_foreground_window_info() -> WindowInfo {
    let hwnd = unsafe { GetForegroundWindow() };

    // Null or invalid handle (e.g. desktop background, screen lock)
    if hwnd.0.is_null() {
        return WindowInfo {
            process_name: "unknown".to_string(),
            window_title: "".to_string(),
            is_study_app: false,
        };
    }

    let mut process_id = 0u32;
    unsafe {
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));
    }

    let current_pid = std::process::id();
    let is_study_app = process_id == current_pid;

    // Query executable path and extract file name
    let mut process_name = "unknown".to_string();
    if let Ok(handle) = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id) } {
        let mut buffer = [0u16; 1024];
        let mut size = buffer.len() as u32;

        let res = unsafe {
            QueryFullProcessImageNameW(
                handle,
                PROCESS_NAME_FORMAT(0),
                PWSTR(buffer.as_mut_ptr()),
                &mut size,
            )
        };

        let _ = unsafe { CloseHandle(handle) };

        if res.is_ok() && size > 0 {
            let full_path = String::from_utf16_lossy(&buffer[..size as usize]);
            if let Some(file_name) = Path::new(&full_path).file_name() {
                process_name = file_name.to_string_lossy().to_string().to_lowercase();
            } else {
                process_name = full_path.to_lowercase();
            }
        }
    }

    // Query window title bar text
    let text_len = unsafe { GetWindowTextLengthW(hwnd) };
    let mut raw_title = String::new();
    if text_len > 0 {
        let mut title_buf = vec![0u16; (text_len + 1) as usize];
        let copied = unsafe { GetWindowTextW(hwnd, &mut title_buf) };
        if copied > 0 {
            raw_title = String::from_utf16_lossy(&title_buf[..copied as usize]);
        }
    }

    let sanitized_title = sanitize_window_title(&raw_title);

    WindowInfo {
        process_name,
        window_title: sanitized_title,
        is_study_app,
    }
}

/// Sanitizes title string by stripping common trailing browser identifiers and whitespaces.
pub fn sanitize_window_title(title: &str) -> String {
    let mut clean = title.trim();
    let browser_suffixes = [
        " - Google Chrome",
        " - Microsoft​ Edge",
        " - Microsoft Edge",
        " - Mozilla Firefox",
        " - Brave",
        " - Opera",
        " - Vivaldi",
        " - Arc",
    ];

    for suffix in browser_suffixes {
        if let Some(stripped) = clean.strip_suffix(suffix) {
            clean = stripped.trim();
        }
    }

    clean.to_string()
}
