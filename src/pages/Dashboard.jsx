import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  CheckCircle, Clock, Trophy, Smile, StickyNote, Plus, Trash2, Shield
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

// Helper to parse duration string to minutes
const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;
  if (duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length >= 2) return (parts[0] * 60) + parts[1];
  }
  const h = parseInt(duration.match(/(\d+)h/)?.[1] || 0);
  const m = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
  if (h === 0 && m === 0 && !isNaN(parseInt(duration))) return parseInt(duration); // fallback
  return (h * 60) + m;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const tasks = useTaskStore((state) => state.tasks);
  const {
    notes, activeNoteId, setActiveNoteId, addNote, updateNote, deleteNote,
    streakShields, updateTask, focusHistory
  } = useTaskStore();

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Filter tasks
  const pendingTasks = useMemo(() => {
    return tasks.filter(t => t.status !== "done");
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return pendingTasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [pendingTasks]);

  // Compute stats
  const stats = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.status === "done");

    // Sum today's actual focused minutes from focusHistory (not planned duration)
    const dailyFocusedMins = focusHistory
      .filter(s => s.date === todayStr)
      .reduce((acc, s) => acc + (s.minutes || 0), 0);

    // 1. Completion Score (60% weight)
    const completionScore = tasks.length === 0 ? 100 : (completedTasks.reduce((acc, t) => {
      const isLate = t.dueDate && t.completedAt && t.completedAt.split('T')[0] > t.dueDate;
      return acc + (isLate ? 0.5 : 1);
    }, 0) / tasks.length) * 100;

    // 2. Mood Score (40% weight)
    const todaySessions = focusHistory.filter(s => s.date === todayStr && s.mood);
    const avgTodaySessionMood = todaySessions.length
      ? (todaySessions.reduce((acc, s) => acc + (s.mood || 0), 0) / todaySessions.length)
      : null;

    const completedTasksWithMood = tasks.filter(t => t.status === "done" && t.mood);
    const avgCompletedTaskMood = completedTasksWithMood.length
      ? (completedTasksWithMood.reduce((acc, t) => acc + (t.mood || 0), 0) / completedTasksWithMood.length)
      : null;

    const displayMood = avgTodaySessionMood !== null 
      ? avgTodaySessionMood.toFixed(1) 
      : (avgCompletedTaskMood !== null ? avgCompletedTaskMood.toFixed(1) : "0.0");

    const moodScore = displayMood !== "0.0" ? (parseFloat(displayMood) / 5) * 100 : 100;

    const finalProductivity = Math.round(
      (completionScore * 0.6) + 
      (moodScore * 0.4)
    );

    return {
      completed: completedTasks.length,
      dailyHours: Math.floor(dailyFocusedMins / 60),
      dailyMins: dailyFocusedMins % 60,
      avgMood: displayMood,
      productivity: finalProductivity,
    };
  }, [tasks, todayStr, focusHistory]);

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Welcome <span className="text-brand-primary">Shubham!</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {streakShields > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase text-emerald-400">
              <Shield className="w-3.5 h-3.5" /> {streakShields} Shield{streakShields > 1 ? "s" : ""}
            </div>
          )}
          <p className="text-xs font-black text-slate-400 bg-slate-900/40 px-4 py-2 rounded-full border border-slate-800 uppercase tracking-widest">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Tasks Completed"
          value={stats.completed}
          subtext={`Total activities: ${tasks.length}`}
          color="success"
          onClick={() => navigate("/analytics?tab=tasks")}
        />
        <StatCard
          icon={Smile}
          label="Avg Mood Score"
          value={`${stats.avgMood}/5`}
          subtext={tasks.length > 0 ? "Mindset Tracking" : "No Data"}
          color="warning"
          onClick={() => navigate("/analytics?tab=mood")}
        />
        <StatCard
          icon={Clock}
          label="Activity Time"
          value={`${stats.dailyHours}h ${stats.dailyMins}m`}
          subtext="Daily duration"
          color="primary"
          onClick={() => navigate("/timeline")}
        />
        <StatCard
          icon={Trophy}
          label="Productivity"
          value={`${stats.productivity}%`}
          subtext="Mood & Completion Weighted"
          color="success"
          onClick={() => navigate("/analytics?tab=tasks")}
        />
      </div>

      {/* Bottom Row (Mind Dump notes & Upcoming Tasks list) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 bg-slate-900/20 flex flex-col min-h-[400px] border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <StickyNote className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold">Mind Dump</h2>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {notes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                    activeNoteId === note.id 
                      ? "bg-brand-primary/20 border-brand-primary text-brand-primary" 
                      : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350"
                  }`}
                >
                  {note.title}
                </button>
              ))}
              <button
                onClick={() => {
                  const title = prompt("Pad Name:");
                  if (title) addNote(title);
                }}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="New Pad"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative flex flex-col">
            {activeNote ? (
              <>
                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateNote(activeNote.id, e.target.value)}
                  placeholder={`Write your thoughts in "${activeNote.title}"...`}
                  className="flex-1 w-full bg-slate-950/40 border border-slate-900 rounded-2xl p-5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/40 transition-all resize-none font-medium leading-relaxed text-sm custom-scrollbar"
                />
                {activeNote.id !== 'general' && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this pad?")) deleteNote(activeNote.id);
                    }}
                    className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-slate-950 text-slate-600 hover:text-brand-danger transition-all border border-slate-800 cursor-pointer"
                    title="Delete Pad"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <StickyNote className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">Select or create a pad to start writing.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming tasks card */}
        <div className="glass-panel rounded-xl p-6 flex flex-col border-slate-800 bg-slate-900/20 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Upcoming Tasks</h2>
            <button
              onClick={() => navigate("/tasks")}
              className="text-[10px] font-black text-brand-primary hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
            >
              View Board
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  title={task.title}
                  time={task.category || "General"}
                  priority={task.priority}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-600">
                <Clock className="w-6 h-6 mb-2 opacity-20" />
                <p className="text-xs">No upcoming tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  trendUp,
  color,
  onClick,
}) {
  const colorMap = {
    primary: "text-brand-primary bg-brand-primary/10",
    secondary: "text-brand-secondary bg-brand-secondary/10",
    success: "text-brand-success bg-brand-success/10",
    warning: "text-brand-warning bg-brand-warning/10",
  };

  return (
    <div
      onClick={onClick}
      className="glass-panel p-6 flex flex-col relative overflow-hidden group cursor-pointer border-slate-800 hover:border-brand-primary/50 transition-all duration-300 shadow-lg"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="flex justify-between items-start mb-6">
        <div
          className={`p-4 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          {trend && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendUp ? "bg-brand-success/20 text-brand-success" : "bg-brand-danger/20 text-brand-danger"}`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-3xl font-heading font-bold mb-1 text-white tracking-tight">
            {value}
          </h3>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          {subtext}
        </p>
      </div>

      <div
        className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity ${colorMap[color].split(" ")[0].replace("text-", "bg-")}`}
      ></div>
    </div>
  );
}

function TaskItem({ title, time, priority }) {
  const pColor = {
    high: "bg-brand-danger/20 text-brand-danger",
    medium: "bg-brand-warning/20 text-brand-warning",
    low: "bg-brand-success/20 text-brand-success",
  }[priority];

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 hover:bg-slate-900 transition-all cursor-pointer border border-slate-800/50 hover:border-slate-700 group">
      <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-brand-primary" />
        <div>
          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
            {title}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        </div>
      </div>
      <span
        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${pColor}`}
      >
        {priority}
      </span>
    </div>
  );
}
