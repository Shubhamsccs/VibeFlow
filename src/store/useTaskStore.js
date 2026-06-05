import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_COMPULSORY_TASKS = [
  { id: 'ct-1', title: 'Wake up and study one hour straight', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
  { id: 'ct-2', title: 'Hanuman Chalisa reading', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
  { id: 'ct-3', title: 'Ganpati Mandir visit', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
];

const todayStr = () => new Date().toLocaleDateString('en-CA');

const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;
  if (duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length >= 2) return (parts[0] * 60) + parts[1];
  }
  const h = parseInt(duration.match(/(\d+)h/)?.[1] || 0);
  const m = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
  if (h === 0 && m === 0 && !isNaN(parseInt(duration))) return parseInt(duration);
  return (h * 60) + m;
};

const isOnBreak = (task) => {
  if (!task.breakUntil) return false;
  return task.breakUntil >= todayStr();
};

const normalizeStatus = (status) => {
  if (!status || status === "todo") return "college";
  if (status === "webdev") return "web-dev";
  if (status === "java") return "dsa-java";
  if (status === "practice") return "dsa-practice";
  return status;
};

const handleTaskCompletionEarn = (state) => {
  const nextCount = state.taskCompletionsForShield + 1;
  if (nextCount >= 15) {
    return {
      taskCompletionsForShield: 0,
      streakShields: state.streakShields + 1,
    };
  }
  return {
    taskCompletionsForShield: nextCount,
  };
};

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      isTaskModalOpen: false,
      taskToEdit: null,
      openTaskModal: (task = null) => set({ isTaskModalOpen: true, taskToEdit: task }),
      closeTaskModal: () => set({ isTaskModalOpen: false, taskToEdit: null }),
      isResetModalOpen: false,
      openResetModal: () => set({ isResetModalOpen: true }),
      closeResetModal: () => set({ isResetModalOpen: false }),

      addTask: (task) =>
        set((state) => {
          const newTask = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ...task
          };
          
          if (newTask.status && newTask.status !== 'done') {
            newTask.category = newTask.status;
          } else if (!newTask.category) {
            newTask.category = newTask.status || "college";
          }
          
          let earnedShieldState = {};
          let newHistoryEntry = null;
          if (newTask.status === 'done') {
            earnedShieldState = handleTaskCompletionEarn(state);
            if (!newTask.actualDurationMinutes) {
              const plannedMins = parseDurationToMinutes(newTask.duration) || 60;
              newTask.actualDurationMinutes = plannedMins;
              newTask.actualDuration = newTask.duration || "1h";

              const category = newTask.category || newTask.status || "college";
              newHistoryEntry = {
                id: crypto.randomUUID(),
                taskId: newTask.id,
                taskTitle: newTask.title,
                category: normalizeStatus(category),
                date: todayStr(),
                minutes: plannedMins,
                mood: newTask.mood || 4,
                isManual: true,
              };
            }
          }

          return {
            tasks: [...state.tasks, newTask],
            focusHistory: newHistoryEntry ? [...state.focusHistory, newHistoryEntry] : state.focusHistory,
            ...earnedShieldState,
          };
        }),
      updateTask: (id, updatedTask) =>
        set((state) => {
          const oldTask = state.tasks.find(t => t.id === id);
          const isNewlyDone = oldTask && oldTask.status !== 'done' && updatedTask.status === 'done';
          
          let earnedShieldState = {};
          let extraFields = {};
          let newHistoryEntry = null;

          if (updatedTask.status && updatedTask.status !== 'done') {
            extraFields.category = updatedTask.status;
          }

          if (isNewlyDone) {
            earnedShieldState = handleTaskCompletionEarn(state);
            if (!oldTask.actualDurationMinutes) {
              const plannedMins = parseDurationToMinutes(oldTask.duration || updatedTask.duration) || 60;
              const formattedDuration = oldTask.duration || updatedTask.duration || "1h";
              extraFields.actualDurationMinutes = plannedMins;
              extraFields.actualDuration = formattedDuration;

              const category = oldTask.category || oldTask.status || "college";
              newHistoryEntry = {
                id: crypto.randomUUID(),
                taskId: id,
                taskTitle: oldTask.title || updatedTask.title || "Untitled Task",
                category: normalizeStatus(category),
                date: todayStr(),
                minutes: plannedMins,
                mood: oldTask.mood || updatedTask.mood || 4,
                isManual: true,
              };
            }
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
          // Also purge any focusHistory entries tied to this task
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
          if (newStatus === 'done' && !movedTask.completedAt) {
            movedTask.completedAt = new Date().toISOString();
            if (!movedTask.actualDurationMinutes) {
              const plannedMins = parseDurationToMinutes(movedTask.duration) || 60;
              movedTask.actualDurationMinutes = plannedMins;
              movedTask.actualDuration = movedTask.duration || "1h";

              const category = movedTask.category || movedTask.status || "college";
              newHistoryEntry = {
                id: crypto.randomUUID(),
                taskId: id,
                taskTitle: movedTask.title,
                category: normalizeStatus(category),
                date: todayStr(),
                minutes: plannedMins,
                mood: movedTask.mood || 4,
                isManual: true,
              };
            }
          } else if (newStatus !== 'done') {
            movedTask.completedAt = null;
            movedTask.category = newStatus;
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
          
          let earnedShieldState = {};
          if (newStatus === 'done' && oldStatus !== 'done') {
            earnedShieldState = handleTaskCompletionEarn(state);
          }

          return { 
            tasks: newTasks,
            focusHistory: newHistoryEntry ? [...state.focusHistory, newHistoryEntry] : state.focusHistory,
            ...earnedShieldState,
          };
        }),

      notes: [{ id: 'general', title: 'General', content: '' }],
      activeNoteId: 'general',
      setActiveNoteId: (id) => set({ activeNoteId: id }),
      addNote: (title) => set((state) => ({
        notes: [...state.notes, { id: crypto.randomUUID(), title, content: '' }]
      })),
      updateNote: (id, content) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, content } : n)
      })),
      deleteNote: (id) => set((state) => {
        const newNotes = state.notes.filter(n => n.id !== id);
        return {
          notes: newNotes,
          activeNoteId: state.activeNoteId === id ? (newNotes[0]?.id || null) : state.activeNoteId
        };
      }),

      compulsoryTasks: DEFAULT_COMPULSORY_TASKS,
      archivedCompulsoryTasks: [],
      streakCount: 0,
      lastStreakDate: null,

      // Productivity Powerhouse state
      streakShields: 0,
      taskCompletionsForShield: 0,
      shieldConsumedToday: false,
      dailyFocusTasks: [],
      kickoffCompletedDate: null,
      windDownCompletedDate: null,
      focusSession: { activeTaskId: null, secondsElapsed: 0, baseElapsed: 0, isPaused: true, duration: 1500, isStopwatch: false, startedAt: null },
      focusHistory: [],

      syncPlannedAndActualDurations: () => set((state) => {
        const parseMins = (dur) => {
          if (!dur) return 60;
          if (dur.includes(':')) {
            const parts = dur.split(':').map(Number);
            if (parts.length >= 2) return (parts[0] * 60) + parts[1];
          }
          const h = parseInt(dur.match(/(\d+)h/)?.[1] || 0);
          const m = parseInt(dur.match(/(\d+)m/)?.[1] || 0);
          if (h === 0 && m === 0 && !isNaN(parseInt(dur))) return parseInt(dur);
          return (h * 60) + m || 60;
        };

        const updatedTasks = state.tasks.map((task) => {
          if (task.status === 'done') {
            const plannedMins = parseMins(task.duration);
            const formatted = task.duration || "1h";
            return {
              ...task,
              actualDurationMinutes: plannedMins,
              actualDuration: formatted,
            };
          }
          return task;
        });

        // Build a Set of current task IDs for fast lookup
        const taskIdSet = new Set(state.tasks.map(t => t.id));

        // Deduplicate focusHistory: keep at most ONE manual entry per taskId.
        // Remove entries for tasks that have been deleted.
        // Track taskIds that already have ANY entry (manual or timer).
        const seenTaskIds = new Set();
        const updatedHistory = [];
        for (const item of state.focusHistory) {
          // Drop entries for deleted tasks
          if (!taskIdSet.has(item.taskId)) continue;

          // For manual (sync) entries, keep only the first occurrence per task
          if (item.isManual) {
            if (seenTaskIds.has(item.taskId)) continue;
            seenTaskIds.add(item.taskId);
          } else {
            // Timer entry — always keep, just track the taskId
            seenTaskIds.add(item.taskId);
          }

          // Update minutes to match the task's current planned duration
          const task = state.tasks.find(t => t.id === item.taskId);
          const plannedMins = task ? parseMins(task.duration) : item.minutes;
          updatedHistory.push({ ...item, minutes: plannedMins });
        }

        // ── Backfill missing entries for historical completed tasks ──────────
        // Any 'done' task with NO focusHistory entry at all (completed before
        // the focus timer existed, tracked via offline stopwatch) gets a
        // synthetic manual entry so planned hours === actual hours in Analytics.
        for (const task of state.tasks) {
          if (task.status !== 'done') continue;
          if (seenTaskIds.has(task.id)) continue; // already has an entry — skip

          const plannedMins = parseMins(task.duration);
          const dateStr = task.completedAt?.split('T')[0]
            || task.dueDate
            || task.createdAt?.split('T')[0]
            || todayStr();

          updatedHistory.push({
            id: crypto.randomUUID(),
            taskId: task.id,
            taskTitle: task.title,
            category: normalizeStatus(task.category || task.status || 'college'),
            date: dateStr,
            minutes: plannedMins,
            mood: task.mood || 4,
            isManual: true,
          });
          seenTaskIds.add(task.id);
        }

        return {
          tasks: updatedTasks,
          focusHistory: updatedHistory,
        };
      }),

      // Called on app load to reset daily state and auto-resume expired breaks
      checkAndResetDaily: () => set((state) => {
        const today = todayStr();
        // If we've already reset today, skip
        if (state.lastResetDate === today) return {};

        const updatedTasks = state.compulsoryTasks.map(task => ({
          ...task,
          completedToday: false,
          // Auto-resume tasks whose break has expired
          breakUntil: task.breakUntil && task.breakUntil < today ? null : task.breakUntil,
        }));

        // Calculate if they missed completing their active tasks yesterday
        let newStreakCount = state.streakCount;
        let shieldConsumed = false;
        let newStreakShields = state.streakShields;

        if (state.lastResetDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA');

          if (state.lastStreakDate !== yesterdayStr) {
            const activeYesterday = state.compulsoryTasks.filter(t => {
              if (!t.breakUntil) return true;
              return t.breakUntil < state.lastResetDate;
            });

            if (activeYesterday.length > 0) {
              if (state.streakShields > 0) {
                newStreakShields = state.streakShields - 1;
                shieldConsumed = true;
              } else {
                newStreakCount = 0;
              }
            }
          }
        }

        return {
          compulsoryTasks: updatedTasks,
          lastResetDate: today,
          streakCount: newStreakCount,
          streakShields: newStreakShields,
          shieldConsumedToday: shieldConsumed,
          dailyFocusTasks: [], // reset daily priorities for the new day
        };
      }),

      addCompulsoryTask: (title) => set((state) => ({
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

      toggleCompulsoryTaskToday: (id) => set((state) => {
        const today = todayStr();
        const updatedTasks = state.compulsoryTasks.map(task =>
          task.id === id ? { ...task, completedToday: !task.completedToday } : task
        );

        // Active tasks = not on break
        const activeTasks = updatedTasks.filter(t => !isOnBreak(t));
        const allActiveDone = activeTasks.length > 0 && activeTasks.every(t => t.completedToday);

        let newStreakCount = state.streakCount;
        let newLastStreakDate = state.lastStreakDate;

        if (allActiveDone && state.lastStreakDate !== today) {
          newStreakCount = state.streakCount + 1;
          newLastStreakDate = today;
        }

        // If unchecking caused streak condition to un-meet, don't roll back streak
        // (streaks only go up, never down mid-day)

        return {
          compulsoryTasks: updatedTasks,
          streakCount: newStreakCount,
          lastStreakDate: newLastStreakDate,
        };
      }),

      setTaskBreak: (id, untilDate) => set((state) => ({
        compulsoryTasks: state.compulsoryTasks.map(task =>
          task.id === id ? { ...task, breakUntil: untilDate } : task
        ),
      })),

      retireCompulsoryTask: (id) => set((state) => {
        const task = state.compulsoryTasks.find(t => t.id === id);
        if (!task) return {};

        // Compute stats from persisted daily completion data
        const taskHistory = state.compulsoryTaskHistory?.[id] || {};
        const completedDays = Object.values(taskHistory).filter(Boolean).length;

        // Best streak: compute from sorted dates
        const sortedDates = Object.keys(taskHistory)
          .filter(d => taskHistory[d])
          .sort();

        let bestStreak = 0;
        let currentRun = 0;
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            currentRun = 1;
          } else {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            currentRun = diff === 1 ? currentRun + 1 : 1;
          }
          bestStreak = Math.max(bestStreak, currentRun);
        }

        const addedDate = task.addedAt?.split('T')[0] || todayStr();
        const retiredDate = todayStr();
        const totalDays = sortedDates.length > 0
          ? Math.round((new Date(retiredDate) - new Date(addedDate)) / (1000 * 60 * 60 * 24)) + 1
          : 1;
        const activeDays = Math.max(1, totalDays);
        const completionRate = Math.round((completedDays / activeDays) * 100);

        const archivedEntry = {
          id: task.id,
          title: task.title,
          addedAt: task.addedAt,
          retiredAt: new Date().toISOString(),
          totalDaysCompleted: completedDays,
          bestStreak,
          completionRate,
          totalActiveDays: activeDays,
        };

        return {
          compulsoryTasks: state.compulsoryTasks.filter(t => t.id !== id),
          archivedCompulsoryTasks: [archivedEntry, ...state.archivedCompulsoryTasks],
        };
      }),

      permanentlyDeleteArchivedTask: (id) => set((state) => ({
        archivedCompulsoryTasks: state.archivedCompulsoryTasks.filter(t => t.id !== id),
      })),

      // Track daily completions per task for archive analytics
      recordDailyCompletion: (taskId, date, completed) => set((state) => ({
        compulsoryTaskHistory: {
          ...state.compulsoryTaskHistory,
          [taskId]: {
            ...(state.compulsoryTaskHistory?.[taskId] || {}),
            [date]: completed,
          },
        },
      })),

      // Focus Timer Actions
      startFocus: (taskId, durationSeconds = 1500, isStopwatch = false) => set({
        focusSession: {
          activeTaskId: taskId,
          secondsElapsed: 0,
          baseElapsed: 0,        // accumulated seconds from completed pause intervals
          isPaused: false,
          duration: durationSeconds,
          isStopwatch,
          startedAt: Date.now(), // fixed reference — NEVER reset during ticking
        }
      }),

      pauseFocus: () => set((state) => {
        const session = state.focusSession;
        if (!session.isPaused) {
          // Pausing: freeze elapsed into baseElapsed, clear startedAt
          const frozen = session.baseElapsed +
            (session.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0);
          return { focusSession: { ...session, isPaused: true, baseElapsed: frozen, secondsElapsed: frozen, startedAt: null } };
        } else {
          // Resuming: record a fresh startedAt, keep baseElapsed as-is
          return { focusSession: { ...session, isPaused: false, startedAt: Date.now() } };
        }
      }),

      // Called every second by setInterval — startedAt is NEVER reset here.
      // We compute total elapsed as baseElapsed + (now - startedAt), which is always
      // accurate even if the interval fires slightly early or late.
      tickFocus: () => set((state) => {
        const session = state.focusSession;
        if (session.isPaused || !session.activeTaskId || !session.startedAt) return {};

        const currentElapsed = session.baseElapsed +
          Math.floor((Date.now() - session.startedAt) / 1000);

        // Stopwatch: count up forever
        if (session.isStopwatch) {
          return { focusSession: { ...session, secondsElapsed: currentElapsed } };
        }
        // Timer: pause when countdown finishes
        if (currentElapsed >= session.duration) {
          return { focusSession: { ...session, secondsElapsed: session.duration, isPaused: true, startedAt: null } };
        }
        return { focusSession: { ...session, secondsElapsed: currentElapsed } };
      }),
      stopFocus: (save = true) => {
        if (save) {
          get().completeFocusSession(false, 3);
        } else {
          set({
            focusSession: { activeTaskId: null, secondsElapsed: 0, baseElapsed: 0, isPaused: true, duration: 1500, isStopwatch: false, startedAt: null },
          });
        }
      },
      completeFocusSession: (markTaskDone = false, mood = 3) => set((state) => {
        const session = state.focusSession;
        const { activeTaskId } = session;
        if (!activeTaskId) return {};

        // Compute the most accurate final elapsed — includes any un-ticked fraction
        // since the last setInterval fire. This prevents losing up to 1s on save.
        const liveElapsed = session.isPaused
          ? session.baseElapsed
          : session.baseElapsed + Math.floor((Date.now() - (session.startedAt || Date.now())) / 1000);

        const minutes = Math.max(1, Math.round(liveElapsed / 60));
        const task = state.tasks.find(t => t.id === activeTaskId);
        const category = task ? (task.category || task.status) : "college";

        const newSessionRecord = {
          id: crypto.randomUUID(),
          taskId: activeTaskId,
          taskTitle: task ? task.title : "Unknown Task",
          category: normalizeStatus(category),
          date: todayStr(),
          minutes,
          mood,
          isManual: false,
        };

        let updatedTasks = state.tasks;
        let earnedShieldState = {};

        if (task) {
          const currentActual = task.actualDurationMinutes || 0;
          const newActual = currentActual + minutes;
          
          const formatMins = (mins) => {
            if (mins >= 60) {
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return m > 0 ? `${h}h ${m}m` : `${h}h`;
            }
            return `${mins}m`;
          };
          const formattedActual = formatMins(newActual);

          const updatedFields = {
            actualDurationMinutes: newActual,
            actualDuration: formattedActual,
            mood: mood,
          };

          if (markTaskDone) {
            updatedFields.status = 'done';
            if (!task.completedAt) {
              updatedFields.completedAt = new Date().toISOString();
            }
          }

          updatedTasks = state.tasks.map(t => 
            t.id === activeTaskId ? { ...t, ...updatedFields } : t
          );

          if (markTaskDone && task.status !== 'done') {
            earnedShieldState = handleTaskCompletionEarn(state);
          }
        }

        return {
          tasks: updatedTasks,
          focusHistory: [...state.focusHistory, newSessionRecord],
          focusSession: { activeTaskId: null, secondsElapsed: 0, baseElapsed: 0, isPaused: true, duration: 1500, isStopwatch: false, startedAt: null },
          ...earnedShieldState
        };
      }),

      // Returns the live elapsed seconds including un-ticked wall-clock fraction
      getLiveElapsed: () => {
        const session = get().focusSession;
        if (session.isPaused || !session.startedAt) return session.baseElapsed || session.secondsElapsed;
        return session.baseElapsed + Math.floor((Date.now() - session.startedAt) / 1000);
      },

      // Daily Wizard Actions
      setDailyFocus: (taskIds) => set({ dailyFocusTasks: taskIds }),
      completeKickoff: () => set({ kickoffCompletedDate: todayStr() }),
      completeWindDown: () => set({ windDownCompletedDate: todayStr() }),
      dismissShieldNotification: () => set({ shieldConsumedToday: false }),

      // Shield Actions
      addStreakShield: () => set((state) => ({ streakShields: state.streakShields + 1 })),
      useStreakShield: () => set((state) => ({ streakShields: Math.max(0, state.streakShields - 1) })),

      resetStore: () => set({
        tasks: [],
        notes: [{ id: 'general', title: 'General', content: '' }],
        activeNoteId: 'general',
        compulsoryTasks: DEFAULT_COMPULSORY_TASKS,
        archivedCompulsoryTasks: [],
        streakCount: 0,
        lastStreakDate: null,
        compulsoryTaskHistory: {},
        lastResetDate: null,
        
        // Reset new states
        streakShields: 0,
        taskCompletionsForShield: 0,
        focusHistory: [],
        dailyFocusTasks: [],
        kickoffCompletedDate: null,
        windDownCompletedDate: null,
        focusSession: { activeTaskId: null, secondsElapsed: 0, isPaused: true, duration: 1500 },
        shieldConsumedToday: false,
      }),
    }),
    {
      name: 'blitzit-tasks',
    }
  )
);
