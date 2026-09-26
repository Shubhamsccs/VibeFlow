import { create } from 'zustand';
import { Subject } from '../types/tracker';
import { getSubjects, saveSubject, deleteSubject as dbDeleteSubject } from '../lib/db';

interface SubjectState {
  subjects: Subject[];
  activeSubjectId: string | null;
  isLoading: boolean;
  loadSubjects: () => Promise<void>;
  addSubject: (name: string, colorHex: string) => Promise<Subject>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  setActiveSubjectId: (id: string | null) => void;
  getActiveSubject: () => Subject | undefined;
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  activeSubjectId: null,
  isLoading: false,

  loadSubjects: async () => {
    set({ isLoading: true });
    try {
      const list = await getSubjects();
      set({
        subjects: list,
        activeSubjectId: get().activeSubjectId || (list.length > 0 ? list[0].id : null),
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading subjects:', err);
      set({ isLoading: false });
    }
  },

  addSubject: async (name: string, colorHex: string) => {
    const newSubject: Subject = {
      id: 'subj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      color_hex: colorHex,
      created_at: Date.now(),
    };
    await saveSubject(newSubject);
    set((state) => {
      const updated = [...state.subjects, newSubject];
      return {
        subjects: updated,
        activeSubjectId: state.activeSubjectId || newSubject.id,
      };
    });
    return newSubject;
  },

  updateSubject: async (subject: Subject) => {
    await saveSubject(subject);
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === subject.id ? subject : s)),
    }));
  },

  deleteSubject: async (id: string) => {
    await dbDeleteSubject(id);
    set((state) => {
      const updated = state.subjects.filter((s) => s.id !== id);
      const newActive = state.activeSubjectId === id ? (updated.length > 0 ? updated[0].id : null) : state.activeSubjectId;
      return { subjects: updated, activeSubjectId: newActive };
    });
  },

  setActiveSubjectId: (id: string | null) => {
    set({ activeSubjectId: id });
  },

  getActiveSubject: () => {
    const { subjects, activeSubjectId } = get();
    return subjects.find((s) => s.id === activeSubjectId);
  },
}));
