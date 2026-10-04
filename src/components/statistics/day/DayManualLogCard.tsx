import React, { useState, useMemo } from 'react';
import { PlusCircle, Clock, Check, AlertCircle } from 'lucide-react';
import { Subject, StudySession } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';

interface DayManualLogCardProps {
  selectedDateStr: string;
  subjects: Subject[];
  existingSessions: StudySession[];
  onAddSession: (session: StudySession) => Promise<void> | void;
}

export const DayManualLogCard: React.FC<DayManualLogCardProps> = ({
  selectedDateStr,
  subjects,
  existingSessions,
  onAddSession,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync selectedSubjectId if subjects change
  React.useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.some((s) => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Safe timestamp to ms helper
  const toMs = (ts: number | null | undefined): number => {
    if (!ts) return 0;
    return ts < 1e11 ? ts * 1000 : ts;
  };

  // Format 12-hour AM/PM time e.g. "AM 7:33"
  const formatAmPm = (ms: number): string => {
    if (!ms) return '-';
    const d = new Date(ms);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${ampm} ${h12}:${String(minutes).padStart(2, '0')}`;
  };

  // Strict Validation: No Future Time & No Overlap with Existing Logs
  const validation = useMemo(() => {
    if (!startTime || !endTime || !selectedDateStr) {
      return { isValid: false, error: 'Please enter start and end time', durationSec: 0 };
    }

    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, startH, startM, 0, 0);
    let endDate = new Date(year, month - 1, day, endH, endM, 0, 0);

    // If end time is earlier than or equal to start time, it wraps past midnight into the next day
    if (endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(year, month - 1, day + 1, endH, endM, 0, 0);
    }

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    // 1. Duration must be strictly positive
    const durationSec = Math.round((endMs - startMs) / 1000);
    if (durationSec <= 0) {
      return { isValid: false, error: 'End time must be after start time', durationSec: 0 };
    }

    // 2. Cannot log future time
    const nowMs = Date.now();
    if (startMs > nowMs) {
      return { isValid: false, error: 'Cannot log a study session in the future', durationSec };
    }
    if (endMs > nowMs) {
      return { isValid: false, error: 'End time cannot be in the future', durationSec };
    }

    // 3. Cannot overlap with any existing log
    for (const sess of existingSessions) {
      if (sess.status === 'completed' || sess.status === 'in_progress') {
        const sStart = toMs(sess.start_time_utc);
        const focusSec = (sess.pure_focus_sec || 0) + (sess.allowed_usage_sec || 0);
        if (focusSec <= 0 || sStart <= 0) continue;
        const sEnd = sess.end_time_utc ? toMs(sess.end_time_utc) : sStart + focusSec * 1000;

        // Mathematical overlap check: startA < endB && endA > startB
        if (startMs < sEnd && endMs > sStart) {
          const subjName = subjects.find((s) => s.id === sess.subject_id)?.name || 'Study';
          const overlapRange = `${formatAmPm(sStart)} ~ ${formatAmPm(sEnd)}`;
          return {
            isValid: false,
            error: `Overlaps with "${subjName}" (${overlapRange})`,
            durationSec,
          };
        }
      }
    }

    return { isValid: true, error: null, durationSec, startMs, endMs };
  }, [startTime, endTime, selectedDateStr, existingSessions, subjects]);

  // Quick preset adder: sets end time based on start time + minutes
  const handleQuickPreset = (minutesToAdd: number) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + minutesToAdd;
    const newEndH = Math.floor(totalMinutes / 60) % 24;
    const newEndM = totalMinutes % 60;
    setEndTime(`${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!selectedSubjectId) return;
    if (!validation.isValid || !validation.startMs || !validation.endMs) return;

    const newSession: StudySession = {
      id: 'sess_manual_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      subject_id: selectedSubjectId,
      start_time_utc: Math.floor(validation.startMs / 1000),
      end_time_utc: Math.floor(validation.endMs / 1000),
      pure_focus_sec: validation.durationSec,
      allowed_usage_sec: 0,
      diverted_sec: 0,
      logical_date: selectedDateStr,
      status: 'completed',
    };

    setIsSubmitting(true);
    try {
      await onAddSession(newSession);
      setSuccessMessage('Log added to timeline!');

      // Advance startTime to previous endTime for convenient back-to-back logging if not in future
      if (validation.endMs < Date.now()) {
        setStartTime(endTime);
        const [currEndH, currEndM] = endTime.split(':').map(Number);
        const nextEndH = (currEndH + 1) % 24;
        setEndTime(`${String(nextEndH).padStart(2, '0')}:${String(currEndM).padStart(2, '0')}`);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to add manual log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
            Log Study Time
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Manual Entry
        </span>
      </div>

      {subjects.length === 0 ? (
        <div className="py-6 text-center text-xs font-serif text-slate-500">
          No subjects found. Please add a subject first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4.5">
          {/* Subject Picker */}
          <div>
            <label className="block text-[11px] font-serif uppercase tracking-widest text-slate-400 mb-1.5 font-medium">
              Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-serif text-white focus:outline-none focus:border-cyan-400 cursor-pointer appearance-none transition-all shadow-inner"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
              {/* Color swatch dot on right */}
              {(() => {
                const current = subjects.find((s) => s.id === selectedSubjectId);
                return current ? (
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none shadow-sm"
                    style={{ backgroundColor: current.color_hex }}
                  />
                ) : null;
              })()}
            </div>
          </div>

          {/* Time Picker Inputs: Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-serif uppercase tracking-widest text-slate-400 mb-1.5 font-medium">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer text-center tracking-wider transition-all shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-serif uppercase tracking-widest text-slate-400 mb-1.5 font-medium">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer text-center tracking-wider transition-all shadow-inner"
                required
              />
            </div>
          </div>

          {/* Quick Duration Presets */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Presets:</span>
            {[
              { label: '+25m', min: 25 },
              { label: '+45m', min: 45 },
              { label: '+1h', min: 60 },
              { label: '+2h', min: 120 },
            ].map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => handleQuickPreset(preset.min)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calculated Duration or Live Error Display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <span className="text-xs font-serif text-slate-400">Duration:</span>
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                validation.isValid ? 'text-cyan-300' : 'text-slate-500'
              }`}
            >
              {validation.durationSec > 0 ? formatSeconds(validation.durationSec) : '00:00:00'}
            </span>
          </div>

          {/* Validation Error Message */}
          {!validation.isValid && validation.error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-serif bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{validation.error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-serif bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !validation.isValid}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#38bdf8] text-slate-950 font-serif text-xs font-bold uppercase tracking-wider hover:bg-[#38bdf8]/90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Logging...' : 'Add Log to Timeline'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
