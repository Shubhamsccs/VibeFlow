import { useState, useEffect, useRef, useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
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
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { CheckCircle, Flame, Clock, TrendingUp, Smile, AlertCircle } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

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
  { id: "tasks", label: "Tasks", icon: CheckCircle, color: "#25d366" },
  { id: "streaks", label: "Streaks", icon: Flame, color: "#ff8c00" },
  { id: "duration", label: "Activity Time", icon: Clock, color: "#0000ff" },
  { id: "mood", label: "Mood Analysis", icon: Smile, color: "#ff0000" },
  { id: "priority", label: "Priority Analysis", icon: AlertCircle, color: "#ff00ff" },
];

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      grid: { color: "rgba(51, 65, 85, 0.5)" },
      ticks: { color: "#94a3b8" },
    },
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8" },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: "#94a3b8", padding: 16, usePointStyle: true, pointStyleWidth: 10 },
    },
  },
};

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "tasks";
  const [activeTab, setActiveTab] = useState(initialTab);
  const sectionRef = useRef(null);
  const tasks = useTaskStore(state => state.tasks);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [searchParams]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-slate-400">
            Insights based on your {tasks.length} tracked activities.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          Last updated: Today
        </div>
      </div>

      <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-xl overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-slate-800 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <tab.icon className="w-4 h-4" style={isActive ? { color: tab.color } : {}} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div ref={sectionRef}>
        {activeTab === "tasks" && <TasksAnalytics tasks={tasks} />}
        {activeTab === "streaks" && <StreaksAnalytics tasks={tasks} />}
        {activeTab === "duration" && <DurationAnalytics tasks={tasks} />}
        {activeTab === "mood" && <MoodAnalytics tasks={tasks} />}
        {activeTab === "priority" && <PriorityAnalytics tasks={tasks} />}
      </div>
    </div>
  );
}

function TasksAnalytics({ tasks }) {
  const categories = {
    'college': 'College Work',
    'myspace': 'MySpace',
    'dsa-java': 'DSA Java',
    'web-dev': 'Web Dev',
    'dsa-practice': 'DSA Practice',
    'done': 'Finished'
  };

  const catCounts = useMemo(() => {
    const counts = {};
    const completedTasks = tasks.filter(t => t.status === 'done');
    completedTasks.forEach(t => {
      const catId = t.category || 'college';
      const label = categories[catId] || 'Other';
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const CATEGORY_COLORS = {
    'college': '#0000ff', // Blue
    'myspace': '#25d366', // WhatsApp Green
    'dsa-java': '#ffffff', // White
    'web-dev': '#ff0000', // Red
    'dsa-practice': '#ffd700', // Yellow
    'done': '#25d366'     // Green
  };

  const chartLabels = Object.keys(catCounts);
  const chartColors = chartLabels.map(label => {
    const id = Object.keys(categories).find(key => categories[key] === label);
    return CATEGORY_COLORS[id] || '#64748b';
  });

  const categoryData = {
    labels: chartLabels,
    datasets: [
      {
        data: Object.values(catCounts),
        backgroundColor: chartColors,
        borderWidth: 0,
      },
    ],
  };

  const completed = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Activities" value={tasks.length} />
        <MiniStat label="Completed" value={completed} />
        <MiniStat label="Completion Rate" value={tasks.length ? `${Math.round((completed/tasks.length)*100)}%` : '0%'} />
        <MiniStat label="In Progress" value={tasks.length - completed} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 h-96 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Activity Distribution</h2>
          <div className="flex-1 min-h-0">
            <Bar
              data={{
                labels: Object.keys(catCounts),
                datasets: [{
                  label: 'Count',
                  data: Object.values(catCounts),
                  backgroundColor: chartColors,
                  borderRadius: 6
                }]
              }}
              options={baseChartOptions}
            />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 h-96 flex flex-col">
          <h2 className="text-lg font-bold mb-4">By Section</h2>
          <div className="flex-1 min-h-0">
            <Doughnut data={categoryData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StreaksAnalytics({ tasks }) {
  const completedTasks = tasks.filter(t => t.status === 'done');
  
  const streakStats = useMemo(() => {
    if (completedTasks.length === 0) return { current: 0, longest: 0, activeDays: 0 };

    // Get all unique active dates (YYYY-MM-DD)
    const activeDates = [...new Set(completedTasks.map(t => t.dueDate || t.createdAt?.split('T')[0]))]
      .sort((a, b) => new Date(b) - new Date(a)); // Sort descending (newest first)

    const activeDays = activeDates.length;
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // Current Streak Calculation
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // If the latest activity is today or yesterday, start counting the current streak
    if (activeDates[0] === today || activeDates[0] === yesterday) {
      current = 1;
      for (let i = 0; i < activeDates.length - 1; i++) {
        const currentDay = new Date(activeDates[i]);
        const nextDay = new Date(activeDates[i+1]);
        const diffDays = (currentDay - nextDay) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          current++;
        } else {
          break;
        }
      }
    }

    // Longest Streak Calculation
    let currentTemp = 1;
    for (let i = 0; i < activeDates.length - 1; i++) {
      const currentDay = new Date(activeDates[i]);
      const nextDay = new Date(activeDates[i+1]);
      const diffDays = (currentDay - nextDay) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        currentTemp++;
      } else {
        longest = Math.max(longest, currentTemp);
        currentTemp = 1;
      }
    }
    longest = Math.max(longest, currentTemp);

    return { current, longest, activeDays };
  }, [completedTasks]);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Current Streak" value={`${streakStats.current} Days`} />
        <MiniStat label="Longest Streak" value={`${streakStats.longest} Days`} />
        <MiniStat label="Active Days" value={streakStats.activeDays} />
        <MiniStat label="Consistency" value={streakStats.activeDays > 5 ? "High" : "Building"} />
      </div>

      <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] border border-slate-800">
        {streakStats.current > 0 ? (
          <>
            <Flame className="w-16 h-16 text-brand-warning mb-4" />
            <h3 className="text-2xl font-black text-white">You're on Fire!</h3>
            <p className="text-slate-400 text-center max-w-md mt-2">
              You've maintained a streak of <span className="text-white font-bold">{streakStats.current} days</span>. 
              Keep going to beat your record of {streakStats.longest} days!
            </p>
          </>
        ) : (
          <div className="text-center">
            <Flame className="w-12 h-12 text-slate-700 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-slate-500">Start Your Streak</h3>
            <p className="text-slate-600 text-sm mt-2">Finish a task today to start your consistency streak!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DurationAnalytics({ tasks }) {
  const parseDuration = (duration) => {
    if (!duration) return 0;
    if (duration.includes(':')) {
      const parts = duration.split(':').map(Number);
      if (parts.length === 3) return (parts[0] * 60) + parts[1]; // HH:MM:SS
      if (parts.length === 2) return (parts[0] * 60) + parts[1]; // HH:MM
    }
    const h = parseInt(duration.match(/(\d+)h/)?.[1] || 0);
    const m = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
    return (h * 60) + m;
  };

  const totalDuration = useMemo(() => {
    return tasks
      .filter(t => t.status === 'done')
      .reduce((acc, t) => acc + parseDuration(t.duration), 0);
  }, [tasks]);

  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;

  // Real data for weekly trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      // Use dueDate, then createdAt
      const taskDateStr = task.dueDate || task.createdAt?.split('T')[0];
      try {
        const taskDate = parseISO(taskDateStr);
        return isSameDay(taskDate, day);
      } catch {
        return false;
      }
    });
  };

  const dailyDuration = last7Days.map(date => {
    return getTasksForDay(date)
      .filter(t => t.status === 'done')
      .reduce((acc, t) => acc + parseDuration(t.duration), 0) / 60; // to hours
  });

  // NEW: Last 4 Weeks Calculation
  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (i * 7 + 6));
    const end = new Date();
    end.setDate(end.getDate() - (i * 7));
    return { start, end, label: i === 0 ? "This Week" : `Week -${i}` };
  }).reverse();

  const weeklyData = last4Weeks.map(week => {
    return tasks
      .filter(t => {
        if (t.status !== 'done') return false;
        const date = new Date(t.dueDate || t.createdAt);
        return date >= week.start && date <= week.end;
      })
      .reduce((acc, t) => acc + parseDuration(t.duration), 0) / 60;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Time Spent" value={`${hours}h ${mins}m`} />
        <MiniStat label="Avg per Activity" value={tasks.filter(t => t.status === 'done').length ? `${Math.round(totalDuration/tasks.filter(t => t.status === 'done').length)}m` : '0m'} />
        <MiniStat label="Active Days" value={new Set(tasks.filter(t => t.status === 'done').map(t => t.dueDate || t.createdAt?.split('T')[0])).size} />
        <MiniStat label="Goal Status" value="In Progress" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel rounded-xl p-6 h-96">
          <h2 className="text-lg font-bold mb-4">Daily Focus (Last 7 Days)</h2>
          {tasks.length > 0 ? (
            <Bar 
              data={{
                labels: last7Days.map(d => format(d, 'EEE')),
                datasets: [{
                  label: "Hours",
                  data: dailyDuration,
                  backgroundColor: "#25d366",
                  borderRadius: 6
                }]
              }}
              options={baseChartOptions}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Clock className="w-10 h-10 mb-2 opacity-20" />
              <p>Start tracking to see your daily trends.</p>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6 h-96">
          <h2 className="text-lg font-bold mb-4">Weekly Progress (Last 4 Weeks)</h2>
          <Bar 
            data={{
              labels: last4Weeks.map(w => w.label),
              datasets: [{
                label: "Focus Hours",
                data: weeklyData,
                backgroundColor: "#0000ff",
                borderRadius: 6
              }]
            }}
            options={baseChartOptions}
          />
        </div>
      </div>
    </div>
  );
}

function MoodAnalytics({ tasks }) {
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks]);

  const avgMood = useMemo(() => {
    const scored = completedTasks.filter(t => t.mood);
    if (!scored.length) return "0.0";
    return (scored.reduce((acc, t) => acc + t.mood, 0) / scored.length).toFixed(1);
  }, [completedTasks]);

  const moodCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    completedTasks.forEach(t => {
      if (t.mood) counts[t.mood - 1]++;
    });
    return counts;
  }, [completedTasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Avg Mood Score" value={`${avgMood}/5`} />
        <MiniStat label="Highest Mood" value={Math.max(...moodCounts) > 0 ? moodCounts.indexOf(Math.max(...moodCounts)) + 1 : 'N/A'} />
        <MiniStat label="Activities Logged" value={completedTasks.filter(t => t.mood).length} />
        <MiniStat label="Sentiment" value={parseFloat(avgMood) >= 4 ? "Great" : parseFloat(avgMood) >= 3 ? "Neutral" : completedTasks.length > 0 ? "Low" : "No Data"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 h-80">
          <h2 className="text-lg font-bold mb-4">Mood Distribution</h2>
          {completedTasks.filter(t => t.mood).length > 0 ? (
            <Bar 
              data={{
                labels: ["1 (Low)", "2", "3", "4", "5 (Great)"],
                datasets: [{
                  data: moodCounts,
                  backgroundColor: ["#ff0000", "#ff8c00", "#ffd700", "#0000ff", "#25d366"],
                  borderRadius: 4
                }]
              }}
              options={baseChartOptions}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Smile className="w-10 h-10 mb-2 opacity-20" />
              <p>Log your mood in activities to see insights.</p>
            </div>
          )}
        </div>
        <div className="glass-panel rounded-xl p-8 bg-brand-primary/5 flex flex-col items-center justify-center text-center">
          <Smile className="w-12 h-12 text-brand-primary mb-4" />
          <h3 className="text-xl font-bold">Mood Tracker</h3>
          {completedTasks.length > 0 ? (
            <p className="text-sm text-slate-400 mt-2">
              Your average mood is **{avgMood}**. Keep tracking to see how it relates to your activity categories!
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              Add your first activity to start analyzing your productivity mindset.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, danger = false }) {
  return (
    <div className="glass-panel rounded-xl p-4 text-center border-slate-800/50 hover:border-slate-700 transition-colors">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className={`text-2xl font-heading font-bold ${danger ? "text-brand-danger" : "text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}

function PriorityAnalytics({ tasks }) {
  const completedTasks = tasks.filter(t => t.status === 'done');
  
  const priorities = {
    high: completedTasks.filter(t => (t.priority || 'medium') === 'high').length,
    medium: completedTasks.filter(t => (t.priority || 'medium') === 'medium').length,
    low: completedTasks.filter(t => (t.priority || 'medium') === 'low').length,
  };

  const totalHigh = tasks.filter(t => (t.priority || 'medium') === 'high').length;
  const highCompletionRate = totalHigh > 0 ? Math.round((priorities.high / totalHigh) * 100) : 0;

  const PRIORITY_COLORS = {
    high: '#ff0000',   // Red
    medium: '#ffd700', // Yellow
    low: '#25d366'     // Green
  };

  const chartData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        data: [priorities.high, priorities.medium, priorities.low],
        backgroundColor: [PRIORITY_COLORS.high, PRIORITY_COLORS.medium, PRIORITY_COLORS.low],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="High Priority Done" value={priorities.high} danger={true} />
        <MiniStat label="High Priority Rate" value={`${highCompletionRate}%`} />
        <MiniStat label="Medium Priority Done" value={priorities.medium} />
        <MiniStat label="Low Priority Done" value={priorities.low} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 h-80 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Completed Priorities</h2>
          <div className="flex-1 min-h-0 relative">
            {completedTasks.length > 0 ? (
               <Doughnut data={chartData} options={doughnutOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 absolute inset-0">
                <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                <p>Complete tasks to see priority distribution.</p>
              </div>
            )}
          </div>
        </div>
        <div className="glass-panel rounded-xl p-6 h-80 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Priority Distribution</h2>
          <div className="flex-1 min-h-0 relative">
            {completedTasks.length > 0 ? (
               <Bar 
                 data={{
                   labels: ['High', 'Medium', 'Low'],
                   datasets: [{
                     label: 'Completed Tasks',
                     data: [priorities.high, priorities.medium, priorities.low],
                     backgroundColor: [PRIORITY_COLORS.high, PRIORITY_COLORS.medium, PRIORITY_COLORS.low],
                     borderRadius: 6
                   }]
                 }}
                 options={baseChartOptions}
               />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 absolute inset-0">
                <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                <p>Complete tasks to see priority distribution.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
