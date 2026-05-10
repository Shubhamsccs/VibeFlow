import { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Coffee, 
  Target, 
  ChevronRight,
  Clock,
  Zap,
  LayoutGrid,
  Trophy
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export default function TimeTracker() {
  const { 
    tasks, 
    activeTaskId, 
    setActiveTask, 
    timerState, 
    setTimerMode, 
    setTimerStatus, 
    updateTimer,
    addTask
  } = useTaskStore();

  const [localMood, setLocalMood] = useState(3);
  const [showMoodCapture, setShowMoodCapture] = useState(false);

  const activeTask = tasks.find(t => t.id === activeTaskId);
  const availableTasks = tasks.filter(t => t.status !== 'done');

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (timerState.status === 'running') {
      interval = setInterval(() => {
        if (timerState.mode === 'pomodoro') {
          if (timerState.timeLeft > 0) {
            updateTimer(timerState.timeLeft - 1, timerState.totalElapsed + 1);
          } else {
            setTimerStatus('paused');
            setShowMoodCapture(true);
            clearInterval(interval);
          }
        } else {
          updateTimer(timerState.timeLeft + 1, timerState.totalElapsed + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.status, timerState.timeLeft, timerState.mode, updateTimer, setTimerStatus]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    setTimerStatus('idle');
    setShowMoodCapture(true);
  };

  const saveSession = () => {
    const durationStr = `${Math.floor(timerState.totalElapsed / 3600).toString().padStart(2, '0')}:${Math.floor((timerState.totalElapsed % 3600) / 60).toString().padStart(2, '0')}:00`;
    
    const sessionData = {
      title: activeTask ? `Focus: ${activeTask.title}` : "Quick Focus Session",
      duration: durationStr,
      status: 'done',
      mood: localMood,
      category: activeTask?.category || 'myspace',
      dueDate: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString()
    };

    addTask(sessionData);
    setShowMoodCapture(false);
    updateTimer(timerState.mode === 'pomodoro' ? 25 * 60 : 0, 0);
  };

  const progress = timerState.mode === 'pomodoro' 
    ? ((25 * 60 - timerState.timeLeft) / (25 * 60)) * 100 
    : 100;

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-12rem)] pb-12">
      
      {/* Left Column: Focus Zone */}
      <div className="flex-1 flex flex-col gap-6 order-2 lg:order-1">
        <div className="glass-panel rounded-[40px] p-8 lg:p-16 flex flex-col items-center justify-center relative overflow-hidden border-slate-800 bg-slate-900/10 flex-1">
          
          {/* Subtle Background Glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-[120px] rounded-full transition-colors duration-1000 ${
            timerState.status === 'running' 
              ? (timerState.mode === 'pomodoro' ? 'bg-brand-primary/20' : 'bg-brand-secondary/20') 
              : 'bg-slate-800/10'
          }`} />

          {/* Mode Switcher */}
          <div className="relative z-10 flex bg-slate-950/80 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-800 mb-12">
            <button 
              onClick={() => setTimerMode('pomodoro')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${timerState.mode === 'pomodoro' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Zap className={`w-3.5 h-3.5 ${timerState.mode === 'pomodoro' ? 'fill-current' : ''}`} />
              POMODORO
            </button>
            <button 
              onClick={() => setTimerMode('stopwatch')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${timerState.mode === 'stopwatch' ? 'bg-brand-secondary text-white shadow-xl shadow-brand-secondary/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              FLOW STATE
            </button>
          </div>

          {/* Central Timer Orb */}
          <div className="relative z-10 w-64 h-64 lg:w-80 lg:h-80 flex items-center justify-center mb-12 group">
            {/* Visual Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <circle 
                cx="50%" cy="50%" r="46%" 
                className="stroke-slate-900 fill-none" 
                strokeWidth="8"
              />
              <circle 
                cx="50%" cy="50%" r="46%" 
                className={`fill-none transition-all duration-1000 ${timerState.mode === 'pomodoro' ? 'stroke-brand-primary' : 'stroke-brand-secondary'}`}
                strokeWidth="8"
                strokeDasharray="100 100"
                style={{ strokeDasharray: `289.02%`, strokeDashoffset: `${289.02 - (289.02 * progress) / 100}%` }}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Content */}
            <div className="flex flex-col items-center justify-center text-center px-2 overflow-visible relative z-20">
              <span className="text-6xl lg:text-7xl font-black tracking-normal tabular-nums font-heading text-white whitespace-nowrap drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {formatTime(timerState.mode === 'pomodoro' ? timerState.timeLeft : timerState.totalElapsed)}
              </span>
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">
                  {timerState.status === 'running' ? 'Focusing Now' : 'Session Paused'}
                </span>
                {activeTask && (
                  <div className="bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800 text-[11px] font-bold text-brand-primary mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                    {activeTask.title}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Cluster */}
          <div className="relative z-10 flex items-center gap-6">
            <button 
              onClick={() => {
                updateTimer(timerState.mode === 'pomodoro' ? 25 * 60 : 0, 0);
                setTimerStatus('idle');
              }}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-white transition-all hover:bg-slate-900 active:scale-95"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            <button 
              onClick={() => setTimerStatus(timerState.status === 'running' ? 'paused' : 'running')}
              className={`w-24 h-24 rounded-4xl flex items-center justify-center transition-all shadow-2xl active:scale-90 ${
                timerState.status === 'running' 
                ? 'bg-slate-950 border border-slate-800 text-slate-200' 
                : 'bg-brand-primary text-white shadow-brand-primary/40'
              }`}
            >
              {timerState.status === 'running' ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12 ml-1" />}
            </button>

            <button 
              onClick={handleEndSession}
              disabled={timerState.totalElapsed === 0}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-brand-danger transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-30"
            >
              <Square className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="glass-panel rounded-3xl p-6 border-slate-800 flex items-center justify-between gap-6 overflow-hidden relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center border border-brand-secondary/20">
              <Trophy className="w-6 h-6 text-brand-secondary" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-wider">Focus Progress</p>
              <p className="text-xs text-slate-500">6h Daily Goal</p>
            </div>
          </div>
          
          {/* Daily Progress Calculation */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const dailyMins = tasks.reduce((acc, t) => {
              if (t.status === 'done' && (t.completedAt?.startsWith(today) || t.dueDate === today)) {
                const parseDuration = (duration) => {
                  if (!duration) return 0;
                  if (duration.includes(':')) {
                    const parts = duration.split(':').map(Number);
                    return (parts[0] * 60) + (parts[1] || 0);
                  }
                  const h = parseInt(duration.match(/(\d+)h/)?.[1] || 0);
                  const m = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
                  return (h * 60) + m;
                };
                return acc + parseDuration(t.duration);
              }
              return acc;
            }, 0);
            const dailyHours = dailyMins / 60;
            const progressPercent = Math.min((dailyHours / 6) * 100, 100);

            return (
              <div className="flex-1 max-w-xs relative z-10">
                <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase mb-2">
                  <span>{Math.round(progressPercent)}% Done</span>
                  <span>{dailyHours.toFixed(1)}h / 6h</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-800 p-0.5 overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(236,72,153,0.3)]" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Right Column: Task Intelligence */}
      <div className="w-full lg:w-80 flex flex-col gap-6 order-1 lg:order-2">
        <div className="glass-panel rounded-3xl border-slate-800 flex flex-col overflow-hidden bg-slate-900/5 flex-1">
          <div className="p-6 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Available Tasks</h2>
              <LayoutGrid className="w-4 h-4 text-brand-primary" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold">Pick a target for this session</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {availableTasks.length > 0 ? (
              availableTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => setActiveTask(task.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative group ${
                    activeTaskId === task.id 
                      ? 'bg-slate-950 border-brand-primary/50 shadow-lg' 
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 transition-colors ${
                      activeTaskId === task.id ? 'bg-brand-primary shadow-[0_0_8px_#8b5cf6]' : 'bg-slate-800'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${activeTaskId === task.id ? 'text-white' : 'text-slate-400'}`}>
                        {task.title}
                      </p>
                      <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Target className="w-8 h-8 text-slate-800 mb-3" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-loose">
                  No pending<br/>activities found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mood Capture Modal (Modern) */}
      {showMoodCapture && (
        <div className="fixed top-0 left-0 w-screen h-screen z-9999 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-sm p-8 rounded-[48px] border-slate-700 shadow-3xl text-center">
            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
               <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full" />
               <Zap className="w-12 h-12 text-brand-primary relative z-10" />
            </div>
            
            <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">Session Ended</h2>
            <p className="text-slate-500 text-sm font-medium mb-10">How was your focus energy?</p>

            <div className="flex justify-between gap-2 mb-10">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => setLocalMood(score)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold transition-all ${
                    localMood === score 
                      ? 'bg-brand-primary text-white scale-110 shadow-2xl shadow-brand-primary/50' 
                      : 'bg-slate-900 text-slate-600 hover:text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>

            <button 
              onClick={saveSession}
              className="w-full py-5 rounded-3xl bg-white text-black font-black text-sm uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Complete Session <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
