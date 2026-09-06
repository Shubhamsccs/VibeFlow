import { useRef, useMemo } from "react";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  CheckCircle,
  Clock,
  Zap,
  Smile,
  AlertCircle,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import SpotlightCard from "../components/ui/SpotlightCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TABS = [
  { id: "tasks", label: "Task Volume", icon: CheckCircle, color: "#10b981" },
  { id: "energy", label: "Cognitive Load", icon: Zap, color: "#6366f1" },
  { id: "streaks", label: "Streaks & Shields", icon: Flame, color: "#f59e0b" },
  { id: "duration", label: "Focus Duration", icon: Clock, color: "#06b6d4" },
  { id: "mood", label: "Mindset & Mood", icon: Smile, color: "#8b5cf6" },
  { id: "priority", label: "Priority Matrix", icon: AlertCircle, color: "#f43f5e" },
];

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      grid: { color: "rgba(255, 255, 255, 0.05)" },
      ticks: { color: "#94a3b8", font: { size: 10 } },
    },
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8", font: { size: 10 } },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#94a3b8",
        padding: 14,
        usePointStyle: true,
        pointStyleWidth: 8,
        font: { size: 11, weight: 600 },
      },
    },
  },
};

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "tasks";
  const sectionRef = useRef(null);
  const tasks = useTaskStore((state) => state.tasks);

  const handleTabChange = (id) => {
    setSearchParams({ tab: id });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Productivity Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep performance insights, cognitive load metrics, and flow history.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-white/[0.08]">
          Real-time Local Analytics
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-white/[0.08] rounded-2xl overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={isActive ? { color: tab.color } : {}} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div ref={sectionRef}>
        {activeTab === "tasks" && <TasksAnalytics tasks={tasks} />}
        {activeTab === "energy" && <EnergyAnalytics tasks={tasks} />}
        {activeTab === "streaks" && <StreaksAnalytics tasks={tasks} />}
        {activeTab === "duration" && <DurationAnalytics tasks={tasks} />}
        {activeTab === "mood" && <MoodAnalytics tasks={tasks} />}
        {activeTab === "priority" && <PriorityAnalytics tasks={tasks} />}
      </div>
    </div>
  );
}

function MiniStat({ label, value, subtext }) {
  return (
    <SpotlightCard className="p-4">
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-black text-white font-heading">{value}</div>
      {subtext && <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>}
    </SpotlightCard>
  );
}

/* 1. Tasks Analytics */
function TasksAnalytics({ tasks }) {
  const columns = useTaskStore((state) => state.columns);
  const completed = tasks.filter((t) => t.status === "done").length;

  const columnDistribution = useMemo(() => {
    const counts = {};
    const labels = [];
    const colors = [];

    columns.forEach((col) => {
      counts[col.title] = tasks.filter((t) => t.status === col.id).length;
      labels.push(col.title);
      colors.push(col.accent || "#6366f1");
    });

    counts["Done"] = completed;
    labels.push("Done");
    colors.push("#10b981");

    return {
      labels,
      datasets: [
        {
          data: labels.map((l) => counts[l] || 0),
          backgroundColor: colors,
          borderRadius: 8,
          borderWidth: 0,
        },
      ],
    };
  }, [tasks, columns, completed]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Tasks" value={tasks.length} />
        <MiniStat label="Completed" value={completed} />
        <MiniStat
          label="Completion Rate"
          value={tasks.length ? `${Math.round((completed / tasks.length) * 100)}%` : "0%"}
        />
        <MiniStat label="Active Work" value={tasks.length - completed} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 h-96 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Task Volume by Workspace Column</h3>
          <div className="flex-1 min-h-0">
            <Bar data={columnDistribution} options={baseChartOptions} />
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 h-96 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Ratio Breakdown</h3>
          <div className="flex-1 min-h-0">
            <Doughnut data={columnDistribution} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* 2. Cognitive Load & Burnout Analytics */
function EnergyAnalytics({ tasks }) {
  const user = useTaskStore((state) => state.user);
  const pendingTasks = tasks.filter((t) => t.status !== "done");

  const energyBreakdown = useMemo(() => {
    let deep = 0,
      standard = 0,
      light = 0;
    pendingTasks.forEach((t) => {
      const lvl = t.energyLevel || "standard";
      if (lvl === "deep") deep++;
      else if (lvl === "light") light++;
      else standard++;
    });

    return {
      deep,
      standard,
      light,
      chartData: {
        labels: ["Deep Focus", "Standard", "Quick Win"],
        datasets: [
          {
            data: [deep, standard, light],
            backgroundColor: ["#6366f1", "#06b6d4", "#f59e0b"],
            borderWidth: 0,
          },
        ],
      },
    };
  }, [pendingTasks]);

  const targetHours = ((user.dailyFocusTargetMinutes || 240) / 60).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Deep Work Tasks" value={energyBreakdown.deep} subtext="High brainpower" />
        <MiniStat label="Standard Effort" value={energyBreakdown.standard} subtext="Balanced cognition" />
        <MiniStat label="Quick Wins" value={energyBreakdown.light} subtext="Low friction tasks" />
        <MiniStat label="Focus Target" value={`${targetHours}h`} subtext="Daily capacity ceiling" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-primary" /> Cognitive Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Healthy productivity balances high-friction deep work with quick restorative wins.
            </p>
          </div>
          <div className="h-64">
            <Doughnut data={energyBreakdown.chartData} options={doughnutOptions} />
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Burnout Prevention Analysis
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              When deep work exceeds 4-5 hours daily, cognitive exhaustion sets in and leads to quiet abandonment. VibeFlow monitors your planned mental load in real-time.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Daily Deep Work Health Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Optimal Zone
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your backlog contains {energyBreakdown.deep} Deep Focus tasks. Pace yourself by scheduling no more than 2-3 deep work blocks per day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 3. Streaks & Shields Analytics */
function StreaksAnalytics() {
  const { streakCount, streakShields, restDays, streakRecoveryQuest } = useTaskStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Current Streak" value={`${streakCount} Days`} />
        <MiniStat label="Available Shields" value={streakShields} subtext="Auto-freezes on missed day" />
        <MiniStat label="Scheduled Rest Days" value={restDays.length} subtext="Zero penalty downtime" />
        <MiniStat
          label="Momentum Status"
          value={streakCount > 7 ? "Flow Master" : streakCount > 2 ? "Consistent" : "Building"}
        />
      </div>

      <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center min-h-[320px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <Flame className="w-8 h-8 fill-current" />
        </div>
        <h3 className="text-2xl font-black text-white">
          {streakCount > 0 ? `${streakCount} Day Momentum!` : "Start Your Streak Today"}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
          You have <strong className="text-emerald-400 font-bold">{streakShields} active Streak Shield{streakShields === 1 ? "" : "s"}</strong>.
          Every 12 completed focus tasks earn an additional shield to protect your progress when unexpected life events occur.
        </p>

        {streakRecoveryQuest?.active && (
          <div className="mt-6 p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 max-w-md text-left">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Active Comeback Quest!
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Complete {streakRecoveryQuest.targetTasks} priority tasks today to restore your broken streak without fees!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* 4. Duration Analytics */
function DurationAnalytics() {
  const focusHistory = useTaskStore((state) => state.focusHistory || []);

  const totalMinutes = useMemo(() => {
    return focusHistory.reduce((acc, s) => acc + (s.minutes || 0), 0);
  }, [focusHistory]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const dailyMinutes = last7Days.map((date) => {
    const dayStr = date.toLocaleDateString("en-CA");
    return focusHistory.filter((s) => s.date === dayStr).reduce((acc, s) => acc + (s.minutes || 0), 0);
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat
          label="Total Focus Logged"
          value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
        />
        <MiniStat label="Sessions Logged" value={focusHistory.length} />
        <MiniStat
          label="Avg Session Length"
          value={focusHistory.length ? `${Math.round(totalMinutes / focusHistory.length)}m` : "45m"}
        />
        <MiniStat
          label="Weekly Active Days"
          value={new Set(focusHistory.map((s) => s.date)).size}
        />
      </div>

      <div className="glass-panel rounded-3xl p-6 h-96 flex flex-col">
        <h3 className="text-sm font-bold text-white mb-4">Focus Time (Minutes / Last 7 Days)</h3>
        <div className="flex-1 min-h-0">
          <Bar
            data={{
              labels: last7Days.map((d) => format(d, "EEE")),
              datasets: [
                {
                  label: "Minutes",
                  data: dailyMinutes,
                  backgroundColor: "#06b6d4",
                  borderRadius: 8,
                },
              ],
            }}
            options={baseChartOptions}
          />
        </div>
      </div>
    </div>
  );
}

/* 5. Mood Analytics */
function MoodAnalytics() {
  const focusHistory = useTaskStore((state) => state.focusHistory || []);
  const moodSessions = focusHistory.filter((s) => s.mood);

  const avgMood = moodSessions.length
    ? (moodSessions.reduce((acc, s) => acc + s.mood, 0) / moodSessions.length).toFixed(1)
    : "4.5";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Average Mood" value={`${avgMood} / 5`} subtext="Post-focus rating" />
        <MiniStat label="Rated Sessions" value={moodSessions.length} />
        <MiniStat label="Mindset Status" value={Number(avgMood) >= 4 ? "Energized" : "Neutral"} />
        <MiniStat label="Fulfillment Score" value={`${Math.round((Number(avgMood) / 5) * 100)}%`} />
      </div>

      <div className="glass-panel rounded-3xl p-8 text-center min-h-[280px] flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
          <Smile className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-white">Mindset & Satisfaction</h3>
        <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
          Tracking post-session mood builds self-awareness. When deep work is paired with proper breaks and manageable tasks, satisfaction stays high.
        </p>
      </div>
    </div>
  );
}

/* 6. Priority Analytics */
function PriorityAnalytics({ tasks }) {
  const priorityData = useMemo(() => {
    let high = 0,
      medium = 0,
      low = 0;
    tasks.forEach((t) => {
      const p = t.priority || "medium";
      if (p === "high") high++;
      else if (p === "low") low++;
      else medium++;
    });

    return {
      labels: ["High Priority", "Medium Priority", "Low Priority"],
      datasets: [
        {
          data: [high, medium, low],
          backgroundColor: ["#f43f5e", "#f59e0b", "#10b981"],
          borderWidth: 0,
        },
      ],
    };
  }, [tasks]);

  return (
    <div className="glass-panel rounded-3xl p-6 h-96 flex flex-col">
      <h3 className="text-sm font-bold text-white mb-4">Priority Distribution</h3>
      <div className="flex-1 min-h-0">
        <Doughnut data={priorityData} options={doughnutOptions} />
      </div>
    </div>
  );
}
