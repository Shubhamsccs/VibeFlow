import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle, Flame, Clock, Trophy, Smile, Zap, StickyNote, Plus, Trash2,
  Play, Pause, Square, Circle, Check, PartyPopper, Shield, ArrowRight, X, AlertCircle
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import confetti from "canvas-confetti";

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
    streakShields, dailyFocusTasks, kickoffCompletedDate, windDownCompletedDate,
    focusSession, startFocus, pauseFocus, stopFocus, setDailyFocus,
    completeKickoff, completeWindDown, updateTask, completeFocusSession
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

  const todayFocusTasks = useMemo(() => {
    return tasks.filter(t => dailyFocusTasks.includes(t.id));
  }, [tasks, dailyFocusTasks]);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(null); // 'kickoff' | 'wind_down' | null
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [windDownMood, setWindDownMood] = useState(3);

  // Timer local setup
  const [timerTaskId, setTimerTaskId] = useState("");
  const [timerDuration, setTimerDuration] = useState(1500); // Default 25m
  const [timerMode, setTimerMode] = useState('timer'); // 'timer' | 'stopwatch'

  // Save Focus Session Modal states
  const [saveSessionModalOpen, setSaveSessionModalOpen] = useState(false);
  const [markTaskAsDone, setMarkTaskAsDone] = useState(false);
  const [suggestedMood, setSuggestedMood] = useState(4);
  const [sessionCompletedSeconds, setSessionCompletedSeconds] = useState(0);
  const [hasShownSaveModal, setHasShownSaveModal] = useState(false);

  // Set timer duration dynamically when a task is selected (only for timer mode)
  useEffect(() => {
    if (timerTaskId && timerMode === 'timer') {
      const selectedTask = tasks.find(t => t.id === timerTaskId);
      if (selectedTask) {
        const plannedMins = parseDurationToMinutes(selectedTask.duration) || 25;
        const actualMins = selectedTask.actualDurationMinutes || 0;
        const remainingMins = Math.max(1, plannedMins - actualMins);
        setTimerDuration(remainingMins * 60);
      }
    }
  }, [timerTaskId, tasks, timerMode]);

  // Compute stats
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

    const completedTasks = tasks.filter((t) => t.status === "done");
    
    const dailyDuration = completedTasks
      .filter((t) => {
        let taskDate = '';
        if (t.completedAt) {
          taskDate = new Date(t.completedAt).toLocaleDateString('en-CA');
        } else if (t.dueDate) {
          taskDate = t.dueDate;
        } else if (t.createdAt) {
          taskDate = new Date(t.createdAt).toLocaleDateString('en-CA');
        }
        return taskDate === todayStr;
      })
      .reduce((acc, t) => acc + parseDuration(t.duration), 0);
    
    const completionScore = tasks.length === 0 ? 0 : (completedTasks.reduce((acc, t) => {
      const isLate = t.dueDate && t.completedAt && t.completedAt.split('T')[0] > t.dueDate;
      return acc + (isLate ? 0.5 : 1);
    }, 0) / tasks.length) * 100;

    const moodTasks = completedTasks.filter((t) => t.mood);
    const avgMood = moodTasks.length
      ? (moodTasks.reduce((acc, t) => acc + (t.mood || 0), 0) / moodTasks.length).toFixed(1)
      : "0.0";

    const moodScore = (parseFloat(avgMood) / 5) * 100;
    
    const finalProductivity = Math.round(
      (completionScore * 0.7) + 
      (moodScore * 0.3)
    );

    return {
      completed: completedTasks.length,
      dailyHours: Math.floor(dailyDuration / 60),
      dailyMins: dailyDuration % 60,
      avgMood,
      productivity: finalProductivity,
    };
  }, [tasks, todayStr]);

  // Handle Kickoff / Winddown triggers
  const handleOpenKickoff = () => {
    setSelectedTaskIds([]);
    setWizardOpen("kickoff");
  };

  const handleToggleSelect = (taskId) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    } else {
      if (selectedTaskIds.length < 3) {
        setSelectedTaskIds(prev => [...prev, taskId]);
      }
    }
  };

  const handleFinishKickoff = () => {
    setDailyFocus(selectedTaskIds);
    completeKickoff();
    setWizardOpen(null);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#3b82f6", "#10b981"]
    });
  };

  const handleOpenWindDown = () => {
    setWindDownMood(3);
    setWizardOpen("wind_down");
  };

  const handleFinishWindDown = () => {
    completeWindDown();
    // Save mood to all daily focus tasks completed today
    todayFocusTasks.forEach(task => {
      if (task.status === 'done' && !task.mood) {
        updateTask(task.id, { mood: windDownMood });
      }
    });
    setWizardOpen(null);

    const completedCount = todayFocusTasks.filter(t => t.status === 'done').length;
    if (completedCount > 0) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.8 },
        colors: ["#ffd700", "#10b981", "#a855f7"]
      });
    }
  };

  // Timer helpers
  const activeFocusTask = tasks.find(t => t.id === focusSession.activeTaskId);
  const isStopwatchMode = focusSession.isStopwatch;

  // Timer mode: counts down. Stopwatch mode: counts up.
  const remainingSeconds = focusSession.duration - focusSession.secondsElapsed;
  const countdownMins = Math.floor(remainingSeconds / 60);
  const countdownSecs = remainingSeconds % 60;
  const elapsedMins = Math.floor(focusSession.secondsElapsed / 60);
  const elapsedSecs = focusSession.secondsElapsed % 60;

  // Display values
  const displayMins = isStopwatchMode ? elapsedMins : countdownMins;
  const displaySecs = isStopwatchMode ? elapsedSecs : countdownSecs;

  const timerRadius = 42;
  const timerCircumference = 2 * Math.PI * timerRadius;
  // Timer: fill as time elapses. Stopwatch: pulse ring (use elapsed mod 60s)
  const timerProgress = isStopwatchMode
    ? (focusSession.secondsElapsed % 60) / 60
    : focusSession.secondsElapsed / focusSession.duration;
  const strokeDashoffset = timerCircumference - timerProgress * timerCircumference;

  const handleStartTimer = () => {
    if (timerTaskId) {
      setHasShownSaveModal(false);
      const isStopwatch = timerMode === 'stopwatch';
      // For stopwatch mode, duration is set very large (won't be used as a limit)
      startFocus(timerTaskId, isStopwatch ? 999999 : timerDuration, isStopwatch);
    }
  };

  const handleManualSave = () => {
    const task = tasks.find(t => t.id === focusSession.activeTaskId);
    if (task) {
      const plannedMins = parseDurationToMinutes(task.duration) || 60;
      const actualMins = Math.max(1, Math.round(focusSession.secondsElapsed / 60));
      const ratio = actualMins / plannedMins;

      let moodVal = 3;
      if (ratio >= 1.1) moodVal = 5;
      else if (ratio >= 0.9) moodVal = 4;
      else if (ratio >= 0.6) moodVal = 3;
      else moodVal = 2;

      setSuggestedMood(moodVal);
      setMarkTaskAsDone(ratio >= 0.9 || actualMins >= plannedMins);
      setSessionCompletedSeconds(focusSession.secondsElapsed);
      setSaveSessionModalOpen(true);
      setHasShownSaveModal(true);
    } else {
      stopFocus(true);
    }
  };

  const handleConfirmSaveSession = () => {
    completeFocusSession(markTaskAsDone, suggestedMood);
    setSaveSessionModalOpen(false);
    if (markTaskAsDone) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#ec4899", "#22c55e"],
      });
    }
  };

  // Detect natural timer completion (only in timer mode, not stopwatch)
  useEffect(() => {
    if (isStopwatchMode) return; // Stopwatch never auto-completes
    if (focusSession.activeTaskId && focusSession.secondsElapsed >= focusSession.duration) {
      if (!saveSessionModalOpen && !hasShownSaveModal) {
        const task = tasks.find(t => t.id === focusSession.activeTaskId);
        if (task) {
          const plannedMins = parseDurationToMinutes(task.duration) || 60;
          const actualMins = Math.max(1, Math.round(focusSession.secondsElapsed / 60));
          const ratio = actualMins / plannedMins;

          let moodVal = 3;
          if (ratio >= 1.1) moodVal = 5;
          else if (ratio >= 0.9) moodVal = 4;
          else if (ratio >= 0.6) moodVal = 3;
          else moodVal = 2;

          setSuggestedMood(moodVal);
          setMarkTaskAsDone(true);
          setSessionCompletedSeconds(focusSession.secondsElapsed);
          setSaveSessionModalOpen(true);
          setHasShownSaveModal(true);
        }
      }
    }
  }, [focusSession.secondsElapsed, focusSession.duration, focusSession.activeTaskId, saveSessionModalOpen, hasShownSaveModal, tasks, isStopwatchMode]);

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

      {/* Daily Kickoff / Wind-down Banner Card */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/10">
        {kickoffCompletedDate !== todayStr ? (
          /* Kickoff Banner */
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-primary/10 text-brand-primary shrink-0">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">Kickstart your daily productivity flow!</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pick your top 3 priority focus tasks to conquer today.</p>
              </div>
            </div>
            <button
              onClick={handleOpenKickoff}
              className="px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary/95 text-xs font-black uppercase tracking-widest text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start md:self-center"
            >
              Start Kickoff <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : windDownCompletedDate !== todayStr ? (
          /* Wind-down Prompt Banner */
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0">
                <PartyPopper className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">Wrap up your focused day</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {todayFocusTasks.length > 0
                    ? `${todayFocusTasks.filter(t => t.status === 'done').length} of ${todayFocusTasks.length} daily priorities completed`
                    : "No daily priorities set — reflect on today's accomplishments!"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <button
                onClick={handleOpenKickoff}
                className="px-3.5 py-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800/50"
              >
                Rerun Kickoff
              </button>
              <button
                onClick={handleOpenWindDown}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-black uppercase tracking-widest text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Start Wind-down <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Completed Banner */
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">Today's workflow complete!</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kickoff and wind-down completed. Rest well and recharge for tomorrow!</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <button
                onClick={handleOpenKickoff}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800"
              >
                Rerun Kickoff
              </button>
              <button
                onClick={handleOpenWindDown}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800"
              >
                Rerun Wind-down
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Middle Row (Daily Priorities Checklist & Focus Timer Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Priorities */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 bg-slate-900/20 flex flex-col justify-between border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold">Today's Priority Focus Tasks</h2>
            </div>

            {dailyFocusTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <Circle className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs">No focus tasks selected today. Start Kickoff to set priorities!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayFocusTasks.map(task => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isDone
                          ? "bg-emerald-500/5 border-emerald-500/20 opacity-70"
                          : "bg-slate-950/40 border-slate-850 hover:border-slate-800"
                      }`}
                    >
                      <button
                        onClick={() => {
                          const targetStatus = isDone 
                            ? (task.category && task.category !== 'done' ? task.category : 'college') 
                            : 'done';
                          updateTask(task.id, { status: targetStatus, completedAt: isDone ? null : new Date().toISOString() });
                        }}
                        className="shrink-0 transition-transform hover:scale-110 cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle className="w-5.5 h-5.5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5.5 h-5.5 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          {task.category || task.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {dailyFocusTasks.length > 0 && kickoffCompletedDate === todayStr && (
            <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Progress: {todayFocusTasks.filter(t => t.status === 'done').length} / {todayFocusTasks.length} Done</span>
              <button
                onClick={handleOpenKickoff}
                className="text-brand-primary hover:underline cursor-pointer"
              >
                Change Priorities
              </button>
            </div>
          )}
        </div>

        {/* Focus Timer Card */}
        <div className="glass-panel rounded-xl p-6 bg-slate-900/20 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold">Focus Timer</h2>
          </div>

          {focusSession.activeTaskId ? (
            /* Timer Active Display */
            <div className="flex flex-col items-center py-2 text-center">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-32 h-32 absolute transform -rotate-90">
                  <circle cx="64" cy="64" r={timerRadius} className="stroke-slate-900" strokeWidth="4.5" fill="transparent" />
                  <circle
                    cx="64" cy="64" r={timerRadius}
                    className={`transition-all duration-300 ${isStopwatchMode ? 'stroke-emerald-400' : 'stroke-amber-500'}`}
                    strokeWidth="4.5"
                    fill="transparent"
                    strokeDasharray={timerCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center z-10">
                  <span className="text-2xl font-black text-white leading-none">
                    {displayMins.toString().padStart(2, '0')}:{displaySecs.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isStopwatchMode ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isStopwatchMode ? '⏱ Elapsed' : 'Remaining'}
                  </span>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-200 truncate max-w-full px-2 mb-1">
                {activeFocusTask ? activeFocusTask.title : "Focus Session"}
              </p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-4">
                {isStopwatchMode ? '🔓 Free-run Stopwatch' : (activeFocusTask ? (activeFocusTask.category || activeFocusTask.status) : "General")}
              </p>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={pauseFocus}
                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-900"
                  title={focusSession.isPaused ? "Play" : "Pause"}
                >
                  {focusSession.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleManualSave}
                  className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer"
                  title="Complete and Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => stopFocus(false)}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                  title="Discard"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Setup Display */
            <div className="flex flex-col justify-between flex-1 py-1 space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-950/60 border border-slate-900 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setTimerMode('timer')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    timerMode === 'timer'
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Clock className="w-3 h-3" /> Timer
                </button>
                <button
                  onClick={() => setTimerMode('stopwatch')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    timerMode === 'stopwatch'
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Zap className="w-3 h-3" /> Stopwatch
                </button>
              </div>

              {/* Task Picker */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Select Task to Focus</label>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 custom-scrollbar divide-y divide-slate-900">
                  {pendingTasks.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-600 text-center">No pending tasks</div>
                  ) : (
                    pendingTasks.map(task => {
                      const isSelected = timerTaskId === task.id;
                      const accentActive = timerMode === 'stopwatch' ? 'bg-emerald-500/10 border-l-2 border-emerald-500 text-white' : 'bg-amber-500/10 border-l-2 border-amber-500 text-white';
                      return (
                        <button
                          key={task.id}
                          onClick={() => setTimerTaskId(task.id)}
                          className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected ? accentActive : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-semibold truncate flex-1 leading-snug">{task.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.duration && (
                              <span className="text-[9px] font-black text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded-md">{task.duration}</span>
                            )}
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-500">
                              {task.category || task.status}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {timerMode === 'timer' && (
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "15m", value: 900 },
                      { label: "25m", value: 1500 },
                      { label: "50m", value: 3000 },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setTimerDuration(opt.value)}
                        className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                          timerDuration === opt.value
                            ? "bg-amber-500/10 border-amber-500 text-amber-500"
                            : "bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleStartTimer}
                disabled={!timerTaskId}
                className={`w-full py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                  timerMode === 'stopwatch'
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10'
                    : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/10'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                {timerMode === 'stopwatch' ? 'Start Stopwatch' : 'Start Focus Session'}
              </button>
            </div>
          )}
        </div>
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

      {/* Daily Kickoff / Wind-down Wizard Modals */}
      {wizardOpen === "kickoff" && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Daily Kickoff</h3>
            <p className="text-xs text-slate-400 mb-6">Select up to 3 priority tasks you want to complete today. (Selected: {selectedTaskIds.length}/3)</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar mb-6">
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">No pending tasks. Create some on the board first!</p>
              ) : (
                pendingTasks.map(task => {
                  const selected = selectedTaskIds.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleToggleSelect(task.id)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        selected
                          ? "bg-brand-primary/10 border-brand-primary text-white"
                          : "bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{task.title}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                          {task.category || task.status}
                        </p>
                      </div>
                      {selected ? (
                        <CheckCircle className="w-4.5 h-4.5 text-brand-primary shrink-0" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-slate-700 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWizardOpen(null)}
                className="py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishKickoff}
                disabled={selectedTaskIds.length === 0}
                className="py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-brand-primary hover:bg-brand-primary/95 transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                Let's Go! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {wizardOpen === "wind_down" && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Daily Wind-down</h3>
            <p className="text-xs text-slate-400 mb-6">Excellent job! Take a moment to reflect and record your daily status.</p>
            
            {/* Completion Summary */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850 mb-6 space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Priority Completions</p>
              <p className="text-lg font-black text-white">
                {todayFocusTasks.filter(t => t.status === 'done').length} / {todayFocusTasks.length} Completed
              </p>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${todayFocusTasks.length > 0 ? (todayFocusTasks.filter(t => t.status === 'done').length / todayFocusTasks.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Mood selector */}
            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5 block">How was your mindset today?</label>
              <div className="flex items-center justify-between px-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setWindDownMood(num)}
                    className={`w-10 h-10 rounded-xl font-black transition-all border flex items-center justify-center cursor-pointer ${
                      windDownMood === num
                        ? "bg-amber-500/10 border-amber-500 text-amber-500"
                        : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWizardOpen(null)}
                className="py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishWindDown}
                className="py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer"
              >
                Wrap Up Day ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {saveSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-white tracking-tighter uppercase">Session Completed!</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Focus results & mood check</p>
              </div>
              <button 
                onClick={() => setSaveSessionModalOpen(false)}
                className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Session Stats Panel */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-slate-400">
                  Task: <span className="text-white font-black">{activeFocusTask ? activeFocusTask.title : "General Focus"}</span>
                </p>
                
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Focused Time</span>
                    <span className="text-base font-black text-brand-success">
                      {Math.max(1, Math.round(sessionCompletedSeconds / 60))} mins
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Planned Duration</span>
                    <span className="text-base font-black text-brand-primary">
                      {activeFocusTask ? activeFocusTask.duration || "N/A" : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mark Task Complete Toggle Switch */}
              {activeFocusTask && (
                <div className="flex items-center justify-between py-2 px-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                  <span className="text-[11px] font-black text-slate-305 uppercase tracking-wide">Mark task completed?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !markTaskAsDone;
                      setMarkTaskAsDone(nextVal);
                      
                      // Dynamically adjust suggested mood when toggled
                      const plannedMins = parseDurationToMinutes(activeFocusTask.duration) || 60;
                      const actualMins = Math.max(1, Math.round(sessionCompletedSeconds / 60));
                      const ratio = actualMins / plannedMins;
                      let moodVal = 3;
                      if (ratio >= 1.1) moodVal = 5;
                      else if (ratio >= 0.9) moodVal = 4;
                      else if (ratio >= 0.6) moodVal = nextVal ? 4 : 3;
                      else moodVal = nextVal ? 4 : 2;
                      setSuggestedMood(moodVal);
                    }}
                    className="flex items-center gap-2 transition-all focus:outline-none"
                  >
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${markTaskAsDone ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${markTaskAsDone ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>
                </div>
              )}

              {/* Mood selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">How was your focus / vibe?</span>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                    {suggestedMood === 5 ? "🤩 Awesome (Flow)" :
                     suggestedMood === 4 ? "🙂 Productive" :
                     suggestedMood === 3 ? "😐 Neutral" :
                     suggestedMood === 2 ? "😕 Distracted" : "😠 Struggled"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center gap-1.5 bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-2xl">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSuggestedMood(num)}
                      className={`w-9 h-12 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                        suggestedMood === num
                          ? "bg-amber-500 border-amber-500 text-slate-950 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-base">
                        {num === 5 ? "🤩" : num === 4 ? "🙂" : num === 3 ? "😐" : num === 2 ? "😕" : "😠"}
                      </span>
                      <span className={`text-[7px] font-black mt-0.5 ${suggestedMood === num ? 'text-slate-950' : 'text-slate-500'}`}>{num}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopFocus(false);
                    setSaveSessionModalOpen(false);
                  }}
                  className="px-4 py-2.5 border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer"
                >
                  Discard Session
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveSession}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-lg"
                >
                  Save & Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
