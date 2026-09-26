import React, { useState } from 'react';
import { X, Settings, Clock, Calendar, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';
import { useTimerStore } from '../../store/useTimerStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const {
    rolloverTime,
    weekStartDay,
    gracePeriodSec,
    setRolloverTime,
    setWeekStartDay,
    setGracePeriodSec,
  } = useConfigStore();

  const {
    workDurationSec,
    shortBreakDurationSec,
    longBreakDurationSec,
    setPomodoroDurations,
  } = useTimerStore();

  const [inputRollover, setInputRollover] = useState(rolloverTime);
  const [workMin, setWorkMin] = useState(Math.round(workDurationSec / 60));
  const [shortMin, setShortMin] = useState(Math.round(shortBreakDurationSec / 60));
  const [longMin, setLongMin] = useState(Math.round(longBreakDurationSec / 60));
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    await setRolloverTime(inputRollover);
    setPomodoroDurations(workMin, shortMin, longMin);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const PRESET_ROLLOVERS = ['02:00', '03:00', '04:00', '05:00', '06:00'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">App Settings</h3>
              <p className="text-xs text-slate-400">Configure schedule boundaries and timer pacing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Day Rollover Cutoff */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Day Rollover Cutoff Time
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Late night sessions before this time will count toward the previous day.
            </p>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="time"
                value={inputRollover}
                onChange={(e) => setInputRollover(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 font-mono text-sm text-white outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_ROLLOVERS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setInputRollover(time)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      inputRollover === time
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start of Week Selection */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Start of Week
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWeekStartDay(1)}
                className={`p-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  weekStartDay === 1
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Monday (Standard)
              </button>
              <button
                type="button"
                onClick={() => setWeekStartDay(0)}
                className={`p-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  weekStartDay === 0
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Sunday
              </button>
            </div>
          </div>

          {/* Grace Period */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Transition Grace Period
              </div>
              <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded-md border border-white/5">
                {gracePeriodSec} Seconds
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Time allowed in unauthorized windows before categorizing as Diverted.
            </p>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={gracePeriodSec}
              onChange={(e) => setGracePeriodSec(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Pomodoro Durations */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Pomodoro Intervals (Minutes)
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Work Phase</label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={workMin}
                  onChange={(e) => setWorkMin(parseInt(e.target.value, 10) || 25)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 font-mono text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Short Break</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={shortMin}
                  onChange={(e) => setShortMin(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 font-mono text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Long Break</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={longMin}
                  onChange={(e) => setLongMin(parseInt(e.target.value, 10) || 15)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 font-mono text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4 text-white" />
                Settings Saved
              </>
            ) : (
              'Save & Apply Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
