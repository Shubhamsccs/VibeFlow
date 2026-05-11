import { Check, Trash2, Info, Calendar, Clock, Smile, ArrowRightLeft, X } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import confetti from "canvas-confetti";
import { useTaskStore } from "../store/useTaskStore";
import { useState } from "react";

const SECTIONS = [
  { id: 'college', title: 'College Work' },
  { id: 'myspace', title: 'MySpace' },
  { id: 'dsa-java', title: 'DSA Java' },
  { id: 'web-dev', title: 'Web Development' },
  { id: 'dsa-practice', title: 'DSA Practice' }
];

export default function TaskCard({ task, index, columnAccent }) {
  const { openTaskModal, updateTask, deleteTask } = useTaskStore();
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const priorityColor = {
    high: { bg: "rgba(255,0,0,0.5)", text: "#ff0000", label: "HIGH" },
    medium: { bg: "rgba(255,215,0,0.5)", text: "#ffd700", label: "MEDIUM" },
    low: { bg: "rgba(37,211,102,0.5)", text: "#25d366", label: "LOW" },
  }[task.priority || "medium"];

  const handleMove = (sectionId) => {
    updateTask(task.id, { status: sectionId });
    setShowMoveMenu(false);
  };

  const handleComplete = (e) => {
    e.stopPropagation();
    // Open modal in completion mode by pre-setting status to done
    openTaskModal({ ...task, status: "done" });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  const handleDetails = (e) => {
    e.stopPropagation();
    openTaskModal(task);
  };

  const formatDueDate = () => {
    if (!task.dueDate) return "No Date";
    try {
      return new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "No Date";
    }
  };

  const isDone = task.status === "done";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-xl p-5 mb-4 border transition-all duration-200 cursor-grab active:cursor-grabbing relative ${
            snapshot.isDragging
              ? "rotate-1 scale-105 shadow-2xl z-50 border-brand-primary bg-[#111111]"
              : "bg-black border-slate-800 hover:border-slate-700 hover:bg-[#0a0a0a]"
          } ${isDone ? "opacity-70" : ""}`}
        >
          {/* Move Menu Overlay */}
          {showMoveMenu && (
            <div className="absolute inset-0 z-30 bg-black/95 rounded-xl p-3 flex flex-col gap-2 border border-brand-primary animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Move To:</span>
                <button onClick={() => setShowMoveMenu(false)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
              </div>
              <div className="grid grid-cols-1 gap-1 overflow-y-auto custom-scrollbar">
                {SECTIONS.filter(s => s.id !== task.status).map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleMove(section.id)}
                    className="text-left px-3 py-2 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-brand-primary/20 rounded border border-transparent hover:border-brand-primary/30 transition-all"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title + Priority */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h4
              className={`font-bold text-sm leading-tight ${isDone ? "line-through text-slate-500" : "text-white"}`}
            >
              {task.title}
            </h4>
            <span
              className="text-[9px] uppercase font-black px-2 py-0.5 rounded shrink-0 border border-current"
              style={{ backgroundColor: 'transparent', color: priorityColor.text }}
            >
              {priorityColor.label}
            </span>
          </div>

          {/* Activity Metadata */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDueDate()}</span>
              {task.duration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono text-slate-300">{task.duration}</span>
                </>
              )}
            </div>

            {task.mood && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <Smile className="w-3.5 h-3.5" />
                <span>Mood:</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${i < task.mood ? 'bg-brand-primary' : 'bg-slate-900'}`} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
            {!isDone && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-1 text-[11px] font-black text-brand-success hover:bg-brand-success/10 px-2 py-1.5 rounded transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                DONE
              </button>
            )}
            <button
              onClick={() => setShowMoveMenu(true)}
              className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Move section"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-7 h-7 rounded text-brand-danger/70 hover:bg-brand-danger/10 hover:text-brand-danger transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDetails}
              className="flex items-center gap-1 text-[11px] font-black text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded transition-colors ml-auto border border-slate-800"
            >
              <Info className="w-3.5 h-3.5" />
              DETAILS
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
