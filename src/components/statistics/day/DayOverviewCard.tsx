import React, { useMemo } from 'react';
import { StudySession, Subject } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';
import { useTimerStore } from '../../../store/useTimerStore';

interface DayOverviewCardProps {
  selectedDateStr: string;
  daySessions: StudySession[];
  subjects: Subject[];
  rolloverTime: string;
  liveSecondsToday: number;
  isToday: boolean;
}

export const DayOverviewCard: React.FC<DayOverviewCardProps> = ({
  selectedDateStr,
  daySessions,
  subjects,
  liveSecondsToday,
  isToday,
}) => {
  const isRunning = useTimerStore((state) => state.isRunning);

  // Format Date for Title e.g. "FRI, SEP 18"
  const formattedTitle = useMemo(() => {
    if (!selectedDateStr) return 'TODAY';
    const [y, m, d] = selectedDateStr.split('-').map((v) => parseInt(v, 10));
    const dateObj = new Date(y, m - 1, d);
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return `${weekday}, ${month} ${d}`;
  }, [selectedDateStr]);

  // Safe timestamp converter to milliseconds
  const toMs = (ts: number | null | undefined): number => {
    if (!ts) return 0;
    return ts < 1e11 ? ts * 1000 : ts;
  };

  // Format timestamp in 12-hour AM/PM format (e.g. "AM 7:33" or "PM 4:30")
  const formatAmPm = (ms: number): string => {
    if (!ms) return '-';
    const d = new Date(ms);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${ampm} ${h12}:${String(minutes).padStart(2, '0')}`;
  };

  // Core metrics calculation with mathematically accurate start/end times
  const metrics = useMemo(() => {
    let totalFocus = 0;
    let allowedUsage = 0;
    let maxFocus = 0;
    let minStartMs = Infinity;
    let maxEndMs = 0;

    // Filter valid sessions for this logical date
    const valid = daySessions.filter((s) => s.status === 'completed' || s.status === 'in_progress');

    for (const sess of valid) {
      const focus = sess.pure_focus_sec || 0;
      const allowed = sess.allowed_usage_sec || 0;
      const sessTotal = focus + allowed;

      totalFocus += sessTotal;
      allowedUsage += allowed;
      if (sessTotal > maxFocus) {
        maxFocus = sessTotal;
      }

      const start = toMs(sess.start_time_utc);
      if (start > 0 && start < minStartMs) {
        minStartMs = start;
      }

      // If session is completed or has end_time_utc, use it; if in_progress, use current time
      const end = sess.end_time_utc
        ? toMs(sess.end_time_utc)
        : sess.status === 'in_progress'
        ? Date.now()
        : start + sessTotal * 1000;
      if (end > maxEndMs) {
        maxEndMs = end;
      }
    }

    // Align with live total study time today if higher
    if (isToday && liveSecondsToday > totalFocus) {
      totalFocus = liveSecondsToday;
    }

    if (isToday && isRunning) {
      maxEndMs = Math.max(maxEndMs, Date.now());
    }

    const hasStudy = totalFocus > 0;

    return {
      totalFocus,
      allowedUsage,
      maxFocus,
      startTimeStr: hasStudy && minStartMs !== Infinity ? formatAmPm(minStartMs) : '-',
      endTimeStr: hasStudy && maxEndMs > 0 ? (isRunning && isToday ? `${formatAmPm(maxEndMs)} (Live)` : formatAmPm(maxEndMs)) : '-',
      hasStudy,
      minStartMs: minStartMs === Infinity ? 0 : minStartMs,
      maxEndMs,
    };
  }, [daySessions, liveSecondsToday, isToday, isRunning]);

  return (
    <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 space-y-6 shadow-sm">
      {/* Title with Date */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <h2 className="font-serif text-base sm:text-lg font-medium text-slate-200 tracking-widest uppercase">
          {formattedTitle}
        </h2>
        {metrics.hasStudy && metrics.startTimeStr !== '-' && metrics.endTimeStr !== '-' && (
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-cyan-300">
            {metrics.startTimeStr} ~ {metrics.endTimeStr}
          </span>
        )}
      </div>

      {/* Two-Column Clean Metrics Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column: Total Study Time & Start Time */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-[#38bdf8] block mb-1.5 font-medium">
              Total study time
            </span>
            <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
              {formatSeconds(metrics.totalFocus)}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              (Allowed Apps {formatSeconds(metrics.allowedUsage)})
            </p>
          </div>

          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-slate-400 block mb-1 font-medium">
              Start time
            </span>
            <div className="font-serif text-xl sm:text-2xl text-slate-200 tabular-nums">
              {metrics.startTimeStr}
            </div>
          </div>
        </div>

        {/* Right Column: Max Focus Time & End Time */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-[#38bdf8] block mb-1.5 font-medium">
              Max focus time
            </span>
            <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
              {formatSeconds(metrics.maxFocus)}
            </div>
          </div>

          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-slate-400 block mb-1 font-medium">
              End time
            </span>
            <div className="font-serif text-xl sm:text-2xl text-slate-200 tabular-nums">
              {metrics.endTimeStr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
