import { useState, useMemo, useEffect, useRef } from "react";
import { X, Calendar, AlertCircle, Columns, Clock, Play, Square, Smile, ChevronDown, Trophy } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import confetti from "canvas-confetti";

const COLUMN_OPTIONS = [
  { id: "college", label: "College Work" },
  { id: "myspace", label: "MySpace" },
  { id: "dsa-java", label: "DSA Java" },
  { id: "web-dev", label: "Web Development" },
  { id: "dsa-practice", label: "DSA Practice" },
  { id: "done", label: "Finished Tasks" },
];

function getInitialFormData(taskToEdit) {
  const base = {
    title: "",
    description: "",
    status: "college",
    priority: "medium",
    dueDate: "",
    duration: "",
    startTime: "",
    endTime: "",
    mood: 3,
    isQuickTask: false,
  };

  if (taskToEdit && taskToEdit.id) {
    return {
      ...base,
      ...taskToEdit,
    };
  }
  
  return {
    ...base,
    ...taskToEdit,
  };
}

// Helper to calculate duration between two 24h times
function calculateDuration(start, end) {
  if (!start || !end) return "";
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
  if (diffMins < 0) diffMins += 24 * 60; // Handle overnight tasks
  
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function TaskModal({ isOpen, onClose, taskToEdit = null }) {
  if (!isOpen) return null;
  return <TaskModalInner onClose={onClose} taskToEdit={taskToEdit} />;
}

function TimePicker({ value, onChange, label, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current value
  const h24 = value ? parseInt(value.split(':')[0]) : 12;
  const mins = value ? parseInt(value.split(':')[1]) : 0;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;

  const handleSelect = (h, m, p) => {
    let finalH = h % 12;
    if (p === 'PM') finalH += 12;
    const finalValue = `${finalH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onChange(finalValue);
  };

  const displayValue = value ? `${h12}:${mins.toString().padStart(2, '0')} ${ampm}` : 'Set Time';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-[13px] text-slate-200 bg-slate-950/40 hover:bg-slate-800 p-2 rounded-lg border border-slate-800/50 transition-all"
      >
        <span>{displayValue}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-100 bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 w-64 animate-in zoom-in-95 duration-150">
          <div className="flex gap-4 h-48">
            {/* Hours */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-1">
              <div className="text-[9px] font-black text-slate-600 uppercase mb-2 text-center sticky top-0 bg-slate-900 py-1">Hour</div>
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelect(h, mins, ampm)}
                  className={`w-full py-2 text-xs font-bold rounded-lg mb-1 transition-all ${h === h12 ? 'bg-brand-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {h}
                </button>
              ))}
            </div>
            {/* Minutes */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-1">
              <div className="text-[9px] font-black text-slate-600 uppercase mb-2 text-center sticky top-0 bg-slate-900 py-1">Min</div>
              {[0, 15, 30, 45].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelect(h12, m, ampm)}
                  className={`w-full py-2 text-xs font-bold rounded-lg mb-1 transition-all ${m === mins ? 'bg-brand-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {m.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            {/* AM/PM */}
            <div className="flex-1 py-1">
              <div className="text-[9px] font-black text-slate-600 uppercase mb-2 text-center sticky top-0 bg-slate-900 py-1">Period</div>
              {['AM', 'PM'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelect(h12, mins, p)}
                  className={`w-full py-2 text-xs font-bold rounded-lg mb-1 transition-all ${p === ampm ? 'bg-brand-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskModalInner({ onClose, taskToEdit }) {
  const { addTask, updateTask, notes, updateNote } = useTaskStore();
  const [formData, setFormData] = useState(() => {
    const data = getInitialFormData(taskToEdit);
    // If marking as done and no times set, pre-fill with current time (skip for quick tasks)
    if (data.status === 'done' && !data.startTime && !data.isQuickTask) {
      const now = new Date();
      data.endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const start = new Date(now.getTime() - 60 * 60 * 1000); // Default 1h back
      data.startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
    }
    return data;
  });
  const isEditing = taskToEdit && taskToEdit.id;

  // Linked Note state
  const [linkedNoteId, setLinkedNoteId] = useState("");

  useEffect(() => {
    if (isEditing) {
      const foundNote = notes.find(n => n.linkedTaskId === taskToEdit?.id);
      setLinkedNoteId(foundNote ? foundNote.id : "");
    } else {
      setLinkedNoteId("");
    }
  }, [taskToEdit, notes, isEditing]);

  // Auto-calculate duration when start or end time changes
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const newDuration = calculateDuration(formData.startTime, formData.endTime);
      if (newDuration !== formData.duration) {
        setFormData(prev => ({ ...prev, duration: newDuration }));
      }
    }
  }, [formData.startTime, formData.endTime, formData.duration]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Determine or generate task ID so we can associate the note
    const taskId = taskToEdit?.id || crypto.randomUUID();
    
    const taskData = {
      id: taskId,
      ...formData,
      category: formData.status === 'done' 
        ? (formData.category && formData.category !== 'done' ? formData.category : 'college')
        : formData.status,
    };

    if (taskData.status === 'done' && !taskData.completedAt) {
      taskData.completedAt = new Date().toISOString();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#ec4899", "#22c55e"],
      });
    }

    if (isEditing) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
    }

    // Handle Linked Note logic
    notes.forEach(n => {
      // Clear linkedTaskId on any note that was linked to this task but is no longer selected
      if (n.linkedTaskId === taskId && n.id !== linkedNoteId) {
        updateNote(n.id, { linkedTaskId: null });
      }
    });

    if (linkedNoteId) {
      updateNote(linkedNoteId, { linkedTaskId: taskId });
    }

    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-9999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-4xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden my-auto animate-slide-in">
        <div className="flex justify-between items-center p-8 border-b border-slate-800/50">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
            {isEditing ? (formData.status === 'done' ? "Complete Activity" : "Edit Activity") : "New Activity"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-all font-bold"
              placeholder="What's the goal?"
            />
          </div>

          {/* Quick Task Option */}
          <div className="flex items-center gap-3 p-4 bg-slate-950/20 rounded-2xl border border-slate-800/50">
            <input
              type="checkbox"
              id="isQuickTask"
              checked={formData.isQuickTask || false}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData(prev => ({
                  ...prev,
                  isQuickTask: checked,
                  startTime: checked ? "" : prev.startTime,
                  endTime: checked ? "" : prev.endTime,
                  duration: checked ? "0m" : (prev.startTime && prev.endTime ? calculateDuration(prev.startTime, prev.endTime) : prev.duration),
                  actualDurationMinutes: checked ? 0 : prev.actualDurationMinutes,
                  actualDuration: checked ? "0m" : prev.actualDuration
                }));
              }}
              className="w-4 h-4 rounded accent-brand-primary cursor-pointer"
            />
            <label htmlFor="isQuickTask" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
              Quick Task <span className="text-[10px] text-slate-500 font-medium font-mono">(No Time Tracking, 0m duration)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                <Calendar className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-all font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-all font-bold text-sm appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Time Tracking Section */}
          {!formData.isQuickTask && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-950/40 rounded-3xl border border-slate-800">
            <TimePicker 
              label="Start" 
              icon={Play} 
              value={formData.startTime} 
              onChange={(v) => setFormData({ ...formData, startTime: v })} 
            />
            <TimePicker 
              label="End" 
              icon={Square} 
              value={formData.endTime} 
              onChange={(v) => setFormData({ ...formData, endTime: v })} 
            />
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Duration
              </label>
              <div className="bg-slate-800/30 border border-slate-800/50 rounded-lg p-2 h-[38px] flex items-center">
                <span className={`text-sm font-black ${formData.duration ? 'text-brand-success' : 'text-slate-600'}`}>
                  {formData.duration || "—"}
                </span>
              </div>
            </div>
          </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                <Columns className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> Section
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-all font-bold text-sm appearance-none"
              >
                {COLUMN_OPTIONS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                <Smile className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> Mood ({formData.mood}/5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-primary mt-4"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Link Mind Dump Pad
            </label>
            <select
              value={linkedNoteId}
              onChange={(e) => setLinkedNoteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-all font-bold text-sm appearance-none"
            >
              <option value="">-- No Pad Linked --</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 bg-slate-800 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-brand-primary text-white hover:scale-105 transition-all shadow-xl shadow-brand-primary/20"
            >
              {isEditing ? (formData.status === 'done' ? "Complete" : "Save Changes") : "Create Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
