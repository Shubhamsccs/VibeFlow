import { useMemo } from "react";
import { X, Calendar, ArrowRight, SunMedium, Archive } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

export default function FreshStartModal() {
  const { isFreshStartModalOpen, closeFreshStartModal, tasks, rescheduleOverdueTasks } = useTaskStore();

  const todayStr = new Date().toLocaleDateString("en-CA");
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA");

  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < todayStr);
  }, [tasks, todayStr]);

  if (!isFreshStartModalOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg glass-panel border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={closeFreshStartModal}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Anti-Guilt Fresh Start
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Clear psychological debt. Real life happens.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          You have <strong className="text-white font-bold">{overdueTasks.length}</strong> tasks with past dates. Rather than piling up stressful red warnings, choose how to reset your plate in 1 click:
        </p>

        {/* Task Preview */}
        <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 bg-slate-950/80 rounded-2xl border border-white/[0.06] mb-6">
          {overdueTasks.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-3">No overdue tasks! You are all caught up.</div>
          ) : (
            overdueTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs text-slate-300 py-1 border-b border-white/[0.03] last:border-0">
                <span className="truncate max-w-[280px]">{t.title}</span>
                <span className="text-[10px] text-amber-400/80 font-mono shrink-0">{t.dueDate}</span>
              </div>
            ))
          )}
        </div>

        {/* 1-Click Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => rescheduleOverdueTasks(todayStr)}
            disabled={overdueTasks.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs flex items-center justify-between transition-all cursor-pointer disabled:opacity-40"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Reschedule All to Today
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => rescheduleOverdueTasks(tomorrowStr)}
            disabled={overdueTasks.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-white/[0.08] flex items-center justify-between transition-all cursor-pointer disabled:opacity-40"
          >
            <span className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-amber-400" /> Push All to Tomorrow
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => rescheduleOverdueTasks("backlog")}
            disabled={overdueTasks.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-semibold text-xs border border-white/[0.06] flex items-center justify-between transition-all cursor-pointer disabled:opacity-40"
          >
            <span className="flex items-center gap-2">
              <Archive className="w-4 h-4" /> Park in Backlog (Remove due dates)
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
