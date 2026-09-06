import { useMemo, useState } from "react";
import { Search, History, Trash2, Calendar, Clock, Zap, Coffee, Layers, Smile } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import { format, parseISO } from "date-fns";

const FULL_HISTORY_ID = "__full_history__";

export default function Timeline() {
  const { tasks, columns, deleteTask } = useTaskStore();
  const [activeSection, setActiveSection] = useState(FULL_HISTORY_ID);
  const [searchQuery, setSearchQuery] = useState("");

  const isFullHistory = activeSection === FULL_HISTORY_ID;

  // Build section filter list from dynamic columns
  const sections = useMemo(() => {
    return [
      { id: FULL_HISTORY_ID, title: "All Completed", accent: "#6366f1" },
      ...columns.map((c) => ({
        id: c.id,
        title: c.title,
        accent: c.accent || "#6366f1",
      })),
    ];
  }, [columns]);

  // Filter completed tasks
  const completedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== "done") return false;
      if (!isFullHistory && t.category !== activeSection && t.status !== activeSection) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, isFullHistory, activeSection, searchQuery]);

  // Group by completion date
  const groupedTasks = useMemo(() => {
    const groups = {};
    completedTasks.forEach((task) => {
      const dateStr =
        task.completedAt?.split("T")[0] ||
        task.dueDate ||
        task.createdAt?.split("T")[0] ||
        new Date().toISOString().split("T")[0];

      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(task);
    });

    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        items: groups[date],
      }));
  }, [completedTasks]);

  const totalMinutes = useMemo(() => {
    return completedTasks.reduce((acc, t) => acc + (t.actualDurationMinutes || 45), 0);
  }, [completedTasks]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Execution Timeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological audit of completed focus blocks and activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs">
            <span className="text-slate-400">Total Logged: </span>
            <strong className="text-white font-bold">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            {completedTasks.length} Done
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {sections.map((sec) => {
            const isSel = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-slate-900 border border-white/[0.06] text-slate-400 hover:text-white"
                }`}
              >
                {sec.id !== FULL_HISTORY_ID && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.accent }} />
                )}
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter timeline..."
            className="w-full sm:w-56 bg-slate-900 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-6 pt-2">
        {groupedTasks.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-40" />
            <h4 className="text-sm font-bold text-slate-300">No completed items found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Mark tasks as done or complete focus sessions to build your timeline.
            </p>
          </div>
        ) : (
          groupedTasks.map((group) => {
            let formattedDate = group.date;
            try {
              formattedDate = format(parseISO(group.date), "EEEE, MMMM d, yyyy");
            } catch {
              // fallback
            }

            return (
              <div key={group.date} className="space-y-3">
                {/* Date Heading */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 sticky top-16 py-1 bg-slate-950/90 backdrop-blur-md z-10">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{formattedDate}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({group.items.length} {group.items.length === 1 ? "activity" : "activities"})
                  </span>
                </div>

                {/* Items Container */}
                <div className="space-y-2 border-l-2 border-white/[0.06] ml-2 pl-4">
                  {group.items.map((task) => {
                    const energyBadge = {
                      deep: { icon: Zap, label: "Deep", color: "text-brand-primary" },
                      standard: { icon: Layers, label: "Standard", color: "text-brand-cyan" },
                      light: { icon: Coffee, label: "Quick", color: "text-amber-400" },
                    }[task.energyLevel || "standard"];
                    const EnergyIcon = energyBadge.icon;

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/[0.06] hover:border-white/[0.14] transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white truncate">
                              {task.title}
                            </span>
                            <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${energyBadge.color}`}>
                              <EnergyIcon className="w-2.5 h-2.5" /> {energyBadge.label}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          {task.mood && (
                            <div className="flex items-center gap-1 text-amber-400 text-[11px]">
                              <Smile className="w-3 h-3" />
                              <span>{task.mood}/5</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{task.actualDuration || task.duration || "45m"}</span>
                          </div>

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
