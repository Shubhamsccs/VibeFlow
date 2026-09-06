import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_COLUMNS = [
  { id: 'backlog', title: 'Backlog', accent: '#6366f1' },
  { id: 'todo', title: "Today's Focus", accent: '#f59e0b' },
  { id: 'in-progress', title: 'In Progress', accent: '#06b6d4' },
  { id: 'done', title: 'Done', accent: '#10b981' },
];

export const WORKFLOW_PRESETS = {
  'software-dev': {
    id: 'software-dev',
    name: 'Software Engineering',
    columns: [
      { id: 'backlog', title: 'Backlog', accent: '#6366f1' },
      { id: 'sprint', title: 'Current Sprint', accent: '#f59e0b' },
      { id: 'in-progress', title: 'In Progress', accent: '#06b6d4' },
      { id: 'review', title: 'Code Review', accent: '#8b5cf6' },
      { id: 'done', title: 'Shipped', accent: '#10b981' },
    ],
    habits: [
      'Deep Code Session (90m)',
      'PR Review & Bug Triage',
      'Tech Reading & Research',
    ],
  },
  'general': {
    id: 'general',
    name: 'General Productivity',
    columns: [
      { id: 'backlog', title: 'Backlog', accent: '#6366f1' },
      { id: 'todo', title: "Today's Priority", accent: '#f59e0b' },
      { id: 'in-progress', title: 'In Progress', accent: '#06b6d4' },
      { id: 'done', title: 'Done', accent: '#10b981' },
    ],
    habits: [
      'Top 3 Deep Focus Tasks',
      'Daily Review & Inbox Zero',
      'Mindfulness & Reading',
    ],
  },
  'creator': {
    id: 'creator',
    name: 'Content & Creator',
    columns: [
      { id: 'ideas', title: 'Ideas & Pipeline', accent: '#8b5cf6' },
      { id: 'production', title: 'In Production', accent: '#f59e0b' },
      { id: 'editing', title: 'Editing & Review', accent: '#06b6d4' },
      { id: 'done', title: 'Published', accent: '#10b981' },
    ],
    habits: [
      'Creative Writing / Recording (60m)',
      'Audience Engagement',
      'Content Planning',
    ],
  },
  'blank': {
    id: 'blank',
    name: 'Blank Canvas',
    columns: [
      { id: 'todo', title: 'To Do', accent: '#6366f1' },
      { id: 'in-progress', title: 'In Progress', accent: '#06b6d4' },
      { id: 'done', title: 'Done', accent: '#10b981' },
    ],
    habits: [
      'Daily Focus Block',
    ],
  },
};

const todayStr = () => new Date().toLocaleDateString('en-CA');

const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  if (duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length >= 2) return (parts[0] * 60) + parts[1];
  }
  const h = parseInt(duration.match(/(\d+)h/)?.[1] || 0);
  const m = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
  if (h === 0 && m === 0 && !isNaN(parseInt(duration))) return parseInt(duration);
  return (h * 60) + m;
};

const handleTaskCompletionEarn = (state) => {
  const nextCount = (state.taskCompletionsForShield || 0) + 1;
  if (nextCount >= 12) {
    return {
      taskCompletionsForShield: 0,
      streakShields: (state.streakShields || 0) + 1,
    };
  }
  return {
    taskCompletionsForShield: nextCount,
  };
};

export const useTaskStore = create(
  persist(
    (set, get) => ({
      // User Profile & Onboarding State
      user: {
        name: 'Productivity Architect',
        role: 'Creator & Builder',
        avatar: '',
        hasCompletedOnboarding: false,
        dailyFocusTargetMinutes: 240, // 4 hours default
      },
      updateUserProfile: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),
      completeOnboarding: (userData, presetKey = 'general') =>
        set((state) => {
          const preset = WORKFLOW_PRESETS[presetKey] || WORKFLOW_PRESETS['general'];
          const newHabits = preset.habits.map((title) => ({
            id: crypto.randomUUID(),
            title,
            completedToday: false,
            breakUntil: null,
            addedAt: new Date().toISOString(),
          }));

          return {
            user: { ...state.user, ...userData, hasCompletedOnboarding: true },
            columns: preset.columns,
            compulsoryTasks: newHabits,
          };
        }),

      // Authentication & Google Sign-In
      isAuthenticated: false,
      googleUser: null,
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      signInWithGoogle: (account) =>
        set((state) => ({
          isAuthenticated: true,
          isAuthModalOpen: false,
          googleUser: account,
          user: {
            ...state.user,
            name: account.name || state.user.name,
            role: account.role || state.user.role,
            avatar: account.avatar || state.user.avatar,
            email: account.email,
          },
        })),
      signOut: () =>
        set({
          isAuthenticated: false,
          googleUser: null,
        }),

      plan: 'free', // 'free' | 'pro' | 'lifetime'
      licenseKey: '',
      isProModalOpen: false,
      openProModal: () => set({ isProModalOpen: true }),
      closeProModal: () => set({ isProModalOpen: false }),
      setPlan: (plan) => set({ plan }),
      verifyLicenseKey: (key) => {
        const trimmed = (key || '').trim().toUpperCase();
        if (trimmed.startsWith('VIBE-LIFE') || trimmed.includes('LIFETIME')) {
          set({ plan: 'lifetime', licenseKey: trimmed, isProModalOpen: false });
          return { success: true, plan: 'lifetime' };
        } else if (trimmed.startsWith('VIBE-PRO') || trimmed.includes('PRO')) {
          set({ plan: 'pro', licenseKey: trimmed, isProModalOpen: false });
          return { success: true, plan: 'pro' };
        }
        return { success: false, message: 'Invalid license key. Format: VIBE-PRO-XXXX or VIBE-LIFETIME-XXXX' };
      },

      // Dynamic Workspace Columns
      columns: DEFAULT_COLUMNS,
      addColumn: (column) =>
        set((state) => ({
          columns: [
            ...state.columns,
            {
              id: column.id || `col-${Date.now()}`,
              title: column.title || 'New Column',
              accent: column.accent || '#6366f1',
            },
          ],
        })),
      updateColumn: (id, updates) =>
        set((state) => ({
          columns: state.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteColumn: (id) =>
        set((state) => {
          // If deleted column contains tasks, move them to the first available column
          const remaining = state.columns.filter((c) => c.id !== id);
          const fallbackColId = remaining[0]?.id || 'backlog';
          const updatedTasks = state.tasks.map((t) =>
            t.status === id ? { ...t, status: fallbackColId } : t
          );
          return {
            columns: remaining,
            tasks: updatedTasks,
          };
        }),
      reorderColumns: (newColumns) => set({ columns: newColumns }),
      applyPresetWorkflow: (presetKey) =>
        set((state) => {
          const preset = WORKFLOW_PRESETS[presetKey];
          if (!preset) return state;
          return {
            columns: preset.columns,
          };
        }),

      // UI States & Modals
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      isTaskModalOpen: false,
      taskToEdit: null,
      openTaskModal: (task = null) => set({ isTaskModalOpen: true, taskToEdit: task }),
      closeTaskModal: () => set({ isTaskModalOpen: false, taskToEdit: null }),
      isSettingsModalOpen: false,
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),
      isFreshStartModalOpen: false,
      openFreshStartModal: () => set({ isFreshStartModalOpen: true }),
      closeFreshStartModal: () => set({ isFreshStartModalOpen: false }),
      isResetModalOpen: false,
      openResetModal: () => set({ isResetModalOpen: true }),
      closeResetModal: () => set({ isResetModalOpen: false }),

      // Tasks State
      tasks: [],
      addTask: (task) =>
        set((state) => {
          const defaultColumn = state.columns[0]?.id || 'backlog';
          const newTask = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            priority: 'medium',
            energyLevel: 'standard', // 'deep' | 'standard' | 'light'
            subtasks: [],
            status: defaultColumn,
            ...task,
          };

          let earnedShieldState = {};
          let newHistoryEntry = null;
          if (newTask.status === 'done') {
            earnedShieldState = handleTaskCompletionEarn(state);
            const plannedMins = newTask.duration ? parseDurationToMinutes(newTask.duration) : 45;
            newTask.actualDurationMinutes = newTask.actualDurationMinutes ?? plannedMins;
            newTask.actualDuration = newTask.actualDuration ?? (newTask.duration || '45m');

            newHistoryEntry = {
              id: crypto.randomUUID(),
              taskId: newTask.id,
              taskTitle: newTask.title,
              category: newTask.status || defaultColumn,
              date: todayStr(),
              minutes: plannedMins,
              mood: newTask.mood || 4,
              isManual: true,
            };
          }

          return {
            tasks: [...state.tasks, newTask],
            focusHistory: newHistoryEntry ? [...state.focusHistory, newHistoryEntry] : state.focusHistory,
            ...earnedShieldState,
          };
        }),

      updateTask: (id, updatedTask) =>
        set((state) => {
          const oldTask = state.tasks.find((t) => t.id === id);
          const isNewlyDone = oldTask && oldTask.status !== 'done' && updatedTask.status === 'done';

          let earnedShieldState = {};
          let extraFields = {};
          let newHistoryEntry = null;

          if (isNewlyDone) {
            earnedShieldState = handleTaskCompletionEarn(state);
            const durStr = updatedTask.duration || oldTask.duration;
            const plannedMins = durStr ? parseDurationToMinutes(durStr) : 45;
            extraFields.actualDurationMinutes = plannedMins;
            extraFields.actualDuration = durStr || '45m';
            extraFields.completedAt = new Date().toISOString();

            newHistoryEntry = {
              id: crypto.randomUUID(),
              taskId: id,
              taskTitle: updatedTask.title || oldTask.title || 'Untitled Task',
              category: updatedTask.status || oldTask.status || 'done',
              date: todayStr(),
              minutes: plannedMins,
              mood: updatedTask.mood || oldTask.mood || 4,
              isManual: true,
            };
          }

          return {
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, ...updatedTask, ...extraFields } : task
            ),
            focusHistory: newHistoryEntry ? [...state.focusHistory, newHistoryEntry] : state.focusHistory,
            ...earnedShieldState,
          };
        }),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          focusHistory: state.focusHistory.filter((h) => h.taskId !== id),
        })),

      moveTask: (id, newStatus, destinationIndex) =>
        set((state) => {
          const taskIndex = state.tasks.findIndex((t) => t.id === id);
          if (taskIndex === -1) return state;

          const newTasks = [...state.tasks];
          const [movedTask] = newTasks.splice(taskIndex, 1);
          const oldStatus = movedTask.status;
          movedTask.status = newStatus;

          let newHistoryEntry = null;
          let earnedShieldState = {};

          if (newStatus === 'done' && oldStatus !== 'done') {
            movedTask.completedAt = new Date().toISOString();
            const plannedMins = movedTask.duration ? parseDurationToMinutes(movedTask.duration) : 45;
            movedTask.actualDurationMinutes = plannedMins;
            movedTask.actualDuration = movedTask.duration || '45m';

            newHistoryEntry = {
              id: crypto.randomUUID(),
              taskId: id,
              taskTitle: movedTask.title,
              category: newStatus,
              date: todayStr(),
              minutes: plannedMins,
              mood: movedTask.mood || 4,
              isManual: true,
            };
            earnedShieldState = handleTaskCompletionEarn(state);
          } else if (newStatus !== 'done') {
            movedTask.completedAt = null;
          }

          let statusCount = 0;
          let insertIdx = newTasks.length;
          for (let i = 0; i < newTasks.length; i++) {
            if (newTasks[i].status === newStatus) {
              if (statusCount === destinationIndex) {
                insertIdx = i;
                break;
              }
              statusCount++;
            }
          }
          newTasks.splice(insertIdx, 0, movedTask);

          return {
            tasks: newTasks,
            focusHistory: newHistoryEntry ? [...state.focusHistory, newHistoryEntry] : state.focusHistory,
            ...earnedShieldState,
          };
        }),

      // Anti-Guilt Backlog Triage Action
      rescheduleOverdueTasks: (destinationDateOrColumn) =>
        set((state) => {
          const today = todayStr();
          const updatedTasks = state.tasks.map((task) => {
            if (task.status === 'done') return task;
            if (task.dueDate && task.dueDate < today) {
              if (destinationDateOrColumn === 'backlog') {
                return { ...task, status: 'backlog', dueDate: '' };
              }
              return { ...task, dueDate: destinationDateOrColumn };
            }
            return task;
          });
          return { tasks: updatedTasks, isFreshStartModalOpen: false };
        }),

      // Multi-Window / Multi-Tab Flow Session State
      activeFlow: null,
      startFlow: (task, durationMinutes = 25) =>
        set({
          activeFlow: {
            taskId: task.id,
            title: task.title,
            remainingSeconds: durationMinutes * 60,
            totalSeconds: durationMinutes * 60,
            durationMinutes,
            isRunning: true,
            mode: 'timer',
            subtasks: task.subtasks || [],
            contextNote: '',
            ambientSound: 'none',
            ambientVolume: 0.5,
            startedAt: new Date().toISOString(),
          },
        }),
      pauseFlow: () =>
        set((state) => ({
          activeFlow: state.activeFlow ? { ...state.activeFlow, isRunning: false } : null,
        })),
      resumeFlow: () =>
        set((state) => ({
          activeFlow: state.activeFlow ? { ...state.activeFlow, isRunning: true } : null,
        })),
      tickFlow: () =>
        set((state) => {
          if (!state.activeFlow || !state.activeFlow.isRunning) return state;
          const nextRemaining = Math.max(0, state.activeFlow.remainingSeconds - 1);
          return {
            activeFlow: {
              ...state.activeFlow,
              remainingSeconds: nextRemaining,
              isRunning: nextRemaining > 0 ? state.activeFlow.isRunning : false,
            },
          };
        }),
      stopFlow: (completed = false, sessionMood = 4) =>
        set((state) => {
          if (!state.activeFlow) return state;
          const { taskId, title, totalSeconds, remainingSeconds } = state.activeFlow;
          const spentSeconds = Math.max(60, totalSeconds - remainingSeconds);
          const focusedMinutes = Math.round(spentSeconds / 60);

          let updatedTasks = state.tasks;
          let earnedShieldState = {};
          let newHistoryEntry = {
            id: crypto.randomUUID(),
            taskId,
            taskTitle: title,
            date: todayStr(),
            minutes: focusedMinutes,
            mood: sessionMood,
            isManual: false,
          };

          if (completed) {
            earnedShieldState = handleTaskCompletionEarn(state);
            updatedTasks = state.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: 'done',
                    completedAt: new Date().toISOString(),
                    actualDurationMinutes: (t.actualDurationMinutes || 0) + focusedMinutes,
                    actualDuration: `${focusedMinutes}m`,
                    mood: sessionMood,
                  }
                : t
            );
          }

          return {
            activeFlow: null,
            tasks: updatedTasks,
            focusHistory: [...state.focusHistory, newHistoryEntry],
            ...earnedShieldState,
          };
        }),
      updateFlowContextNote: (note) =>
        set((state) => ({
          activeFlow: state.activeFlow ? { ...state.activeFlow, contextNote: note } : null,
        })),
      toggleFlowSubtask: (subtaskId) =>
        set((state) => {
          if (!state.activeFlow) return state;
          const updatedSubtasks = (state.activeFlow.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          // Also persist back to the task itself
          const updatedTasks = state.tasks.map((t) =>
            t.id === state.activeFlow.taskId ? { ...t, subtasks: updatedSubtasks } : t
          );
          return {
            activeFlow: { ...state.activeFlow, subtasks: updatedSubtasks },
            tasks: updatedTasks,
          };
        }),
      setFlowAmbientSound: (sound) =>
        set((state) => ({
          activeFlow: state.activeFlow ? { ...state.activeFlow, ambientSound: sound } : null,
        })),
      setFlowAmbientVolume: (vol) =>
        set((state) => ({
          activeFlow: state.activeFlow ? { ...state.activeFlow, ambientVolume: vol } : null,
        })),

      // Notes (Mind Dump) State
      notes: [{ id: 'general', title: 'Scratchpad', content: '' }],
      activeNoteId: 'general',
      setActiveNoteId: (id) => set({ activeNoteId: id }),
      addNote: (title) =>
        set((state) => {
          // Free tier limit: max 3 notes
          if (state.plan === 'free' && state.notes.length >= 3) {
            return { isProModalOpen: true };
          }
          return {
            notes: [...state.notes, { id: crypto.randomUUID(), title: title || 'New Pad', content: '' }],
          };
        }),
      updateNote: (id, content) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, content } : n)),
        })),
      deleteNote: (id) =>
        set((state) => {
          const newNotes = state.notes.filter((n) => n.id !== id);
          return {
            notes: newNotes,
            activeNoteId: state.activeNoteId === id ? (newNotes[0]?.id || null) : state.activeNoteId,
          };
        }),
      convertNoteToTask: (text, destinationCol = null) => {
        if (!text || !text.trim()) return;
        const state = get();
        const colId = destinationCol || state.columns[0]?.id || 'backlog';
        state.addTask({
          title: text.trim(),
          status: colId,
          priority: 'medium',
          energyLevel: 'standard',
        });
      },

      // Habits & Compulsory Tasks (Universal)
      compulsoryTasks: [
        { id: 'h-1', title: 'Deep Focus Block (90 mins)', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
        { id: 'h-2', title: 'Daily Review & Planning', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
      ],
      archivedCompulsoryTasks: [],
      compulsoryTaskHistory: {},

      // Momentum, Streaks, Shields & Rest Days
      streakCount: 0,
      lastStreakDate: null,
      lastResetDate: null,
      streakShields: 1, // 1 starting shield
      taskCompletionsForShield: 0,
      shieldConsumedToday: false,
      restDays: [], // ['2026-09-07']
      streakRecoveryQuest: null, // { active: false, targetCount: 3, completedCount: 0 }
      dailyFocusTasks: [],
      kickoffCompletedDate: null,
      windDownCompletedDate: null,
      focusHistory: [],

      toggleRestDay: (dateStr) =>
        set((state) => {
          const exists = state.restDays.includes(dateStr);
          return {
            restDays: exists ? state.restDays.filter((d) => d !== dateStr) : [...state.restDays, dateStr],
          };
        }),

      checkAndResetDaily: () =>
        set((state) => {
          const today = todayStr();
          if (state.lastResetDate === today) return {};

          const updatedHabits = state.compulsoryTasks.map((t) => ({
            ...t,
            completedToday: false,
            breakUntil: t.breakUntil && t.breakUntil < today ? null : t.breakUntil,
          }));

          let newStreakCount = state.streakCount;
          let shieldConsumed = false;
          let newStreakShields = state.streakShields;
          let recoveryQuest = state.streakRecoveryQuest;

          if (state.lastResetDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('en-CA');

            // If yesterday was NOT a streak date and NOT a scheduled rest day
            if (state.lastStreakDate !== yesterdayStr && !state.restDays.includes(yesterdayStr)) {
              if (state.streakShields > 0) {
                newStreakShields = state.streakShields - 1;
                shieldConsumed = true;
              } else {
                // Streak broken: Offer 24h comeback quest instead of permanent loss
                newStreakCount = 0;
                recoveryQuest = {
                  active: true,
                  targetCount: 3,
                  completedCount: 0,
                  expiresAt: today,
                };
              }
            }
          }

          return {
            compulsoryTasks: updatedHabits,
            lastResetDate: today,
            streakCount: newStreakCount,
            streakShields: newStreakShields,
            shieldConsumedToday: shieldConsumed,
            streakRecoveryQuest: recoveryQuest,
            dailyFocusTasks: [],
          };
        }),

      addCompulsoryTask: (title) =>
        set((state) => ({
          compulsoryTasks: [
            ...state.compulsoryTasks,
            {
              id: crypto.randomUUID(),
              title,
              completedToday: false,
              breakUntil: null,
              addedAt: new Date().toISOString(),
            },
          ],
        })),

      toggleCompulsoryTaskToday: (id) =>
        set((state) => {
          const today = todayStr();
          const updatedHabits = state.compulsoryTasks.map((task) =>
            task.id === id ? { ...task, completedToday: !task.completedToday } : task
          );

          const activeHabits = updatedHabits.filter((t) => !t.breakUntil || t.breakUntil < today);
          const allActiveDone = activeHabits.length > 0 && activeHabits.every((t) => t.completedToday);

          let newStreakCount = state.streakCount;
          let newLastStreakDate = state.lastStreakDate;

          if (allActiveDone && state.lastStreakDate !== today) {
            newStreakCount = state.streakCount + 1;
            newLastStreakDate = today;
          }

          return {
            compulsoryTasks: updatedHabits,
            streakCount: newStreakCount,
            lastStreakDate: newLastStreakDate,
          };
        }),

      setDailyFocus: (taskIds) => set({ dailyFocusTasks: taskIds }),
      dismissShieldNotification: () => set({ shieldConsumedToday: false }),

      // Full Store Reset
      resetStore: () =>
        set({
          user: {
            name: 'Productivity Architect',
            role: 'Creator & Builder',
            avatar: '',
            hasCompletedOnboarding: false,
            dailyFocusTargetMinutes: 240,
          },
          plan: 'free',
          licenseKey: '',
          columns: DEFAULT_COLUMNS,
          tasks: [],
          notes: [{ id: 'general', title: 'Scratchpad', content: '' }],
          activeNoteId: 'general',
          compulsoryTasks: [
            { id: 'h-1', title: 'Deep Focus Block (90 mins)', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
            { id: 'h-2', title: 'Daily Review & Planning', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
          ],
          streakCount: 0,
          lastStreakDate: null,
          lastResetDate: null,
          streakShields: 1,
          taskCompletionsForShield: 0,
          shieldConsumedToday: false,
          restDays: [],
          streakRecoveryQuest: null,
          focusHistory: [],
          dailyFocusTasks: [],
          activeFlow: null,
        }),
    }),
    {
      name: 'vibeflow-store-v2', // Clean versioned persistence key
    }
  )
);
