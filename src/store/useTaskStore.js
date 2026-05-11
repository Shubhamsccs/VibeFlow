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
      resetStore: () => set({ 
        tasks: [], 
        notes: [{ id: 'general', title: 'General', content: '' }],
        activeNoteId: 'general'
      }),
    }),
    {
      name: 'blitzit-tasks',
    }
  )
);
