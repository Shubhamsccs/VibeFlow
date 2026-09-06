import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Zap,
  Coffee,
  Layers,
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import confetti from "canvas-confetti";

export default function TaskModal({ isOpen, onClose, taskToEdit = null }) {
  if (!isOpen) return null;
  return <TaskModalInner onClose={onClose} taskToEdit={taskToEdit} />;
}

function TaskModalInner({ onClose, taskToEdit }) {
  const { addTask, updateTask, columns } = useTaskStore();
  const defaultCol = columns[0]?.id || "backlog";

  const [formData, setFormData] = useState(() => {
    const base = {
      title: "",
      description: "",
      status: defaultCol,
      priority: "medium",
      energyLevel: "standard", // 'deep' | 'standard' | 'light'
      dueDate: "",
      duration: "45m",
      mood: 4,
      subtasks: [],
    };
    return taskToEdit ? { ...base, ...taskToEdit } : base;
  });

  const [newSubtask, setNewSubtask] = useState("");
  const isEditing = Boolean(taskToEdit && taskToEdit.id);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setFormData((prev) => ({
      ...prev,
      subtasks: [
        ...(prev.subtasks || []),
        { id: crypto.randomUUID(), text: newSubtask.trim(), completed: false },
      ],
    }));
    setNewSubtask("");
  };

  const handleRemoveSubtask = (id) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskId = taskToEdit?.id || crypto.randomUUID();
    const taskPayload = {
      id: taskId,
      ...formData,
    };

    if (taskPayload.status === "done" && !taskPayload.completedAt) {
      taskPayload.completedAt = new Date().toISOString();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#8b5cf6", "#06b6d4"],
      });
    }

    if (isEditing) {
      updateTask(taskToEdit.id, taskPayload);
    } else {
      addTask(taskPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg glass-panel border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl my-auto">
        <div className="flex justify-between items-center pb-5 border-b border-white/[0.06] mb-6">
          <h2 className="text-xl font-black text-white tracking-tight">
            {isEditing ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What are you focusing on?"
              autoFocus
              className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Cognitive Energy Load */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Cognitive Energy Load
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "deep", label: "Deep Focus", icon: Zap, color: "text-brand-primary border-brand-primary/40" },
                { id: "standard", label: "Standard", icon: Layers, color: "text-brand-cyan border-brand-cyan/40" },
                { id: "light", label: "Quick Win", icon: Coffee, color: "text-amber-400 border-amber-400/40" },
              ].map((lvl) => {
                const Icon = lvl.icon;
                const isSel = formData.energyLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, energyLevel: lvl.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSel
                        ? `bg-slate-900 ${lvl.color} text-white shadow-md`
                        : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workspace Column & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Column Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.title}
                  </option>
                ))}
                <option value="done" className="bg-slate-900 text-white">Done / Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              >
                <option value="high" className="bg-slate-900 text-white">High Priority</option>
                <option value="medium" className="bg-slate-900 text-white">Medium Priority</option>
                <option value="low" className="bg-slate-900 text-white">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Due Date & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-primary" /> Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-primary" /> Est. Duration
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 45m, 1h 30m"
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Micro-steps Checklist */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Subtasks Checklist
            </label>
            <div className="space-y-1.5 mb-2 max-h-24 overflow-y-auto">
              {(formData.subtasks || []).map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/[0.04] text-xs text-slate-300"
                >
                  <span className="truncate">{st.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="+ Add micro-step..."
                className="flex-1 bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Notes & Context
            </label>
            <textarea
              rows={2}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details, URLs, or notes..."
              className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
