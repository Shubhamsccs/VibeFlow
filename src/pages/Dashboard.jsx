import { useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Smile,
  StickyNote,
  Plus,
  Trash2,
  Shield,
  Zap,
  Play,
  SunMedium,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import SpotlightCard from "../components/ui/SpotlightCard";

const parseDurationToMinutes = (duration) => {
  if (!duration) return 45;
  if (typeof duration === "number") return duration;
  if (duration.includes(":")) {
    const parts = duration.split(":").map(Number);
    if (parts.length >= 2) return parts[0] * 60 + parts[1];
  }
  const h = parseInt(duration.match(/(\d+)h/)?.[1] || 0);
  const m = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
  if (h === 0 && m === 0 && !isNaN(parseInt(duration))) return parseInt(duration);
  return h * 60 + m;
};

export default function Dashboard() {
  const tasks = useTaskStore((state) => state.tasks);
  const {
    user,
    notes,
    activeNoteId,
    setActiveNoteId,
    addNote,
    updateNote,
    deleteNote,
    convertNoteToTask,
    streakShields,
    streakCount,
    compulsoryTasks,
    toggleCompulsoryTaskToday,
    addCompulsoryTask,
    focusHistory,
    startFlow,
    openFreshStartModal,
    openTaskModal,
  } = useTaskStore();

  const [newHabitTitle, setNewHabitTitle] = useState("");
  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];
  const todayStr = new Date().toLocaleDateString("en-CA");

  // Pending and overdue tasks
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks]);

  const overdueCount = useMemo(() => {
    return pendingTasks.filter((t) => t.dueDate && t.dueDate < todayStr).length;
  }, [pendingTasks, todayStr]);

  const upcomingTasks = useMemo(() => {
    return [...pendingTasks]
      .sort((a, b) => {
        // High priority first, then date
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (b.priority === "high" && a.priority !== "high") return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 5);
  }, [pendingTasks]);

  // Cognitive Energy Load calculation for today
  const cognitiveStats = useMemo(() => {
    const deepWorkTasks = pendingTasks.filter((t) => t.energyLevel === "deep");
    const deepWorkMinutes = deepWorkTasks.reduce((acc, t) => acc + parseDurationToMinutes(t.duration), 0);
    const targetMinutes = user.dailyFocusTargetMinutes || 240;
    const loadRatio = deepWorkMinutes / targetMinutes;
    const isBurnoutRisk = loadRatio > 1.25;

    return {
      deepWorkMinutes,
      deepWorkHours: (deepWorkMinutes / 60).toFixed(1),
      targetHours: (targetMinutes / 60).toFixed(1),
      loadRatio: Math.min(100, Math.round(loadRatio * 100)),
      isBurnoutRisk,
    };
  }, [pendingTasks, user.dailyFocusTargetMinutes]);

  // Productivity Metrics
  const stats = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.status === "done");
    const dailyFocusedMins = focusHistory
      .filter((s) => s.date === todayStr)
      .reduce((acc, s) => acc + (s.minutes || 0), 0);

    const completionScore =
      tasks.length === 0 ? 100 : Math.round((completedTasks.length / tasks.length) * 100);

    const todaySessions = focusHistory.filter((s) => s.date === todayStr && s.mood);
    const avgMood = todaySessions.length
      ? (todaySessions.reduce((acc, s) => acc + (s.mood || 0), 0) / todaySessions.length).toFixed(1)
      : "4.5";

    return {
      completed: completedTasks.length,
      dailyHours: Math.floor(dailyFocusedMins / 60),
      dailyMins: dailyFocusedMins % 60,
      avgMood,
      completionScore,
    };
  }, [tasks, todayStr, focusHistory]);

  const handleConvertNoteToTask = () => {
    if (!activeNote || !activeNote.content.trim()) return;
    const lines = activeNote.content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^[-*•]\s*/, "");
      convertNoteToTask(firstLine);
      // Remove first line from note
      const remaining = lines.slice(1).join("\n");
      updateNote(activeNote.id, remaining);
    }
  };

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    addCompulsoryTask(newHabitTitle.trim());
    setNewHabitTitle("");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-semibold">
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
            <span>•</span>
            <span className="capitalize">{user.role || "Personal Command"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome, <span className="text-brand-primary">{user.name || "Architect"}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {streakShields > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>{streakShields} Shield{streakShields === 1 ? "" : "s"}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{streakCount} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Anti-Guilt Fresh Start Banner (Appears only if overdue tasks exist) */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-linear-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <SunMedium className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Fresh Start Available ({overdueCount} overdue)
              </h4>
              <p className="text-[11px] text-slate-400">
                Life happens. Reschedule or park overdue items in 1 click without shame or red penalty badges.
              </p>
            </div>
          </div>
          <button
            onClick={openFreshStartModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 cursor-pointer shadow-md"
          >
            Launch Fresh Start
          </button>
        </div>
      )}

      {/* Bento Grid Row 1: Stat Spotlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.completed}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {tasks.length} total tasks tracked
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Focus Time</span>
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.dailyHours}h {stats.dailyMins}m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active focus logged today</div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Energy & Mood</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.avgMood}/5</div>
          <div className="text-[11px] text-slate-400 mt-1">Post-session mindset</div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Deep Capacity</span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{cognitiveStats.deepWorkHours}h / {cognitiveStats.targetHours}h</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {cognitiveStats.isBurnoutRisk ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> High Burnout Risk
              </span>
            ) : (
              <span>Optimal focus zone</span>
            )}
          </div>
        </SpotlightCard>
      </div>

      {/* Bento Grid Row 2: Priority Tasks & Mind Dump */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mind Dump (2 Columns on large screens) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col min-h-[420px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Mind Dump Scratchpad</h3>
                <p className="text-[11px] text-slate-400">Jot unfiltered thoughts. Convert lines to tasks with 1 click.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeNoteId === note.id
                      ? "bg-brand-primary text-white shadow-md"
                      : "bg-slate-900 border border-white/[0.06] text-slate-400 hover:text-white"
                  }`}
                >
                  {note.title}
                </button>
              ))}

              <button
                onClick={() => {
                  const title = prompt("New pad title:");
                  if (title) addNote(title);
                }}
                className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white cursor-pointer"
                title="Create new pad"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative">
            {activeNote ? (
              <>
                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateNote(activeNote.id, e.target.value)}
                  placeholder={`Write your unfiltered thoughts in "${activeNote.title}"...`}
                  className="flex-1 w-full bg-slate-950/80 border border-white/[0.06] rounded-2xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/40 transition-all resize-none text-xs leading-relaxed font-sans"
                />

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/[0.04]">
                  <button
                    onClick={handleConvertNoteToTask}
                    disabled={!activeNote.content.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-brand-primary/40 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3 text-brand-primary" />
                    <span>Convert First Line to Task</span>
                  </button>

                  {activeNote.id !== "general" && (
                    <button
                      onClick={() => {
                        if (confirm("Delete this pad?")) deleteNote(activeNote.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Delete Pad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Priority Focus Queue (1 Column) */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Focus Queue</h3>
              <p className="text-[11px] text-slate-400">Launch deep work instantly.</p>
            </div>
            <button
              onClick={() => openTaskModal()}
              className="p-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white cursor-pointer"
              title="Add task"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
            {upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <CheckCircle className="w-8 h-8 text-slate-600 mb-2 opacity-40" />
                <p className="text-xs text-slate-400 font-semibold">Queue is clear</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Create a task to kick off your flow.</p>
              </div>
            ) : (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] hover:border-white/[0.14] transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          t.priority === "high"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-slate-900 text-slate-400 border-white/[0.06]"
                        }`}
                      >
                        {t.priority}
                      </span>
                      {t.energyLevel === "deep" && (
                        <span className="text-[9px] text-brand-primary font-semibold flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> Deep
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white truncate">{t.title}</div>
                  </div>

                  <button
                    onClick={() => {
                      const mins = t.duration ? parseInt(t.duration) || 25 : 25;
                      startFlow(t, mins);
                    }}
                    className="p-2 rounded-xl bg-brand-primary/15 hover:bg-brand-primary text-brand-primary hover:text-white transition-colors cursor-pointer shrink-0 shadow-sm"
                    title="Launch Flow Session"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid Row 3: Daily Habits & Momentum */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Core Daily Habits</h3>
            <p className="text-[11px] text-slate-400">
              Daily micro-commitments that power your streak momentum.
            </p>
          </div>

          <form onSubmit={handleCreateHabit} className="flex gap-2">
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="+ Add daily habit..."
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              className="btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {compulsoryTasks.map((habit) => (
            <button
              key={habit.id}
              onClick={() => toggleCompulsoryTaskToday(habit.id)}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                habit.completedToday
                  ? "bg-emerald-500/10 border-emerald-500/30 text-white shadow-sm"
                  : "bg-slate-950/60 border-white/[0.06] text-slate-300 hover:border-white/[0.15]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                    habit.completedToday ? "bg-emerald-500 text-slate-950" : "border border-slate-700 bg-slate-900"
                  }`}
                >
                  {habit.completedToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={`text-xs font-semibold truncate ${habit.completedToday ? "line-through text-slate-400" : "text-slate-100"}`}>
                  {habit.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
