import { Subject, WhitelistRule, StudySession, AppSetting } from '../types/tracker';

const DB_PATH = 'sqlite:study_tracker.db';

// Check if running inside Tauri desktop environment
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

interface SqlDatabase {
  execute(query: string, bindValues?: any[]): Promise<any>;
  select<T = any>(query: string, bindValues?: any[]): Promise<T>;
}

let dbInstance: SqlDatabase | null = null;

// Fallback in-memory / localStorage storage for browser dev environment
const STORAGE_PREFIX = 'vibeflow_db_';
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

/**
 * Initializes and retrieves the SQLite database connection.
 */
export async function getDb() {
  if (!isTauri()) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  try {
    const Database = (await import('@tauri-apps/plugin-sql')).default;
    dbInstance = await Database.load(DB_PATH);
    return dbInstance;
  } catch (error) {
    console.warn('Failed to load SQLite via tauri-plugin-sql; falling back to local storage:', error);
    return null;
  }
}

/**
 * Ensures initial tables and default settings exist.
 */
export async function initDb(): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subjects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color_hex TEXT NOT NULL,
          created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS whitelist_rules (
          id TEXT PRIMARY KEY,
          subject_id TEXT,
          rule_type TEXT CHECK(rule_type IN ('process', 'window_title')),
          pattern TEXT NOT NULL,
          FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      );

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

      CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
      );

      INSERT OR IGNORE INTO app_settings (key, value) VALUES 
      ('rollover_time', '04:00'),
      ('week_start_day', '1'),
      ('grace_period_sec', '30'),
      ('daily_target', '6h');
    `);
  } else {
    // Seed browser mock defaults
    if (!localStorage.getItem(STORAGE_PREFIX + 'app_settings')) {
      setLocalItem('app_settings', {
        rollover_time: '04:00',
        week_start_day: '1',
        grace_period_sec: '30',
        daily_target: '6h',
      });
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'subjects')) {
      setLocalItem('subjects', []);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'whitelist_rules')) {
      setLocalItem('whitelist_rules', []);
    }
  }
}

// ==================== SUBJECTS ====================

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDb();
  if (db) {
    return await db.select<Subject[]>('SELECT * FROM subjects ORDER BY created_at ASC');
  }
  return getLocalItem<Subject[]>('subjects', []);
}

export async function saveSubject(subject: Subject): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute(
      'INSERT OR REPLACE INTO subjects (id, name, color_hex, created_at) VALUES ($1, $2, $3, $4)',
      [subject.id, subject.name, subject.color_hex, subject.created_at]
    );
  } else {
    const list = getLocalItem<Subject[]>('subjects', []);
    const idx = list.findIndex((s) => s.id === subject.id);
    if (idx >= 0) list[idx] = subject;
    else list.push(subject);
    setLocalItem('subjects', list);
  }
}

export async function deleteSubject(id: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute('DELETE FROM study_sessions WHERE subject_id = $1', [id]);
    await db.execute('DELETE FROM whitelist_rules WHERE subject_id = $1', [id]);
    await db.execute('DELETE FROM subjects WHERE id = $1', [id]);
  } else {
    const list = getLocalItem<Subject[]>('subjects', []).filter((s) => s.id !== id);
    setLocalItem('subjects', list);
    const rules = getLocalItem<WhitelistRule[]>('whitelist_rules', []).filter((r) => r.subject_id !== id);
    setLocalItem('whitelist_rules', rules);
    const sessions = getLocalItem<StudySession[]>('study_sessions', []).filter((sess) => sess.subject_id !== id);
    setLocalItem('study_sessions', sessions);
  }
}

// ==================== WHITELIST RULES ====================

export async function getWhitelistRules(subjectId?: string): Promise<WhitelistRule[]> {
  const db = await getDb();
  if (db) {
    if (subjectId) {
      return await db.select<WhitelistRule[]>(
        'SELECT * FROM whitelist_rules WHERE subject_id IS NULL OR subject_id = $1',
        [subjectId]
      );
    }
    return await db.select<WhitelistRule[]>('SELECT * FROM whitelist_rules');
  }
  const all = getLocalItem<WhitelistRule[]>('whitelist_rules', []);
  if (subjectId) {
    return all.filter((r) => !r.subject_id || r.subject_id === subjectId);
  }
  return all;
}

export async function saveWhitelistRule(rule: WhitelistRule): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute(
      'INSERT OR REPLACE INTO whitelist_rules (id, subject_id, rule_type, pattern) VALUES ($1, $2, $3, $4)',
      [rule.id, rule.subject_id, rule.rule_type, rule.pattern]
    );
  } else {
    const list = getLocalItem<WhitelistRule[]>('whitelist_rules', []);
    const idx = list.findIndex((r) => r.id === rule.id);
    if (idx >= 0) list[idx] = rule;
    else list.push(rule);
    setLocalItem('whitelist_rules', list);
  }
}

export async function deleteWhitelistRule(id: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute('DELETE FROM whitelist_rules WHERE id = $1', [id]);
  } else {
    const list = getLocalItem<WhitelistRule[]>('whitelist_rules', []).filter((r) => r.id !== id);
    setLocalItem('whitelist_rules', list);
  }
}

// ==================== STUDY SESSIONS ====================

export async function getStudySessions(logicalDate?: string): Promise<StudySession[]> {
  const db = await getDb();
  if (db) {
    if (logicalDate) {
      return await db.select<StudySession[]>(
        'SELECT * FROM study_sessions WHERE logical_date = $1 ORDER BY start_time_utc DESC',
        [logicalDate]
      );
    }
    return await db.select<StudySession[]>('SELECT * FROM study_sessions ORDER BY start_time_utc DESC');
  }
  const list = getLocalItem<StudySession[]>('study_sessions', []);
  if (logicalDate) {
    return list.filter((s) => s.logical_date === logicalDate);
  }
  return list;
}

export async function saveStudySession(session: StudySession): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute(
      `INSERT OR REPLACE INTO study_sessions 
       (id, subject_id, start_time_utc, end_time_utc, pure_focus_sec, allowed_usage_sec, diverted_sec, logical_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        session.id,
        session.subject_id,
        session.start_time_utc,
        session.end_time_utc,
        session.pure_focus_sec,
        session.allowed_usage_sec,
        session.diverted_sec,
        session.logical_date,
        session.status,
      ]
    );
  } else {
    const list = getLocalItem<StudySession[]>('study_sessions', []);
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) list[idx] = session;
    else list.push(session);
    setLocalItem('study_sessions', list);
  }
}

export async function deleteStudySession(id: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute('DELETE FROM study_sessions WHERE id = $1', [id]);
  } else {
    const list = getLocalItem<StudySession[]>('study_sessions', []).filter((s) => s.id !== id);
    setLocalItem('study_sessions', list);
  }
}

// ==================== APP SETTINGS ====================

export async function getAppSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (db) {
    const rows = await db.select<AppSetting[]>('SELECT * FROM app_settings');
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return settings;
  }
  return getLocalItem<Record<string, string>>('app_settings', {
    rollover_time: '04:00',
    week_start_day: '1',
    grace_period_sec: '30',
  });
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.execute('INSERT OR REPLACE INTO app_settings (key, value) VALUES ($1, $2)', [key, value]);
  } else {
    const settings = getLocalItem<Record<string, string>>('app_settings', {});
    settings[key] = value;
    setLocalItem('app_settings', settings);
  }
}
