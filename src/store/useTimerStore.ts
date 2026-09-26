import { create } from 'zustand';
import { TrackingStatus, TrackingTickEvent, StudySession, WhitelistRule } from '../types/tracker';
import { getLogicalDate } from '../lib/timeUtils';
import { saveStudySession, isTauri } from '../lib/db';
import { useConfigStore } from './useConfigStore';

export type TimerMode = 'stopwatch' | 'pomodoro';
export type PomodoroPhase = 'work' | 'short_break' | 'long_break';

interface TimerStoreState {
  // Mode & configuration
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  workDurationSec: number;       // default 25 * 60 (1500)
  shortBreakDurationSec: number; // default 5 * 60 (300)
  longBreakDurationSec: number;  // default 15 * 60 (900)
  longBreakInterval: number;     // 4 cycles
  pomodoroCyclesCompleted: number;

  // Session execution state
  sessionId: string | null;
  subjectId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  startTimeUtc: number | null;
  totalElapsedSec: number;       // Total seconds elapsed in session
  timeRemainingSec: number;      // For Pomodoro countdown

  // 3-state tracking buckets
  pureFocusSec: number;
  allowedUsageSec: number;
  divertedSec: number;

  // Live native window state from Rust
  currentStatus: TrackingStatus;
  currentProcess: string;
  currentTitle: string;
  graceRemainingSec: number;

  // Actions
  setMode: (mode: TimerMode) => void;
  setPomodoroDurations: (workMin: number, shortMin: number, longMin: number) => void;
  startSession: (subjectId: string, rules: WhitelistRule[]) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<StudySession | null>;
  discardSession: () => Promise<void>;
  skipPomodoroPhase: () => void;
  tickSecond: () => void;
  applyTrackingTick: (tick: TrackingTickEvent) => void;
}

// Module-level timers & unlisten handles
let tickerIntervalId: ReturnType<typeof setInterval> | null = null;
let unlistenTickHandle: (() => void) | null = null;

export const useTimerStore = create<TimerStoreState>((set, get) => ({
  mode: 'stopwatch',
  pomodoroPhase: 'work',
  workDurationSec: 25 * 60,
  shortBreakDurationSec: 5 * 60,
  longBreakDurationSec: 15 * 60,
  longBreakInterval: 4,
  pomodoroCyclesCompleted: 0,

  sessionId: null,
  subjectId: null,
  isRunning: false,
  isPaused: false,
  startTimeUtc: null,
  totalElapsedSec: 0,
  timeRemainingSec: 25 * 60,

  pureFocusSec: 0,
  allowedUsageSec: 0,
  divertedSec: 0,

  currentStatus: 'FOCUS',
  currentProcess: 'vibeflow.exe',
  currentTitle: 'VibeFlow — Study Tracker',
  graceRemainingSec: 30,

  setMode: (mode: TimerMode) => {
    if (get().isRunning) return;
    const { workDurationSec } = get();
    set({
      mode,
      pomodoroPhase: 'work',
      timeRemainingSec: workDurationSec,
      totalElapsedSec: 0,
    });
  },

  setPomodoroDurations: (workMin: number, shortMin: number, longMin: number) => {
    const workDurationSec = Math.max(1, workMin) * 60;
    const shortBreakDurationSec = Math.max(1, shortMin) * 60;
    const longBreakDurationSec = Math.max(1, longMin) * 60;
    set({
      workDurationSec,
      shortBreakDurationSec,
      longBreakDurationSec,
      timeRemainingSec: get().isRunning ? get().timeRemainingSec : workDurationSec,
    });
  },

  startSession: async (subjectId: string, rules: WhitelistRule[]) => {
    if (get().isRunning) return;

    const sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const startTimeUtc = Math.floor(Date.now() / 1000);
    const rolloverTime = useConfigStore.getState().rolloverTime || '04:00';
    const logicalDate = getLogicalDate(Date.now(), rolloverTime);

    // Initial session record in SQLite
    const initialSession: StudySession = {
      id: sessionId,
      subject_id: subjectId,
      start_time_utc: startTimeUtc,
      end_time_utc: null,
      pure_focus_sec: 0,
      allowed_usage_sec: 0,
      diverted_sec: 0,
      logical_date: logicalDate,
      status: 'in_progress',
    };

    await saveStudySession(initialSession);

    const mode = get().mode;
    const timeRemaining = mode === 'pomodoro' ? get().workDurationSec : 0;

    set({
      sessionId,
      subjectId,
      isRunning: true,
      isPaused: false,
      startTimeUtc,
      totalElapsedSec: 0,
      timeRemainingSec: timeRemaining,
      pomodoroPhase: 'work',
      pureFocusSec: 0,
      allowedUsageSec: 0,
      divertedSec: 0,
      currentStatus: 'FOCUS',
      graceRemainingSec: 30,
    });

    // Start native tracking if running inside Tauri
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        // Register tracking-tick listener
        if (unlistenTickHandle) {
          unlistenTickHandle();
          unlistenTickHandle = null;
        }

        const unlisten = await listen<TrackingTickEvent>('tracking-tick', (event) => {
          get().applyTrackingTick(event.payload);
        });
        unlistenTickHandle = unlisten;

        await invoke('start_tracking_session', {
          sessionId,
          subjectId,
          rules,
        });
      } catch (err) {
        console.warn('Failed to invoke Tauri native tracker:', err);
      }
    }

    // Start 1-second interval ticker for UI fluidity
    if (tickerIntervalId) clearInterval(tickerIntervalId);
    tickerIntervalId = setInterval(() => {
      get().tickSecond();
    }, 1000);
  },

  pauseSession: async () => {
    if (!get().isRunning || get().isPaused) return;

    set({ isPaused: true });

    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('pause_tracking_session');
      } catch (err) {
        console.warn('Error pausing native tracker:', err);
      }
    }
  },

  resumeSession: async () => {
    if (!get().isRunning || !get().isPaused) return;

    set({ isPaused: false });

    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('resume_tracking_session');
      } catch (err) {
        console.warn('Error resuming native tracker:', err);
      }
    }
  },

  stopSession: async () => {
    if (!get().isRunning) return null;

    if (tickerIntervalId) {
      clearInterval(tickerIntervalId);
      tickerIntervalId = null;
    }

    if (unlistenTickHandle) {
      unlistenTickHandle();
      unlistenTickHandle = null;
    }

    const state = get();
    let finalPure = state.pureFocusSec;
    let finalAllowed = state.allowedUsageSec;
    let finalDiverted = state.divertedSec;

    if (isTauri() && state.sessionId) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = (await invoke('stop_tracking_session', { sessionId: state.sessionId })) as {
          pure_focus_sec: number;
          allowed_usage_sec: number;
          diverted_sec: number;
        };
        if (res) {
          finalPure = res.pure_focus_sec;
          finalAllowed = res.allowed_usage_sec;
          finalDiverted = res.diverted_sec;
        }
      } catch (err) {
        console.warn('Error stopping native tracker:', err);
      }
    }

    const endTimeUtc = Math.floor(Date.now() / 1000);
    const rolloverTime = useConfigStore.getState().rolloverTime || '04:00';
    const logicalDate = getLogicalDate(Date.now(), rolloverTime);

    const completedSession: StudySession = {
      id: state.sessionId!,
      subject_id: state.subjectId || 'general',
      start_time_utc: state.startTimeUtc || endTimeUtc,
      end_time_utc: endTimeUtc,
      pure_focus_sec: finalPure,
      allowed_usage_sec: finalAllowed,
      diverted_sec: finalDiverted,
      logical_date: logicalDate,
      status: 'completed',
    };

    await saveStudySession(completedSession);

    set({
      isRunning: false,
      isPaused: false,
      sessionId: null,
      pureFocusSec: finalPure,
      allowedUsageSec: finalAllowed,
      divertedSec: finalDiverted,
    });

    return completedSession;
  },

  discardSession: async () => {
    if (tickerIntervalId) {
      clearInterval(tickerIntervalId);
      tickerIntervalId = null;
    }

    if (unlistenTickHandle) {
      unlistenTickHandle();
      unlistenTickHandle = null;
    }

    const state = get();
    if (isTauri() && state.sessionId) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('stop_tracking_session', { sessionId: state.sessionId });
      } catch (err) {
        console.warn('Error stopping native tracker on discard:', err);
      }
    }

    if (state.sessionId) {
      const rolloverTime = useConfigStore.getState().rolloverTime || '04:00';
      const logicalDate = getLogicalDate(Date.now(), rolloverTime);
      await saveStudySession({
        id: state.sessionId,
        subject_id: state.subjectId || 'general',
        start_time_utc: state.startTimeUtc || Math.floor(Date.now() / 1000),
        end_time_utc: Math.floor(Date.now() / 1000),
        pure_focus_sec: state.pureFocusSec,
        allowed_usage_sec: state.allowedUsageSec,
        diverted_sec: state.divertedSec,
        logical_date: logicalDate,
        status: 'discarded',
      });
    }

    set({
      isRunning: false,
      isPaused: false,
      sessionId: null,
      totalElapsedSec: 0,
      pureFocusSec: 0,
      allowedUsageSec: 0,
      divertedSec: 0,
      currentStatus: 'FOCUS',
    });
  },

  skipPomodoroPhase: () => {
    const { pomodoroPhase, workDurationSec, shortBreakDurationSec, longBreakDurationSec, longBreakInterval, pomodoroCyclesCompleted } = get();

    if (pomodoroPhase === 'work') {
      const nextCount = pomodoroCyclesCompleted + 1;
      const isLongBreak = nextCount % longBreakInterval === 0;
      set({
        pomodoroPhase: isLongBreak ? 'long_break' : 'short_break',
        pomodoroCyclesCompleted: nextCount,
        timeRemainingSec: isLongBreak ? longBreakDurationSec : shortBreakDurationSec,
      });
    } else {
      set({
        pomodoroPhase: 'work',
        timeRemainingSec: workDurationSec,
      });
    }
  },

  tickSecond: () => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;

    const newElapsed = state.totalElapsedSec + 1;

    // Local 1-second fallback bucketing if native ticks are lagging or running in browser
    let pureFocus = state.pureFocusSec;
    let allowedUsage = state.allowedUsageSec;
    let diverted = state.divertedSec;

    if (!isTauri()) {
      // In browser preview: simulate window focus detection
      const hasFocus = typeof document !== 'undefined' && document.hasFocus();
      if (hasFocus) {
        pureFocus += 1;
        set({ currentStatus: 'FOCUS', graceRemainingSec: 30 });
      } else {
        allowedUsage += 1;
        set({ currentStatus: 'ALLOWED', currentProcess: 'browser_preview' });
      }
    }

    if (state.mode === 'stopwatch') {
      set({
        totalElapsedSec: newElapsed,
        pureFocusSec: pureFocus,
        allowedUsageSec: allowedUsage,
        divertedSec: diverted,
      });
    } else {
      // Pomodoro countdown
      const nextRemaining = state.timeRemainingSec - 1;

      if (nextRemaining <= 0) {
        // Phase transition
        get().skipPomodoroPhase();
      } else {
        set({
          totalElapsedSec: newElapsed,
          timeRemainingSec: nextRemaining,
          pureFocusSec: pureFocus,
          allowedUsageSec: allowedUsage,
          divertedSec: diverted,
        });
      }
    }
  },

  applyTrackingTick: (tick: TrackingTickEvent) => {
    const state = get();
    if (!state.isRunning || state.sessionId !== tick.session_id) return;

    set({
      currentStatus: tick.status,
      currentProcess: tick.current_process,
      currentTitle: tick.current_title,
      graceRemainingSec: tick.grace_remaining_sec,
      pureFocusSec: tick.pure_focus_sec,
      allowedUsageSec: tick.allowed_usage_sec,
      divertedSec: tick.diverted_sec,
    });
  },
}));
