import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipForward,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  Laptop,
  AlertTriangle,
} from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';
import { useSubjectStore } from '../../store/useSubjectStore';
import { useConfigStore } from '../../store/useConfigStore';
import { formatSeconds, formatDurationHuman } from '../../lib/timeUtils';
import { StudySession } from '../../types/tracker';

interface TimerViewProps {
  onSessionComplete?: (session: StudySession) => void;
  onOpenSubjectsModal?: () => void;
}

export const TimerView: React.FC<TimerViewProps> = ({
  onSessionComplete,
  onOpenSubjectsModal,
}) => {
  const {
    mode,
    setMode,
    pomodoroPhase,
    timeRemainingSec,
    totalElapsedSec,
    workDurationSec,
    isRunning,
    isPaused,
    pureFocusSec,
    allowedUsageSec,
    divertedSec,
    currentStatus,
    currentProcess,
    currentTitle,
    graceRemainingSec,
    pomodoroCyclesCompleted,
    longBreakInterval,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
    skipPomodoroPhase,
  } = useTimerStore();

  const { subjects, activeSubjectId, setActiveSubjectId } = useSubjectStore();
  const { whitelistRules } = useConfigStore();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const handleStart = async () => {
    if (!activeSubject) {
      if (onOpenSubjectsModal) onOpenSubjectsModal();
      return;
    }
    await startSession(activeSubject.id, whitelistRules);
  };

  const handleStop = async () => {
    const session = await stopSession();
    if (session && onSessionComplete) {
      onSessionComplete(session);
    }
  };

  const handleDiscard = async () => {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    await discardSession();
    setConfirmDiscard(false);
  };

  // Determine displayed timer value
  const displaySeconds = mode === 'pomodoro' ? timeRemainingSec : totalElapsedSec;

  // Total session logged duration
  const totalTracked = pureFocusSec + allowedUsageSec + divertedSec;
  const focusPercent = totalTracked > 0 ? Math.round((pureFocusSec / totalTracked) * 100) : 100;
  const allowedPercent = totalTracked > 0 ? Math.round((allowedUsageSec / totalTracked) * 100) : 0;
  const divertedPercent = totalTracked > 0 ? Math.round((divertedSec / totalTracked) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-4 py-6 select-none">
      {/* Mode & Subject Topbar */}
      <div className="flex flex-wrap items-center justify-between w-full mb-8 gap-4">
        {/* Mode Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-white/5 backdrop-blur-md">
          <button
            onClick={() => setMode('stopwatch')}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              mode === 'stopwatch'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-white disabled:opacity-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Stopwatch
          </button>
          <button
            onClick={() => setMode('pomodoro')}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              mode === 'pomodoro'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-white disabled:opacity-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Pomodoro
          </button>
        </div>

        {/* Subject Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/5">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: activeSubject?.color_hex || '#6366f1' }}
            />
            <select
              value={activeSubject?.id || ''}
              onChange={(e) => setActiveSubjectId(e.target.value)}
              disabled={isRunning}
              className="bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer pr-2 disabled:opacity-60"
            >
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.id} className="bg-slate-900 text-white">
                  {subj.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenSubjectsModal}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
            title="Manage Subjects"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Focus Capsule Container */}
      <div className="relative w-full rounded-3xl p-8 lg:p-12 bg-slate-900/60 border border-white/8 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{
            backgroundColor:
              currentStatus === 'DIVERTED'
                ? '#f43f5e'
                : currentStatus === 'ALLOWED'
                ? '#10b981'
                : '#6366f1',
          }}
        />

        {/* Pomodoro Phase Pill (if in pomodoro mode) */}
        {mode === 'pomodoro' && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor:
                  pomodoroPhase === 'work'
                    ? '#6366f1'
                    : pomodoroPhase === 'short_break'
                    ? '#06b6d4'
                    : '#10b981',
              }}
            />
            {pomodoroPhase === 'work'
              ? `Work Session (${pomodoroCyclesCompleted % longBreakInterval + 1}/${longBreakInterval})`
              : pomodoroPhase === 'short_break'
              ? 'Short Break'
              : 'Long Rest Break'}
          </div>
        )}

        {/* Giant Monospace Timer Digits */}
        <div className="relative my-4 flex items-center justify-center">
          <span className="font-mono text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tight text-white drop-shadow-md">
            {formatSeconds(displaySeconds, mode === 'stopwatch')}
          </span>
        </div>

        {/* Real-time Focus Status Badge */}
        {isRunning ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div
              className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
                currentStatus === 'FOCUS'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : currentStatus === 'ALLOWED'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse shadow-lg shadow-rose-500/20'
              }`}
            >
              {currentStatus === 'FOCUS' && (
                <>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Pure Focus — VibeFlow In Foreground</span>
                </>
              )}
              {currentStatus === 'ALLOWED' && (
                <>
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Allowed Study Tool Active</span>
                </>
              )}
              {currentStatus === 'DIVERTED' && (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Diverted — Unauthorized Window Frontmost</span>
                </>
              )}
            </div>

            {/* Diagnostic Foreground Window Label */}
            <div className="flex items-center gap-2 text-xs text-slate-400 max-w-md truncate">
              <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-mono text-slate-300">{currentProcess || 'active window'}</span>
              {currentTitle && <span className="text-slate-500 truncate">— {currentTitle}</span>}
            </div>

            {/* Grace Period Warning Indicator */}
            {graceRemainingSec < 30 && graceRemainingSec > 0 && currentStatus !== 'FOCUS' && (
              <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm transition-opacity duration-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {graceRemainingSec}s grace remaining before penalized as Diverted!
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            Ready for deep work • Subject: {activeSubject?.name || 'General'}
          </div>
        )}

        {/* Tri-State Focus Metrics Progress Bars */}
        <div className="w-full mt-10 max-w-lg">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-indigo-400">Pure Focus: {focusPercent}%</span>
            <span className="text-emerald-400">Allowed: {allowedPercent}%</span>
            <span className="text-rose-400">Diverted: {divertedPercent}%</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-800/80 overflow-hidden flex p-0.5 border border-white/5">
            <div
              className="h-full bg-indigo-500 rounded-l-full transition-all duration-300"
              style={{ width: `${focusPercent}%` }}
              title={`Pure Focus: ${formatDurationHuman(pureFocusSec)}`}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${allowedPercent}%` }}
              title={`Allowed: ${formatDurationHuman(allowedUsageSec)}`}
            />
            <div
              className="h-full bg-rose-500 rounded-r-full transition-all duration-300"
              style={{ width: `${divertedPercent}%` }}
              title={`Diverted: ${formatDurationHuman(divertedSec)}`}
            />
          </div>

          {/* Numerical breakdown chips */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-indigo-500/20">
              <span className="block text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">
                Pure Focus
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {formatDurationHuman(pureFocusSec)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-emerald-500/20">
              <span className="block text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                Allowed Tools
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {formatDurationHuman(allowedUsageSec)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-rose-500/20">
              <span className="block text-[11px] uppercase tracking-wider text-rose-400 font-semibold">
                Diverted
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {formatDurationHuman(divertedSec)}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-4 mt-10">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-bold text-base text-white cursor-pointer select-none transition-all duration-200 bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 hover:scale-102 active:scale-98 border border-indigo-400/30"
            >
              <Play className="w-5 h-5 fill-white" />
              Start Focus Session
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeSession}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseSession}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all cursor-pointer hover:scale-105"
                >
                  <Pause className="w-4 h-4 fill-slate-200" />
                  Pause
                </button>
              )}

              {/* Stop & Save */}
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105"
              >
                <Square className="w-4 h-4 fill-white" />
                Finish Session
              </button>

              {/* Skip Pomodoro Phase */}
              {mode === 'pomodoro' && (
                <button
                  onClick={skipPomodoroPhase}
                  className="p-3.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-white/10 transition-all cursor-pointer"
                  title="Skip to next phase"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}

              {/* Discard Session */}
              <button
                onClick={handleDiscard}
                className={`p-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  confirmDiscard
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 border-white/5'
                }`}
                title="Discard session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
