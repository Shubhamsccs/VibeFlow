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
import { CheckCircle, Flame, Clock, TrendingUp, Smile, AlertCircle, Timer } from "lucide-react";
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
  { id: "focus", label: "Focus Timer", icon: Timer, color: "#ffd700" },
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
            Insights based on your tracked activities.
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
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

      <div ref={sectionRef} className="pb-10">
        {activeTab === "tasks" && <TasksAnalytics tasks={tasks} />}
        {activeTab === "streaks" && <StreaksAnalytics tasks={tasks} />}
        {activeTab === "duration" && <DurationAnalytics tasks={tasks} />}
        {activeTab === "focus" && <FocusAnalytics />}
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

    // Current Streak Calculation
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
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
  const rawFocusHistory = useTaskStore(state => state.focusHistory || []);

  // Filter out focusHistory entries for tasks that have been deleted
  const activeTaskIds = useMemo(() => new Set(tasks.map(t => t.id)), [tasks]);
  const focusHistory = useMemo(
    () => rawFocusHistory.filter(h => activeTaskIds.has(h.taskId)),
    [rawFocusHistory, activeTaskIds]
  );

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

  // Only count COMPLETED tasks for the planned total — matches what the daily chart shows
  const totalPlannedDuration = useMemo(() => {
    return tasks
      .filter(t => t.status === 'done')
      .reduce((acc, t) => acc + parseDuration(t.duration), 0);
  }, [tasks]);

  const totalActualDuration = useMemo(() => {
    return focusHistory.reduce((acc, s) => acc + s.minutes, 0);
  }, [focusHistory]);

  const plannedHours = Math.floor(totalPlannedDuration / 60);
  const plannedMins = totalPlannedDuration % 60;

  const actualHours = Math.floor(totalActualDuration / 60);
  const actualMins = totalActualDuration % 60;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const getPlannedMinsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    // Only count COMPLETED tasks for planned hours — active tasks haven't been "focused on" yet
    return tasks
      .filter(task => {
        if (task.status !== 'done') return false;
        // Use completedAt date if available, otherwise fall back to dueDate/createdAt
        const taskDateStr = task.completedAt?.split('T')[0] || task.dueDate || task.createdAt?.split('T')[0];
        return taskDateStr === dayStr;
      })
      .reduce((acc, t) => acc + parseDuration(t.duration), 0);
  };

  const getActualMinsForDay = (day) => {
    const dayStr = day.toLocaleDateString('en-CA');
    return focusHistory
      .filter(s => s.date === dayStr)
      .reduce((acc, s) => acc + s.minutes, 0);
  };

  const dailyPlannedHours = last7Days.map(date => getPlannedMinsForDay(date) / 60);
  const dailyActualHours = last7Days.map(date => getActualMinsForDay(date) / 60);

  // Focus Accuracy (Average for all completed tasks that had a planned duration)
  const focusAccuracy = useMemo(() => {
    const tasksWithDurations = tasks.filter(t => t.duration && (t.actualDurationMinutes || t.status === 'done'));
    if (tasksWithDurations.length === 0) return 0;
    const accuracies = tasksWithDurations.map(t => {
      const planned = parseDuration(t.duration);
      if (planned === 0) return 100;
      const actual = t.actualDurationMinutes || 0;
      return Math.min(100, Math.round((actual / planned) * 100));
    });
    return Math.round(accuracies.reduce((acc, a) => acc + a, 0) / accuracies.length);
  }, [tasks]);

  // Focus Quality (Timeline Badges)
  const focusQualityCounts = useMemo(() => {
    let hyper = 0, onTrack = 0, efficient = 0, under = 0;
    tasks.forEach(t => {
      const planned = parseDuration(t.duration);
      if (planned > 0) {
        const actual = t.actualDurationMinutes || 0;
        const ratio = actual / planned;
        if (ratio >= 1.1) {
          hyper++;
        } else if (ratio >= 0.9) {
          onTrack++;
        } else {
          if (t.status === 'done') {
            efficient++;
          } else {
            under++;
          }
        }
      }
    });
    return { hyper, onTrack, efficient, under };
  }, [tasks]);

  const focusQualityData = {
    labels: ['Hyper-focused', 'On Track', 'Efficient', 'Under-focused'],
    datasets: [
      {
        data: [focusQualityCounts.hyper, focusQualityCounts.onTrack, focusQualityCounts.efficient, focusQualityCounts.under],
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
        borderWidth: 0,
      }
    ]
  };

  // Mood Correlation
  const moodCorrelation = useMemo(() => {
    const tasksWithMood = tasks.filter(t => t.mood && t.duration);
    if (tasksWithMood.length === 0) return null;

    const highAccuracyTasks = [];
    const lowAccuracyTasks = [];

    tasksWithMood.forEach(t => {
      const planned = parseDuration(t.duration);
      if (planned === 0) return;
      const actual = t.actualDurationMinutes || 0;
      const ratio = actual / planned;
      if (ratio >= 0.9) {
        highAccuracyTasks.push(t.mood);
      } else {
        lowAccuracyTasks.push(t.mood);
      }
    });

    const avg = (arr) => arr.length ? (arr.reduce((acc, m) => acc + m, 0) / arr.length).toFixed(1) : null;

    return {
      highAccAvg: avg(highAccuracyTasks),
      lowAccAvg: avg(lowAccuracyTasks),
      hasData: highAccuracyTasks.length > 0 || lowAccuracyTasks.length > 0
    };
  }, [tasks]);

  const customChartOptions = {
    ...baseChartOptions,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#94a3b8",
          boxWidth: 10,
          font: { size: 10, weight: "bold" },
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Planned Time" value={`${plannedHours}h ${plannedMins}m`} />
        <MiniStat label="Actual Focused" value={`${actualHours}h ${actualMins}m`} />
        <MiniStat label="Focus Accuracy" value={`${focusAccuracy}%`} />
        <MiniStat 
          label="Active Days" 
          value={new Set([...tasks.map(t => t.dueDate || t.createdAt?.split('T')[0]), ...focusHistory.map(h => h.date)]).size} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 h-96">
          <h2 className="text-lg font-bold mb-4">Planned vs. Actual Focus (Last 7 Days)</h2>
          {tasks.length > 0 || focusHistory.length > 0 ? (
            <Bar 
              data={{
                labels: last7Days.map(d => format(d, 'EEE')),
                datasets: [
                  {
                    label: "Planned Hours",
                    data: dailyPlannedHours,
                    backgroundColor: "#3b82f6", // Slate blue
                    borderRadius: 6
                  },
                  {
                    label: "Actual Focus Hours",
                    data: dailyActualHours,
                    backgroundColor: "#10b981", // Emerald green
                    borderRadius: 6
                  }
                ]
              }}
              options={customChartOptions}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Clock className="w-10 h-10 mb-2 opacity-20" />
              <p>Start tracking to see your daily trends.</p>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6 h-96 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Focus Quality</h2>
          <div className="flex-1 min-h-0 relative">
            {tasks.some(t => parseDuration(t.duration) > 0) ? (
              <Doughnut data={focusQualityData} options={doughnutOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-650 absolute inset-0 text-center">
                <Clock className="w-10 h-10 mb-2 opacity-20 text-brand-primary" />
                <p className="text-sm">No tasks with planned durations</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vibe Correlation Card */}
      <div className="glass-panel rounded-xl p-6 border-slate-800 bg-slate-950/20">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Smile className="w-5 h-5 text-amber-500" /> Focus-Mood Correlation
        </h3>
        {moodCorrelation && moodCorrelation.hasData ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              {moodCorrelation.highAccAvg && moodCorrelation.lowAccAvg ? (
                <>
                  When you stay on schedule (Focus Accuracy &ge; 90%), your average mood is{" "}
                  <span className="text-emerald-400 font-bold">{moodCorrelation.highAccAvg}/5</span>, compared to{" "}
                  <span className="text-amber-400 font-bold">{moodCorrelation.lowAccAvg}/5</span> when you focus less.
                  Staying close to your planned schedule keeps your vibes high!
                </>
              ) : moodCorrelation.highAccAvg ? (
                <>
                  You consistently stay on schedule! Your average mood when meeting your focus targets is{" "}
                  <span className="text-emerald-400 font-bold">{moodCorrelation.highAccAvg}/5</span>. Keep up the high focus!
                </>
              ) : (
                <>
                  When you focus less than your planned schedule, your average mood is{" "}
                  <span className="text-amber-400 font-bold">{moodCorrelation.lowAccAvg}/5</span>. Try to align your actual focus with planned schedules to improve satisfaction.
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Log focus sessions and complete mood checks to see insights on how schedule adherence relates to your vibe.
          </p>
        )}
      </div>
    </div>
  );
}

function FocusAnalytics() {
  const rawFocusHistory = useTaskStore(state => state.focusHistory || []);
  const tasks = useTaskStore(state => state.tasks || []);
  const streakShields = useTaskStore(state => state.streakShields || 0);

  // Filter out focusHistory entries for tasks that have been deleted
  const activeTaskIds = useMemo(() => new Set(tasks.map(t => t.id)), [tasks]);
  const focusHistory = useMemo(
    () => rawFocusHistory.filter(h => activeTaskIds.has(h.taskId)),
    [rawFocusHistory, activeTaskIds]
  );

  const totalMins = focusHistory.reduce((acc, s) => acc + s.minutes, 0);
  const avgMins = focusHistory.length ? Math.round(totalMins / focusHistory.length) : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const getFocusMinsForDay = (day) => {
    const dayStr = day.toLocaleDateString('en-CA');
    return focusHistory
      .filter(s => s.date === dayStr)
      .reduce((acc, s) => acc + s.minutes, 0);
  };

  const dailyFocusData = last7Days.map(date => getFocusMinsForDay(date));

  const categoryFocusCounts = useMemo(() => {
    const counts = {};
    const categories = {
      'college': 'College Work',
      'myspace': 'MySpace',
      'dsa-java': 'DSA Java',
      'web-dev': 'Web Dev',
      'dsa-practice': 'DSA Practice',
    };
    focusHistory.forEach(s => {
      const label = categories[s.category] || 'Other';
      counts[label] = (counts[label] || 0) + s.minutes;
    });
    return counts;
  }, [focusHistory]);

  const CATEGORY_COLORS = {
    'college': '#0000ff',
    'myspace': '#25d366',
    'dsa-java': '#ffffff',
    'web-dev': '#ff0000',
    'dsa-practice': '#ffd700',
  };

  const chartLabels = Object.keys(categoryFocusCounts);
  const chartColors = chartLabels.map(label => {
    const categories = {
      'college': 'College Work',
      'myspace': 'MySpace',
      'dsa-java': 'DSA Java',
      'web-dev': 'Web Dev',
      'dsa-practice': 'DSA Practice',
    };
    const id = Object.keys(categories).find(key => categories[key] === label);
    return CATEGORY_COLORS[id] || '#64748b';
  });

  const categoryFocusData = {
    labels: chartLabels,
    datasets: [
      {
        data: Object.values(categoryFocusCounts),
        backgroundColor: chartColors,
        borderWidth: 0,
      },
    ],
  };

  // Focus Tracking Method
  const focusMethodCounts = useMemo(() => {
    let timerCount = 0;
    let manualCount = 0;
    focusHistory.forEach(s => {
      if (s.isManual === false) {
        timerCount++;
      } else {
        manualCount++;
      }
    });
    return { timerCount, manualCount };
  }, [focusHistory]);

  const focusMethodData = {
    labels: ['Timer Focused', 'Manually Logged'],
    datasets: [
      {
        data: [focusMethodCounts.timerCount, focusMethodCounts.manualCount],
        backgroundColor: ['#ffd700', '#64748b'], // Yellow for timer, Slate gray for manual
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Focus Time" value={`${Math.floor(totalMins / 60)}h ${totalMins % 60}m`} />
        <MiniStat label="Sessions Completed" value={focusHistory.length} />
        <MiniStat label="Avg Session Length" value={`${avgMins}m`} />
        <MiniStat label="Streak Shields Available" value={streakShields} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 h-96 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Focus Time (Last 7 Days)</h2>
          <div className="flex-1 min-h-0">
            {focusHistory.length > 0 ? (
              <Bar 
                data={{
                  labels: last7Days.map(d => format(d, 'EEE')),
                  datasets: [{
                    label: "Minutes Focused",
                    data: dailyFocusData,
                    backgroundColor: "#f59e0b",
                    borderRadius: 6
                  }]
                }}
                options={baseChartOptions}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                <Timer className="w-10 h-10 mb-2 opacity-20 text-amber-500" />
                <p className="text-sm">No focus logs yet. Start focus sessions on your Dashboard!</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 h-96 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Focus By Section</h2>
          <div className="flex-1 min-h-0 relative">
            {focusHistory.length > 0 ? (
               <Doughnut data={categoryFocusData} options={doughnutOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-650 absolute inset-0 text-center">
                <Timer className="w-10 h-10 mb-2 opacity-20 text-amber-500" />
                <p className="text-sm">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="glass-panel rounded-xl p-6 h-80 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Focus Method</h2>
          <div className="flex-1 min-h-0 relative">
            {focusHistory.length > 0 ? (
               <Doughnut data={focusMethodData} options={doughnutOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-650 absolute inset-0 text-center">
                <Timer className="w-10 h-10 mb-2 opacity-20 text-amber-500" />
                <p className="text-sm">No data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border-slate-800 bg-slate-950/20 flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-500" /> Focus Method Insights
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {focusMethodCounts.timerCount === 0 && focusMethodCounts.manualCount > 0 ? (
              <>
                All of your focus history has been logged via <strong>Manual Completion</strong>. 
                Using the <strong>Focus Timer</strong> on your Dashboard for future sessions will help you track real-time focus sessions, capture hyper-focused flow states, and generate more precise productivity metrics!
              </>
            ) : focusMethodCounts.timerCount > 0 ? (
              <>
                You've logged <strong>{focusMethodCounts.timerCount}</strong> sessions using the Focus Timer and <strong>{focusMethodCounts.manualCount}</strong> sessions manually. 
                Keep using the Focus Timer to build strong focus habits and gather high-fidelity data on your flow states!
              </>
            ) : (
              <>
                Start completing tasks or running focus sessions to analyze your preferred tracking methods.
              </>
            )}
          </p>
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

  const moodBySection = useMemo(() => {
    const categories = {
      'college': 'College Work',
      'myspace': 'MySpace',
      'dsa-java': 'DSA Java',
      'web-dev': 'Web Dev',
      'dsa-practice': 'DSA Practice',
    };
    const totals = {};
    const counts = {};
    
    tasks.forEach(t => {
      if (t.mood) {
        const cat = t.category || t.status || 'college';
        const label = categories[cat] || 'Other';
        totals[label] = (totals[label] || 0) + t.mood;
        counts[label] = (counts[label] || 0) + 1;
      }
    });

    const labels = Object.keys(counts);
    const avgs = labels.map(label => parseFloat((totals[label] / counts[label]).toFixed(2)));
    
    return { labels, avgs };
  }, [tasks]);

  const moodBySectionData = {
    labels: moodBySection.labels,
    datasets: [
      {
        label: 'Avg Mood',
        data: moodBySection.avgs,
        backgroundColor: moodBySection.labels.map(label => {
          const categories = {
            'College Work': '#0000ff',
            'MySpace': '#25d366',
            'DSA Java': '#ffffff',
            'Web Dev': '#ff0000',
            'DSA Practice': '#ffd700',
          };
          return categories[label] || '#64748b';
        }),
        borderRadius: 4
      }
    ]
  };

  const horizontalBarOptions = {
    ...baseChartOptions,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { display: false },
        ticks: { color: "#94a3b8" }
      },
      x: {
        min: 1,
        max: 5,
        grid: { color: "rgba(51, 65, 85, 0.5)" },
        ticks: { stepSize: 1, color: "#94a3b8" }
      }
    }
  };

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

        <div className="glass-panel rounded-xl p-6 h-80 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Mood by Section</h2>
          {moodBySection.labels.length > 0 ? (
            <div className="flex-1 min-h-0 relative">
              <Bar data={moodBySectionData} options={horizontalBarOptions} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-center">
              <Smile className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">Log mood values in your tasks to see this chart.</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-8 bg-brand-primary/5 flex flex-col items-center justify-center text-center">
        <Smile className="w-12 h-12 text-brand-primary mb-4" />
        <h3 className="text-xl font-bold">Vibe Insights</h3>
        {completedTasks.length > 0 ? (
          <p className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed text-center">
            Your average mood is **{avgMood}**. Keep tracking your tasks to see which activities align with your highest energy states!
            {moodBySection.labels.length > 0 && (
              <>
                {" "}Specifically, check your <strong>Mood by Section</strong> chart to see which category keeps you most inspired.
              </>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-500 mt-2">
            Add your first activity to start analyzing your productivity mindset.
          </p>
        )}
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

  const totalHigh = tasks.filter(t => t.priority === 'high').length;
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
              <div className="flex flex-col items-center justify-center h-full text-slate-650 absolute inset-0 text-center">
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
              <div className="flex flex-col items-center justify-center h-full text-slate-650 absolute inset-0 text-center">
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
