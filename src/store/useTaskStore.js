import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTaskStore = create(
  persist(
    (set) => ({
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
      
      // Timer State
      activeTaskId: null,
      timerState: {
        mode: 'pomodoro', // 'pomodoro' or 'stopwatch'
        status: 'idle', // 'idle', 'running', 'paused'
        timeLeft: 25 * 60,
        totalElapsed: 0,
        startTime: null,
      },
      setTimerMode: (mode) => set((state) => ({ 
        timerState: { ...state.timerState, mode, timeLeft: mode === 'pomodoro' ? 25 * 60 : 0 } 
      })),
      updateTimer: (timeLeft, totalElapsed) => set((state) => ({
        timerState: { ...state.timerState, timeLeft, totalElapsed }
      })),
      setTimerStatus: (status) => set((state) => ({
        timerState: { ...state.timerState, status, startTime: status === 'running' ? Date.now() : state.timerState.startTime }
      })),
      setActiveTask: (id) => set({ activeTaskId: id }),

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

          // Find the exact insertion point
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
      resetStore: () => set({ 
        tasks: [], 
        activeTaskId: null, 
        timerState: {
          mode: 'pomodoro',
          status: 'idle',
          timeLeft: 25 * 60,
          totalElapsed: 0,
          startTime: null,
        }
      }),
    }),
    {
      name: 'blitzit-tasks',
    }
  )
);
