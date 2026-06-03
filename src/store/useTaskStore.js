import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_COMPULSORY_TASKS = [
  { id: 'ct-1', title: 'Wake up and study one hour straight', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
  { id: 'ct-2', title: 'Hanuman Chalisa reading', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
  { id: 'ct-3', title: 'Ganpati Mandir visit', completedToday: false, breakUntil: null, addedAt: new Date().toISOString() },
];

const todayStr = () => new Date().toLocaleDateString('en-CA');

const isOnBreak = (task) => {
  if (!task.breakUntil) return false;
  return task.breakUntil >= todayStr();
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
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              ...task
            },
          ],
        })),
      updateTask: (id, updatedTask) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updatedTask } : task
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),
      moveTask: (id, newStatus, destinationIndex) =>
        set((state) => {
          const taskIndex = state.tasks.findIndex((t) => t.id === id);
          if (taskIndex === -1) return state;

          const newTasks = [...state.tasks];
          const [movedTask] = newTasks.splice(taskIndex, 1);
          movedTask.status = newStatus;

          if (newStatus === 'done' && !movedTask.completedAt) {
            movedTask.completedAt = new Date().toISOString();
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
          return { tasks: newTasks };
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

      // ─── Rewards System ───────────────────────────────────────────────────────

      compulsoryTasks: DEFAULT_COMPULSORY_TASKS,
      archivedCompulsoryTasks: [],
      streakCount: 0,
      lastStreakDate: null,
      claimedRewards: [],

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

        return {
          compulsoryTasks: updatedTasks,
          lastResetDate: today,
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

      claimReward: (rewardId) => set((state) => ({
        claimedRewards: state.claimedRewards.includes(rewardId)
          ? state.claimedRewards
          : [...state.claimedRewards, rewardId],
      })),

      resetStore: () => set({
        tasks: [],
        notes: [{ id: 'general', title: 'General', content: '' }],
        activeNoteId: 'general',
        compulsoryTasks: DEFAULT_COMPULSORY_TASKS,
        archivedCompulsoryTasks: [],
        streakCount: 0,
        lastStreakDate: null,
        claimedRewards: [],
        compulsoryTaskHistory: {},
        lastResetDate: null,
      }),
    }),
    {
      name: 'blitzit-tasks',
    }
  )
);
