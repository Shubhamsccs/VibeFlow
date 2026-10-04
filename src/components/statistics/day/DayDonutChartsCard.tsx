import React, { useState, useMemo } from 'react';
import { StudySession, Subject } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';
import { useTimerStore } from '../../../store/useTimerStore';
import { Coffee } from 'lucide-react';

interface DayDonutChartsCardProps {
  daySessions: StudySession[];
  subjects: Subject[];
  liveSecondsToday: number;
  isToday: boolean;
  selectedDateStr?: string;
}

/**
 * Largest Remainder Method (Hamilton method)
 * Guarantees that rounded percentage values sum to exactly 100% with no rounding discrepancy.
 */
function computeAccuratePercentages(items: { sec: number }[], totalSec: number): number[] {
  if (totalSec <= 0 || items.length === 0) return items.map(() => 0);

  const rawPcts = items.map((item) => (item.sec / totalSec) * 100);
  const floorPcts = rawPcts.map(Math.floor);
  let remainder = 100 - floorPcts.reduce((a, b) => a + b, 0);

  const indexedDecimals = rawPcts
    .map((raw, idx) => ({ idx, decimal: raw - floorPcts[idx] }))
    .sort((a, b) => b.decimal - a.decimal);

  for (let i = 0; i < remainder && i < indexedDecimals.length; i++) {
    floorPcts[indexedDecimals[i].idx] += 1;
  }

  return floorPcts;
}

export const DayDonutChartsCard: React.FC<DayDonutChartsCardProps> = ({
  daySessions,
  subjects,
  liveSecondsToday,
  isToday,
}) => {
  const isRunning = useTimerStore((state) => state.isRunning);
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<'study' | 'other' | null>(null);

  // Map subjects by ID for instant color & name lookup
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
    }
    return map;
  }, [subjects]);

  // Safe timestamp to ms converter
  const toMs = (ts: number | null | undefined): number => {
    if (!ts) return 0;
    return ts < 1e11 ? ts * 1000 : ts;
  };

  // 12-hour AM/PM formatter e.g. "AM 11:02" or "PM 1:15"
  const formatAmPm = (ms: number): string => {
    if (!ms) return '-';
    const d = new Date(ms);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${ampm} ${h12}:${String(minutes).padStart(2, '0')}`;
  };

  // Filter and sort valid sessions for timing calculations
  const sortedSessions = useMemo(() => {
    return daySessions
      .filter((s) => s.status === 'completed' || s.status === 'in_progress')
      .map((s) => {
        const startMs = toMs(s.start_time_utc);
        const focusSec = (s.pure_focus_sec || 0) + (s.allowed_usage_sec || 0);
        const endMs = s.end_time_utc
          ? toMs(s.end_time_utc)
          : s.status === 'in_progress'
          ? Date.now()
          : startMs + focusSec * 1000;
        return { session: s, startMs, endMs, focusSec };
      })
      .filter((s) => s.focusSec > 0 && s.startMs > 0)
      .sort((a, b) => a.startMs - b.startMs);
  }, [daySessions]);

  // Session Window (Start Time ~ End Time)
  const timingInfo = useMemo(() => {
    let minStartMs = Infinity;
    let maxEndMs = 0;
    let totalSec = 0;

    for (const sess of sortedSessions) {
      totalSec += sess.focusSec;
      if (sess.startMs < minStartMs) minStartMs = sess.startMs;
      if (sess.endMs > maxEndMs) maxEndMs = sess.endMs;
    }

    if (isToday && isRunning) {
      maxEndMs = Math.max(maxEndMs, Date.now());
      if (minStartMs === Infinity) {
        minStartMs = Date.now();
      }
    }

    const hasData = totalSec > 0 && minStartMs !== Infinity;
    const startStr = hasData ? formatAmPm(minStartMs) : '-';
    const endStr =
      hasData && maxEndMs > 0
        ? isRunning && isToday
          ? `${formatAmPm(maxEndMs)} (Live)`
          : formatAmPm(maxEndMs)
        : '-';

    return { hasData, startStr, endStr, totalSec };
  }, [sortedSessions, isToday, isRunning]);

  // Donut 1: Subject Breakdown
  const subjectBreakdown = useMemo(() => {
    const secMap: Record<string, number> = {};
    let totalSec = 0;

    for (const sess of sortedSessions) {
      secMap[sess.session.subject_id] = (secMap[sess.session.subject_id] || 0) + sess.focusSec;
      totalSec += sess.focusSec;
    }

    const itemsRaw = Object.entries(secMap)
      .filter(([_, sec]) => sec > 0)
      .map(([id, sec]) => {
        const subj = subjectMap.get(id);
        const name = subj ? subj.name : 'Study';
        const color = subj?.color_hex || '#38bdf8';
        return { id, name, color, sec };
      });

    itemsRaw.sort((a, b) => b.sec - a.sec);
    const pcts = computeAccuratePercentages(itemsRaw, totalSec);

    const items = itemsRaw.map((item, idx) => ({
      ...item,
      pct: pcts[idx] || 0,
    }));

    return { items, totalSec };
  }, [sortedSessions, subjectMap]);

  // Donut 2: Study vs Other (Other = gap between previous task end time and current task start time + diverted time)
  const categoryRatio = useMemo(() => {
    const studySec = subjectBreakdown.totalSec;

    // Calculate gap between end time of previous task and start time of current task (merging intervals)
    let gapSec = 0;
    if (sortedSessions.length > 1) {
      let latestEndMs = sortedSessions[0].endMs;
      for (let i = 1; i < sortedSessions.length; i++) {
        const curr = sortedSessions[i];
        if (curr.startMs > latestEndMs) {
          gapSec += Math.round((curr.startMs - latestEndMs) / 1000);
        }
        latestEndMs = Math.max(latestEndMs, curr.endMs);
      }
    }

    // Diverted / distracted time during sessions is also counted under "Other/Breaks"
    const divertedSec = daySessions.reduce((acc, s) => acc + (s.diverted_sec || 0), 0);
    const otherSec = gapSec + divertedSec;

    const totalSpan = studySec + otherSec;

    if (totalSpan <= 0) {
      return {
        studySec: 0,
        otherSec: 0,
        studyPct: 100,
        otherPct: 0,
        hasData: false,
      };
    }

    const studyPct = otherSec === 0 ? 100 : Math.round((studySec / totalSpan) * 100);
    const otherPct = Math.max(0, 100 - studyPct);

    return {
      studySec,
      otherSec,
      studyPct,
      otherPct,
      hasData: true,
    };
  }, [sortedSessions, subjectBreakdown.totalSec, daySessions]);

  const activeHoverItem = useMemo(() => {
    if (!hoveredSubjectId) return null;
    return subjectBreakdown.items.find((item) => item.id === hoveredSubjectId) || null;
  }, [hoveredSubjectId, subjectBreakdown.items]);

  const dominantItem = subjectBreakdown.items[0] || null;

  return (
    <div className="p-6 lg:p-7 rounded-2xl bg-[#0f1015] border border-white/5 space-y-6 shadow-sm flex flex-col justify-between flex-1 min-h-[500px]">
      {/* Header: Title & Accurate Start / Ending Time Window */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
        <div>
          <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
            Study & Rest Distribution
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Subject breakdown and study vs. task break ratio
          </p>
        </div>

        {timingInfo.hasData && timingInfo.startStr !== '-' && timingInfo.endStr !== '-' && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-serif uppercase tracking-widest text-slate-400">
              Session Window:
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-cyan-300 font-medium">
              {timingInfo.startStr} ~ {timingInfo.endStr}
            </span>
          </div>
        )}
      </div>

      {subjectBreakdown.items.length === 0 ? (
        <div className="py-20 flex-1 flex flex-col items-center justify-center text-center text-xs font-serif text-slate-500">
          <Coffee className="w-8 h-8 text-slate-700 mb-3 opacity-60" />
          <p className="font-medium text-slate-400">No subject study time recorded for this date.</p>
          <p className="text-[11px] font-mono text-slate-600 mt-1 max-w-xs">
            Start the timer or use the manual logging card on the left to record your focus sessions.
          </p>
        </div>
      ) : (
        /* Responsive 2-Column Desktop Grid for Donut 1 (Subjects) & Donut 2 (Study vs Breaks) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
          
          {/* ==================== DONUT 1: SUBJECT BREAKDOWN ==================== */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/[0.015] border border-white/5 space-y-5 h-full">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-slate-300">
                By Subject
              </h4>
              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-white/5">
                {subjectBreakdown.items.length} {subjectBreakdown.items.length === 1 ? 'subject' : 'subjects'}
              </span>
            </div>

            {/* Donut Chart Centered */}
            <div className="flex items-center justify-center relative my-auto py-2">
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg
                  className="w-full h-full transform -rotate-90 filter drop-shadow-sm pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="14"
                  />
                  {(() => {
                    let accumulatedPct = 0;
                    return subjectBreakdown.items.map((item) => {
                      const isHovered = hoveredSubjectId === item.id;
                      const isAnyHovered = hoveredSubjectId !== null;
                      const opacity = isAnyHovered ? (isHovered ? 1 : 0.35) : 1;
                      const strokeWidth = isHovered ? 16 : 14;

                      const strokeDasharray = `${item.pct} ${100 - item.pct}`;
                      const strokeDashoffset = -accumulatedPct;
                      accumulatedPct += item.pct;

                      return (
                        <circle
                          key={item.id}
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth={strokeWidth}
                          pathLength={100}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          opacity={opacity}
                          className="transition-all duration-300"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Inner Cutout */}
                <div className="absolute w-24 h-24 rounded-full bg-[#0f1015] border border-white/5 flex flex-col items-center justify-center text-center p-2 pointer-events-none shadow-inner">
                  <span className="font-serif text-2xl font-bold text-white tabular-nums tracking-tight">
                    {activeHoverItem ? `${activeHoverItem.pct}%` : `${dominantItem?.pct || 100}%`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[75px] uppercase mt-0.5">
                    {activeHoverItem ? activeHoverItem.name : dominantItem?.name || 'Total'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Legend List (Full Width, Zero Overlap) */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {subjectBreakdown.items.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredSubjectId(item.id)}
                  onMouseLeave={() => setHoveredSubjectId(null)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    hoveredSubjectId === item.id
                      ? 'bg-white/10 border-white/20 shadow-sm'
                      : 'bg-slate-900/50 border-white/5 hover:bg-slate-900/80 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-serif uppercase tracking-wider text-slate-200 truncate font-semibold text-xs">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                    <span className="text-slate-300 font-medium tabular-nums">{formatSeconds(item.sec)}</span>
                    <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 text-[11px] tabular-nums">
                      {item.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== DONUT 2: STUDY VS OTHER (BREAKS) ==================== */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/[0.015] border border-white/5 space-y-5 h-full">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-slate-300">
                Study vs. Breaks
              </h4>
              <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-medium">
                Focus: {categoryRatio.studyPct}%
              </span>
            </div>

            {/* Donut Chart Centered */}
            <div className="flex items-center justify-center relative my-auto py-2">
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg
                  className="w-full h-full transform -rotate-90 filter drop-shadow-sm pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="14"
                  />

                  {/* Study Segment (Cyan) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke="#38bdf8"
                    strokeWidth={hoveredCategory === 'study' ? 16 : 14}
                    pathLength={100}
                    strokeDasharray={`${categoryRatio.studyPct} ${100 - categoryRatio.studyPct}`}
                    strokeDashoffset="0"
                    opacity={hoveredCategory ? (hoveredCategory === 'study' ? 1 : 0.35) : 1}
                    className="transition-all duration-300"
                  />

                  {/* Other Segment (Slate Grey) - gap between tasks */}
                  {categoryRatio.otherPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#64748b"
                      strokeWidth={hoveredCategory === 'other' ? 16 : 14}
                      pathLength={100}
                      strokeDasharray={`${categoryRatio.otherPct} ${100 - categoryRatio.otherPct}`}
                      strokeDashoffset={-categoryRatio.studyPct}
                      opacity={hoveredCategory ? (hoveredCategory === 'other' ? 1 : 0.35) : 1}
                      className="transition-all duration-300"
                    />
                  )}
                </svg>

                {/* Inner Cutout */}
                <div className="absolute w-24 h-24 rounded-full bg-[#0f1015] border border-white/5 flex flex-col items-center justify-center text-center p-2 pointer-events-none shadow-inner">
                  <span className="font-serif text-2xl font-bold text-white tabular-nums tracking-tight">
                    {hoveredCategory === 'study'
                      ? `${categoryRatio.studyPct}%`
                      : hoveredCategory === 'other'
                      ? `${categoryRatio.otherPct}%`
                      : `${categoryRatio.studyPct}%`}
                  </span>
                  <span className={`text-[10px] font-mono tracking-wider uppercase font-semibold mt-0.5 ${
                    hoveredCategory === 'other' ? 'text-slate-400' : 'text-cyan-400'
                  }`}>
                    {hoveredCategory === 'study'
                      ? 'Study'
                      : hoveredCategory === 'other'
                      ? 'Break'
                      : 'Focus'}
                  </span>
                </div>
              </div>
            </div>

            {/* Study vs Other Legend List (Full Width, Zero Overlap) */}
            <div className="space-y-2.5">
              <div
                onMouseEnter={() => setHoveredCategory('study')}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  hoveredCategory === 'study'
                    ? 'bg-white/10 border-white/20 shadow-sm'
                    : 'bg-slate-900/50 border-white/5 hover:bg-slate-900/80 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
                  <span className="font-serif uppercase tracking-wider text-slate-200 truncate font-semibold text-xs">
                    Study
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                  <span className="text-slate-300 font-medium tabular-nums">{formatSeconds(categoryRatio.studySec)}</span>
                  <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 text-[11px] tabular-nums">
                    {categoryRatio.studyPct}%
                  </span>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredCategory('other')}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  hoveredCategory === 'other'
                    ? 'bg-white/10 border-white/20 shadow-sm'
                    : 'bg-slate-900/50 border-white/5 hover:bg-slate-900/80 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#64748b] shrink-0" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-serif uppercase tracking-wider text-slate-200 truncate font-semibold text-xs">
                      Other
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Breaks)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                  <span className="text-slate-300 font-medium tabular-nums">{formatSeconds(categoryRatio.otherSec)}</span>
                  <span className="text-slate-400 font-semibold bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/5 text-[11px] tabular-nums">
                    {categoryRatio.otherPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
