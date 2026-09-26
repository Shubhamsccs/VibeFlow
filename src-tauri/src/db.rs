use tauri_plugin_sql::{Migration, MigrationKind};

pub const DB_MIGRATION_SQL: &str = r#"
-- Subjects for study
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Whitelist rules (Global or Subject-specific)
CREATE TABLE IF NOT EXISTS whitelist_rules (
    id TEXT PRIMARY KEY,
    subject_id TEXT,
    rule_type TEXT CHECK(rule_type IN ('process', 'window_title')),
    pattern TEXT NOT NULL,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Core Study Sessions (Offline-first source of truth)
CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    start_time_utc INTEGER NOT NULL,
    end_time_utc INTEGER,
    pure_focus_sec INTEGER DEFAULT 0,
    allowed_usage_sec INTEGER DEFAULT 0,
    diverted_sec INTEGER DEFAULT 0,
    logical_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('in_progress', 'completed', 'discarded')),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
);

-- User Configuration
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES 
('rollover_time', '04:00'),
('week_start_day', '1'),
('grace_period_sec', '30');
"#;

pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_study_tracker_tables",
        sql: DB_MIGRATION_SQL,
        kind: MigrationKind::Up,
    }]
}
