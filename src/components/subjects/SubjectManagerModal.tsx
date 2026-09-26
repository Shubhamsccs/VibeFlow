import React, { useState } from 'react';
import { X, Plus, Trash2, Check, BookOpen } from 'lucide-react';
import { useSubjectStore } from '../../store/useSubjectStore';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366f1', // Electric Indigo
  '#06b6d4', // Luminous Cyan
  '#10b981', // Muted Emerald
  '#f59e0b', // Amber Gold
  '#f43f5e', // Rose Crimson
  '#8b5cf6', // Violet Glow
  '#14b8a6', // Deep Teal
  '#ec4899', // Pink Flame
];

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { subjects, activeSubjectId, addSubject, deleteSubject, setActiveSubjectId } = useSubjectStore();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a subject name');
      return;
    }
    await addSubject(name, selectedColor);
    setName('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Manage Subjects</h3>
              <p className="text-xs text-slate-400">Organize your focus categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Subjects List */}
        <div className="max-h-56 overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
          {subjects.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              No subjects yet. Create your first subject below.
            </div>
          ) : (
            subjects.map((subject) => {
              const isActive = subject.id === activeSubjectId;
              return (
                <div
                  key={subject.id}
                  onClick={() => setActiveSubjectId(subject.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-white/5 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: subject.color_hex }}
                    />
                    <span className="text-sm font-semibold text-slate-200">{subject.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                    {subjects.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject(subject.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Subject Form */}
        <form onSubmit={handleCreate} className="pt-4 border-t border-white/5">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Add New Subject
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Advanced Calculus, System Architecture"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          {/* Color palette selector */}
          <div className="mb-4">
            <span className="block text-xs text-slate-400 mb-2">Subject Color</span>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    selectedColor === c ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </form>
      </div>
    </div>
  );
};
