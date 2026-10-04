import { create } from 'zustand';
import { Subject } from '../types/tracker';
import {
  getSubjects,
  saveSubject,
  deleteSubject as dbDeleteSubject,
  getStudySessions,
} from '../lib/db';
import { useConfigStore } from './useConfigStore';
import { getCurrentLogicalDate } from '../lib/timeUtils';

interface SubjectState {
  subjects: Subject[];
  activeSubjectId: string | null;
  isLoading: boolean;

  loadSubjects: () => Promise<void>;
  toggleTimer: (subjectId: string) => Promise<void>;
  tickActiveSubject: () => void;
  addSubject: (name: string, colorHex?: string) => Promise<Subject>;
  editSubject: (id: string, newName: string) => Promise<void>;
  resetSubjectTime: (id: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  setActiveSubjectId: (id: string | null) => void;
  getActiveSubject: () => Subject | undefined;
  getTotalSecondsToday: () => number;
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  activeSubjectId: null,
  isLoading: false,

  loadSubjects: async () => {
    set({ isLoading: true });
    try {
      const rollover = useConfigStore.getState().rolloverTime || '04:00';
      const todayDate = getCurrentLogicalDate(rollover);

      const [list, todaySessions] = await Promise.all([
        getSubjects(),
        getStudySessions(todayDate),
      ]);

      // Calculate logged seconds today for each subject (pure focus + allowed usage)
      const secondsMap: Record<string, number> = {};
      for (const sess of todaySessions) {
        if (sess.status === 'completed' || sess.status === 'in_progress') {
          const totalSessSec =
            (sess.pure_focus_sec || 0) +
            (sess.allowed_usage_sec || 0);
          secondsMap[sess.subject_id] = (secondsMap[sess.subject_id] || 0) + totalSessSec;
        }
      }

      // If timer is actively running, preserve the live unpersisted seconds for that active subject
      const timerState = (await import('./useTimerStore')).useTimerStore.getState();
      if (timerState.isRunning && timerState.subjectId) {
        const liveSec = (timerState.pureFocusSec || 0) + (timerState.allowedUsageSec || 0);
        secondsMap[timerState.subjectId] = (secondsMap[timerState.subjectId] || 0) + liveSec;
      }

      const merged = list.map((s) => ({
        ...s,
        seconds_today: secondsMap[s.id] || 0,
      }));

      set({
        subjects: merged,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading subjects:', err);
      set({ isLoading: false });
    }
  },

  toggleTimer: async (subjectId: string) => {
    const { activeSubjectId } = get();
    // Dynamically imported to avoid circular dependency
    const { useTimerStore } = await import('./useTimerStore');
    const timerStore = useTimerStore.getState();
    const { whitelistRules } = useConfigStore.getState();

    if (activeSubjectId === subjectId) {
      // Pause / Stop tracking
      await timerStore.stopSession();
      set({ activeSubjectId: null });
    } else {
      // If another subject was active, stop it first
      if (activeSubjectId) {
        await timerStore.stopSession();
      }
      // Start new subject session
      set({ activeSubjectId: subjectId });
      await timerStore.startSession(subjectId, whitelistRules);
    }
  },

  tickActiveSubject: () => {
    const { activeSubjectId, subjects } = get();
    if (!activeSubjectId) return;

    set({
      subjects: subjects.map((s) =>
        s.id === activeSubjectId
          ? { ...s, seconds_today: (s.seconds_today || 0) + 1 }
          : s
      ),
    });
  },

  addSubject: async (name: string, colorHex: string = '#38bdf8') => {
    const newSubject: Subject = {
      id: 'subj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      color_hex: colorHex,
      created_at: Date.now(),
      seconds_today: 0,
    };
    await saveSubject(newSubject);
    set((state) => ({
      subjects: [...state.subjects, newSubject],
    }));
    return newSubject;
  },

  editSubject: async (id: string, newName: string) => {
    const { subjects } = get();
    const item = subjects.find((s) => s.id === id);
    if (!item) return;

    const updated: Subject = {
      ...item,
      name: newName.trim(),
    };
    await saveSubject(updated);
    set({
      subjects: subjects.map((s) => (s.id === id ? updated : s)),
    });
  },

  resetSubjectTime: async (id: string) => {
    const { activeSubjectId } = get();
    // If currently running, stop it
    if (activeSubjectId === id) {
      const { useTimerStore } = await import('./useTimerStore');
      await useTimerStore.getState().stopSession();
      set({ activeSubjectId: null });
    }

    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === id ? { ...s, seconds_today: 0 } : s
      ),
    }));
  },

  deleteSubject: async (id: string) => {
    const { activeSubjectId } = get();
    if (activeSubjectId === id) {
      const { useTimerStore } = await import('./useTimerStore');
      await useTimerStore.getState().stopSession();
      useTimerStore.setState({
        sessionId: null,
        subjectId: null,
        isRunning: false,
        pureFocusSec: 0,
        allowedUsageSec: 0,
        divertedSec: 0,
        totalElapsedSec: 0,
      });
      set({ activeSubjectId: null });
    }
    await dbDeleteSubject(id);
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id),
    }));
  },

  setActiveSubjectId: (id: string | null) => {
    set({ activeSubjectId: id });
  },

  getActiveSubject: () => {
    const { subjects, activeSubjectId } = get();
    return subjects.find((s) => s.id === activeSubjectId);
  },

  getTotalSecondsToday: () => {
    const { subjects } = get();
    return subjects.reduce((sum, s) => sum + (s.seconds_today || 0), 0);
  },
}));
