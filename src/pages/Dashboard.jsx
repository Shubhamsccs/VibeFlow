import { useNavigate } from "react-router-dom";
import { CheckCircle, Flame, Clock, Zap, Smile } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import { useMemo } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const tasks = useTaskStore((state) => state.tasks);

  const stats = useMemo(() => {
    const parseDuration = (duration) => {
      if (!duration) return 0;
      if (duration.includes(':')) {
        const parts = duration.split(':').map(Number);
        if (parts.length >= 2) return (parts[0] * 60) + parts[1];
      }
      const h = parseInt(duration.match(/(\d+)h/)?.[1] || 0);
      const m = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
      return (h * 60) + m;
    };

    // ONLY consider completed tasks for historical insights
    const completedTasks = tasks.filter((t) => t.status === "done");
    
    const totalDuration = completedTasks.reduce((acc, t) => acc + parseDuration(t.duration), 0);
    
    // 1. Completion Score (Full History)
    const completionScore = tasks.length === 0 ? 0 : (completedTasks.reduce((acc, t) => {
      const isLate = t.dueDate && t.completedAt && t.completedAt.split('T')[0] > t.dueDate;
      return acc + (isLate ? 0.5 : 1);
    }, 0) / tasks.length) * 100;

    // 2. Average Mood (Full History)
    const moodTasks = completedTasks.filter((t) => t.mood);
    const avgMood = moodTasks.length
      ? (moodTasks.reduce((acc, t) => acc + (t.mood || 0), 0) / moodTasks.length).toFixed(1)
      : "0.0";

    const moodScore = (parseFloat(avgMood) / 5) * 100;
    
    // Revised Productivity: 70% Completion consistency, 30% Mindset (Mood)
    const finalProductivity = Math.round(
      (completionScore * 0.7) + 
      (moodScore * 0.3)
    );

    return {
      completed: completedTasks.length,
      totalHours: Math.floor(totalDuration / 60),
      totalMins: totalDuration % 60,
      avgMood,
      productivity: finalProductivity,
    };
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Welcome <span className="text-brand-primary">Shubham!</span>
          </h1>
        </div>
        <p className="text-sm font-black text-slate-500 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 uppercase tracking-widest">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

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
          value={`${stats.totalHours}h ${stats.totalMins}m`}
          subtext="Total duration"
          color="primary"
          onClick={() => navigate("/timeline")}
        />
        <StatCard
          icon={Zap}
          label="Productivity"
          value={`${stats.productivity}%`}
          subtext="Mood & Completion Weighted"
          color="secondary"
          onClick={() => navigate("/analytics?tab=tasks")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-8 bg-slate-900/20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Activity Overview</h2>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-brand-primary" /> Focus
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-brand-success" /> Done
              </span>
            </div>
          </div>
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            <Zap className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm font-medium">
              Activity Chart Visualization
            </p>
            <button
              onClick={() => navigate("/analytics")}
              className="mt-4 text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline"
            >
              View Detailed Analytics
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 flex flex-col border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-lg font-bold">Upcoming Tasks</h2>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs font-bold text-brand-primary hover:text-white transition-colors uppercase tracking-widest"
            >
              Board
            </button>
          </div>

          <div className="space-y-4 flex-1">
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
                <Clock className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No upcoming tasks</p>
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
          <Zap className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${colorMap[color].split(' ')[0]}`} />
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
