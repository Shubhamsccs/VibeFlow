import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { StudySession, Subject } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';
import { useTimerStore } from '../../../store/useTimerStore';

interface WeekDashboardProps {
  sessions: StudySession[];
  subjects: Subject[];
  dayOffs: string[];
  todayLogicalDate: string;
  totalSecondsToday: number;
}

/**
 * Largest Remainder Method (Hamilton method)
 * Guarantees that rounded percentage values sum to exactly 100%.
 */
function computePercentages(items: { sec: number }[], totalSec: number): number[] {
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

const formatHourMin = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

export const WeekDashboard: React.FC<WeekDashboardProps> = ({
  sessions,
  subjects,
  dayOffs,
  todayLogicalDate,
  totalSecondsToday,
}) => {
  // Navigation: Base date anchor for week (defaults to today)
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(() => new Date());
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);

  // Subject lookup map
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
    }
    return map;
  }, [subjects]);

  // Navigate between weeks (past, current, future)
  const handlePrevWeek = () => {
    const prev = new Date(weekAnchorDate);
    prev.setDate(prev.getDate() - 7);
    setWeekAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(weekAnchorDate);
    next.setDate(next.getDate() + 7);
    setWeekAnchorDate(next);
  };

  const handleResetToCurrentWeek = () => {
    setWeekAnchorDate(new Date());
  };

  // Compute Monday to Sunday dates of the selected week
  const weekInfo = useMemo(() => {
    const d = new Date(weekAnchorDate);
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    mon.setHours(0, 0, 0, 0);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const days: {
      dateStr: string;
      displayDate: string;
      dayName: string;
      isToday: boolean;
      isOff: boolean;
    }[] = [];
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(mon);
      cur.setDate(mon.getDate() + i);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dt = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dt}`;

      days.push({
        dateStr,
        displayDate: `${cur.getMonth() + 1}/${cur.getDate()}`,
        dayName: dayNames[i],
        isToday: dateStr === todayLogicalDate,
        isOff: dayOffs.includes(dateStr),
      });
    }

    // Week number calculation
    const tempDate = new Date(mon.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    const weekNumber = Math.round(
      ((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    ) + 1;

    const formatShort = (dt: Date) =>
      `${dt.toLocaleDateString('en-US', { month: 'short' })} ${dt.getDate()}`;
    const rangeLabel = `${formatShort(mon)} - ${formatShort(sun)}, ${sun.getFullYear()}`;

    // Check if the current week view contains today
    const isCurrentWeek = days.some((d) => d.isToday);

    return { mon, sun, days, rangeLabel, weekNumber, isCurrentWeek };
  }, [weekAnchorDate, todayLogicalDate, dayOffs]);

  // Aggregate daily records and subject breakdown for this week
  const weekData = useMemo(() => {
    const weekDates = new Set(weekInfo.days.map((d) => d.dateStr));
    const dailyMap: Record<string, { totalSec: number; bySubject: Record<string, number> }> = {};
    for (const d of weekInfo.days) {
      dailyMap[d.dateStr] = { totalSec: 0, bySubject: {} };
    }

    let weekAllowedSec = 0;
    const weekSubjectSecMap: Record<string, number> = {};

    for (const sess of sessions) {
      if (sess.status === 'completed' || sess.status === 'in_progress') {
        const dStr = sess.logical_date;
        if (dStr && weekDates.has(dStr)) {
          const focus = sess.pure_focus_sec || 0;
          const allowed = sess.allowed_usage_sec || 0;
          const sessSec = focus + allowed;

          if (sessSec > 0) {
            dailyMap[dStr].totalSec += sessSec;
            dailyMap[dStr].bySubject[sess.subject_id] =
              (dailyMap[dStr].bySubject[sess.subject_id] || 0) + sessSec;
            weekSubjectSecMap[sess.subject_id] =
              (weekSubjectSecMap[sess.subject_id] || 0) + sessSec;
            weekAllowedSec += allowed;
          }
        }
      }
    }

    // Build day points
    const dayBars = weekInfo.days.map((d) => {
      const rec = dailyMap[d.dateStr];
      return {
        ...d,
        totalSec: rec.totalSec,
        bySubject: rec.bySubject,
      };
    });

    const maxDaySec = Math.max(1, ...dayBars.map((d) => d.totalSec));
    const totalWeekSec = dayBars.reduce((sum, d) => sum + d.totalSec, 0);

    // Active days count & daily average
    const activeDaysCount = dayBars.filter((d) => d.totalSec > 0).length;
    const dailyAverageSec = activeDaysCount > 0 ? Math.round(totalWeekSec / activeDaysCount) : 0;

    // Weekday (Mon-Fri) vs Weekend (Sat-Sun) breakdown
    const weekdaySec = dayBars.slice(0, 5).reduce((sum, d) => sum + d.totalSec, 0);
    const weekendSec = dayBars.slice(5, 7).reduce((sum, d) => sum + d.totalSec, 0);
    const weekdayPct = totalWeekSec > 0 ? Math.round((weekdaySec / totalWeekSec) * 100) : 0;
    const weekendPct = totalWeekSec > 0 ? 100 - weekdayPct : 0;

    // Best productive day
    let bestDay = dayBars[0];
    for (const d of dayBars) {
      if (d.totalSec > bestDay.totalSec) {
        bestDay = d;
      }
    }

    // Subject breakdown for donut
    const subjectItemsRaw = Object.entries(weekSubjectSecMap)
      .filter(([_, sec]) => sec > 0)
      .map(([id, sec]) => {
        const subj = subjectMap.get(id);
        const name = subj ? subj.name : 'Study';
        const color = subj?.color_hex || '#38bdf8';
        return { id, name, color, sec };
      })
      .sort((a, b) => b.sec - a.sec);

    const pcts = computePercentages(subjectItemsRaw, totalWeekSec);
    const subjectBreakdown = subjectItemsRaw.map((item, idx) => ({
      ...item,
      pct: pcts[idx] || 0,
    }));

    return {
      dayBars,
      maxDaySec,
      totalWeekSec,
      weekAllowedSec,
      activeDaysCount,
      dailyAverageSec,
      weekdaySec,
      weekendSec,
      weekdayPct,
      weekendPct,
      bestDay: bestDay.totalSec > 0 ? bestDay : null,
      subjectBreakdown,
    };
  }, [
    weekInfo,
    sessions,
    subjects,
    subjectMap,
  ]);

  const activeHoverItem = useMemo(() => {
    if (!hoveredSubjectId) return null;
    return weekData.subjectBreakdown.find((item) => item.id === hoveredSubjectId) || null;
  }, [hoveredSubjectId, weekData.subjectBreakdown]);

  const dominantItem = weekData.subjectBreakdown[0] || null;

  return (
    <div className="space-y-6">
      {/* 1. Week Navigation & Time Range Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/5 rounded-xl p-1">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Week (View Future Logs)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
                {weekInfo.rangeLabel}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold">
                Week {weekInfo.weekNumber}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Weekly focus statistics and performance patterns
            </p>
          </div>
        </div>

        {!weekInfo.isCurrentWeek && (
          <button
            onClick={handleResetToCurrentWeek}
            className="self-start sm:self-auto text-xs font-serif uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Jump to This Week
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Weekly Time */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-[#38bdf8] font-medium block">
            Total focus time
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {formatSeconds(weekData.totalWeekSec)}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Allowed Apps: {formatSeconds(weekData.weekAllowedSec)}
          </p>
        </div>

        {/* Daily Average */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-emerald-400 font-medium block">
            Daily average
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {formatSeconds(weekData.dailyAverageSec)}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Across {weekData.activeDaysCount} active study days
          </p>
        </div>

        {/* Most Productive Day */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-amber-400 font-medium block">
            Peak study day
          </span>
          <div className="font-serif text-2xl sm:text-3xl text-white font-normal truncate">
            {weekData.bestDay ? weekData.bestDay.dayName : 'None'}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            {weekData.bestDay ? formatHourMin(weekData.bestDay.totalSec) : 'No sessions'}
          </p>
        </div>

        {/* Weekly Consistency */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-purple-400 font-medium block">
            Active consistency
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {weekData.activeDaysCount} / 7
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {weekData.dayBars.map((d) => (
              <span
                key={d.dateStr}
                title={`${d.dayName}: ${d.totalSec > 0 ? formatHourMin(d.totalSec) : '0h'}`}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  d.totalSec > 0
                    ? 'bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]'
                    : d.isOff
                    ? 'bg-amber-400/80'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Hero Section: Mon - Sun Multi-Subject Stacked Bar Chart */}
      <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
          <div>
            <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
              Daily Focus Breakdown (Mon – Sun)
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Subject distribution across every day of this week
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-cyan-300">
            Daily max: {formatHourMin(weekData.maxDaySec)}
          </span>
        </div>

        {weekData.totalWeekSec === 0 ? (
          <div className="py-16 text-center text-xs font-serif text-slate-500">
            No study sessions recorded for this week.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 border-b border-white/10 pb-2">
              {weekData.dayBars.map((day) => {
                const heightPct =
                  weekData.maxDaySec > 0
                    ? Math.min(100, Math.round((day.totalSec / weekData.maxDaySec) * 100))
                    : 0;

                const isBest = weekData.bestDay?.dateStr === day.dateStr;

                return (
                  <div
                    key={day.dateStr}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl">
                      <span className="text-cyan-300 font-semibold">{day.dayName} ({day.displayDate})</span>: {formatHourMin(day.totalSec)}
                    </div>

                    {/* Top Duration Label */}
                    {day.totalSec > 0 && (
                      <span
                        className={`text-[10px] font-mono mb-2 transition-opacity ${
                          isBest ? 'text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {formatHourMin(day.totalSec)}
                      </span>
                    )}

                    {/* Multi-Subject Stacked Bar */}
                    <div
                      className={`w-full max-w-[48px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:brightness-110 shadow-sm ${
                        isBest ? 'ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]' : ''
                      }`}
                      style={{
                        height: `${Math.max(heightPct, day.totalSec > 0 ? 6 : 2)}%`,
                        backgroundColor: day.totalSec > 0 ? '#1e293b' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {Object.entries(day.bySubject).map(([subId, subSec]) => {
                        if (subSec <= 0 || day.totalSec <= 0) return null;
                        const segPct = (subSec / day.totalSec) * 100;
                        const subjObj = subjects.find((s) => s.id === subId);
                        const color = subjObj?.color_hex || '#38bdf8';
                        return (
                          <div
                            key={subId}
                            style={{
                              height: `${segPct}%`,
                              backgroundColor: color,
                            }}
                            className="w-full transition-all"
                            title={`${subjObj?.name || 'Subject'}: ${formatHourMin(subSec)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weekday Axis Labels */}
            <div className="flex justify-between text-xs font-serif text-slate-400 uppercase tracking-wider">
              {weekData.dayBars.map((day) => (
                <div key={day.dateStr} className="flex-1 text-center">
                  <span
                    className={`block font-semibold ${
                      day.isToday ? 'text-cyan-400' : 'text-slate-300'
                    }`}
                  >
                    {day.dayName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {day.displayDate}
                  </span>
                </div>
              ))}
            </div>

            {/* Subject Color Legend Swatches */}
            {subjects.length > 0 && (
              <div className="flex items-center gap-4 pt-3 flex-wrap text-xs font-serif border-t border-white/5">
                {subjects.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color_hex }} />
                    <span className="truncate max-w-[120px]">{s.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Lower Grid: Subject Breakdown Donut & Weekday vs Weekend Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 cols): Subject Distribution Donut & Ranking */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                Weekly Subject Ratio
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Proportion of focus time allocated to each subject
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {weekData.subjectBreakdown.length} {weekData.subjectBreakdown.length === 1 ? 'subject' : 'subjects'}
            </span>
          </div>

          {weekData.subjectBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs font-serif text-slate-500">
              No subject study time recorded for this week.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 flex-1 py-2">
              {/* Donut Chart (Hover disabled on SVG, legend driven) */}
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
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
                    return weekData.subjectBreakdown.map((item) => {
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
                <div className="absolute w-26 h-26 rounded-full bg-[#0f1015] border border-white/5 flex flex-col items-center justify-center text-center p-2 pointer-events-none shadow-inner">
                  <span className="font-serif text-2xl font-bold text-white tabular-nums tracking-tight">
                    {activeHoverItem ? `${activeHoverItem.pct}%` : `${dominantItem?.pct || 0}%`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px] uppercase mt-0.5">
                    {activeHoverItem ? activeHoverItem.name : dominantItem?.name || ''}
                  </span>
                </div>
              </div>

              {/* Legend List (Drives Hover State) */}
              <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {weekData.subjectBreakdown.map((item) => (
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
          )}
        </div>

        {/* Right (5 cols): Weekday vs Weekend Comparison Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm flex flex-col justify-between space-y-6">
          <div className="pb-3 border-b border-white/5">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Weekday vs. Weekend
            </h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Focus intensity distribution throughout the week
            </p>
          </div>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {/* Weekday Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif text-slate-300 uppercase tracking-wider">
                  Weekdays (Mon - Fri)
                </span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {formatSeconds(weekData.weekdaySec)}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${weekData.weekdayPct}%`,
                  }}
                />
              </div>
            </div>

            {/* Weekend Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif text-slate-300 uppercase tracking-wider">
                  Weekend (Sat - Sun)
                </span>
                <span className="font-mono text-purple-300 font-semibold">
                  {formatSeconds(weekData.weekendSec)}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${weekData.weekendPct}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Weekday Share: {weekData.weekdayPct}%
            </span>
            <span>
              Weekend Share: {weekData.weekendPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
