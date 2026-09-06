import { useState } from "react";
import {
  Check,
  Trash2,
  Calendar,
  Clock,
  Zap,
  Coffee,
  Layers,
  Play,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { useTaskStore } from "../store/useTaskStore";

export default function TaskCard({ task, index, columnAccent }) {
  const { openTaskModal, updateTask, deleteTask, startFlow, columns } = useTaskStore();
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const priorityMeta = {
    high: { bg: "bg-rose-500/10 text-rose-400 border-rose-500/20", label: "HIGH" },
    medium: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "MEDIUM" },
    low: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "LOW" },
  }[task.priority || "medium"];

  const energyMeta = {
    deep: { icon: Zap, label: "Deep Focus", color: "text-brand-primary" },
    standard: { icon: Layers, label: "Standard", color: "text-brand-cyan" },
    light: { icon: Coffee, label: "Quick Win", color: "text-amber-400" },
  }[task.energyLevel || "standard"];

  const EnergyIcon = energyMeta.icon;

  const handleMove = (colId) => {
    updateTask(task.id, { status: colId });
    setShowMoveMenu(false);
  };

  const handleComplete = (e) => {
    e.stopPropagation();
    openTaskModal({ ...task, status: "done" });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  const handleStartFlow = (e) => {
    e.stopPropagation();
    const mins = task.duration ? parseInt(task.duration) || 25 : 25;
    startFlow(task, mins);
  };

  const formatDueDate = () => {
    if (!task.dueDate) return null;
    try {
      return new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  const isDone = task.status === "done";
  const dueDateStr = formatDueDate();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => openTaskModal(task)}
          className={`group relative rounded-2xl p-4 bg-slate-900/80 border transition-all duration-200 cursor-pointer ${
            snapshot.isDragging
              ? "border-brand-primary shadow-2xl scale-105 z-50 bg-slate-800"
              : "border-white/[0.07] hover:border-white/[0.18] hover:bg-slate-850 shadow-sm"
          }`}
        >
          {/* Subtle column accent pip */}
          <div
            className="absolute top-4 left-0 w-1 h-6 rounded-r-full"
            style={{ backgroundColor: columnAccent || "#6366f1" }}
          />

          <div className="flex items-start justify-between gap-2 mb-2 pl-2">
            <h4
              className={`text-xs font-bold leading-snug truncate ${
                isDone ? "line-through text-slate-500" : "text-slate-100 group-hover:text-white"
              }`}
            >
              {task.title}
            </h4>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isDone && (
                <button
                  onClick={handleStartFlow}
                  className="p-1 rounded-md bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white transition-colors cursor-pointer"
                  title="Launch Deep Flow Session"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              )}

              <button
                onClick={handleComplete}
                className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                title="Mark Done"
              >
                <Check className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveMenu(!showMoveMenu);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Move Column"
              >
                <ArrowRightLeft className="w-3 h-3" />
              </button>

              <button
                onClick={handleDelete}
                className="p-1 rounded-md bg-slate-800 hover:bg-rose-500 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Description snippet */}
          {task.description && (
            <p className="text-[11px] text-slate-400 line-clamp-2 pl-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Meta Badges */}
          <div className="flex items-center justify-between pl-2 pt-2 border-t border-white/[0.04] text-[10px]">
            <div className="flex items-center gap-1.5">
              {/* Priority badge */}
              <span className={`px-2 py-0.5 rounded-md border font-semibold ${priorityMeta.bg}`}>
                {priorityMeta.label}
              </span>

              {/* Energy badge */}
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-white/[0.04] font-medium ${energyMeta.color}`}>
                <EnergyIcon className="w-2.5 h-2.5" />
                <span>{energyMeta.label}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              {task.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {task.duration}
                </span>
              )}
              {dueDateStr && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  {dueDateStr}
                </span>
              )}
            </div>
          </div>

          {/* Column Move Menu Dropdown */}
          {showMoveMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-8 z-50 w-44 bg-slate-900 border border-white/[0.12] rounded-xl p-1.5 shadow-2xl animate-in fade-in duration-100"
            >
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                <span>Move to:</span>
                <button onClick={() => setShowMoveMenu(false)} className="text-slate-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-0.5 mt-1">
                {columns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleMove(c.id)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.accent }} />
                    <span className="truncate">{c.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
