import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp,
  BarChart2,
  Award,
} from 'lucide-react';
import { StudySession, Subject } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';
import { useTimerStore } from '../../../store/useTimerStore';

interface MonthDashboardProps {
  sessions: StudySession[];
  subjects: Subject[];
  dayOffs: string[];
  todayLogicalDate: string;
  totalSecondsToday: number;
}

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

export const MonthDashboard: React.FC<MonthDashboardProps> = ({
  sessions,
  subjects,
  dayOffs,
  todayLogicalDate,
  totalSecondsToday,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
    }
    return map;
  }, [subjects]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleResetToCurrentMonth = () => {
    setCurrentMonthDate(new Date());
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month;
  }, [year, month]);

  const monthLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonthDate]);

  // Aggregate monthly data
  const monthData = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map each day of the month 1..daysInMonth
    const dailyMap: Record<string, { totalSec: number; bySubject: Record<string, number> }> = {};
    const daysList: {
      dateStr: string;
      dayNum: number;
      isToday: boolean;
      isOff: boolean;
    }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      dailyMap[dStr] = { totalSec: 0, bySubject: {} };
      daysList.push({
        dateStr: dStr,
        dayNum: d,
        isToday: dStr === todayLogicalDate,
        isOff: dayOffs.includes(dStr),
      });
    }

    let totalMonthAllowedSec = 0;
    const monthSubjectSecMap: Record<string, number> = {};

    for (const sess of sessions) {
      if (sess.status === 'completed' || sess.status === 'in_progress') {
        const dStr = sess.logical_date;
        if (dStr && dStr.startsWith(monthPrefix) && dailyMap[dStr]) {
          const focus = sess.pure_focus_sec || 0;
          const allowed = sess.allowed_usage_sec || 0;
          const sessSec = focus + allowed;

          if (sessSec > 0) {
            dailyMap[dStr].totalSec += sessSec;
            dailyMap[dStr].bySubject[sess.subject_id] =
              (dailyMap[dStr].bySubject[sess.subject_id] || 0) + sessSec;
            monthSubjectSecMap[sess.subject_id] =
              (monthSubjectSecMap[sess.subject_id] || 0) + sessSec;
            totalMonthAllowedSec += allowed;
          }
        }
      }
    }

    // Form daily bars
    const dailyBars = daysList.map((d) => ({
      ...d,
      totalSec: dailyMap[d.dateStr].totalSec,
      bySubject: dailyMap[d.dateStr].bySubject,
    }));

    const totalMonthSec = dailyBars.reduce((sum, d) => sum + d.totalSec, 0);
    const maxDaySec = Math.max(1, ...dailyBars.map((d) => d.totalSec));
    const activeDaysCount = dailyBars.filter((d) => d.totalSec > 0).length;
    const dailyAverageSec = activeDaysCount > 0 ? Math.round(totalMonthSec / activeDaysCount) : 0;

    // Group into 4-5 weeks of the month (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-end)
    const weeks: { label: string; range: string; totalSec: number; bySubject: Record<string, number> }[] = [];
    const weekRanges = [
      { label: 'W1', start: 1, end: 7 },
      { label: 'W2', start: 8, end: 14 },
      { label: 'W3', start: 15, end: 21 },
      { label: 'W4', start: 22, end: 28 },
      { label: 'W5', start: 29, end: daysInMonth },
    ];

    for (const wr of weekRanges) {
      if (wr.start <= daysInMonth) {
        const actualEnd = Math.min(wr.end, daysInMonth);
        let wTotal = 0;
        const wBySubj: Record<string, number> = {};

        for (let day = wr.start; day <= actualEnd; day++) {
          const dStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
          const rec = dailyMap[dStr];
          if (rec) {
            wTotal += rec.totalSec;
            for (const [subId, sSec] of Object.entries(rec.bySubject)) {
              wBySubj[subId] = (wBySubj[subId] || 0) + sSec;
            }
          }
        }

        weeks.push({
          label: wr.label,
          range: `${month + 1}/${wr.start} - ${month + 1}/${actualEnd}`,
          totalSec: wTotal,
          bySubject: wBySubj,
        });
      }
    }

    const maxWeekSec = Math.max(1, ...weeks.map((w) => w.totalSec));

    // Best week
    let bestWeek = weeks[0];
    for (const w of weeks) {
      if (w.totalSec > bestWeek.totalSec) {
        bestWeek = w;
      }
    }

    // Subject breakdown
    const subjectItemsRaw = Object.entries(monthSubjectSecMap)
      .filter(([_, sec]) => sec > 0)
      .map(([id, sec]) => {
        const subj = subjectMap.get(id);
        const name = subj ? subj.name : 'Study';
        const color = subj?.color_hex || '#38bdf8';
        return { id, name, color, sec };
      })
      .sort((a, b) => b.sec - a.sec);

    const pcts = computePercentages(subjectItemsRaw, totalMonthSec);
    const subjectBreakdown = subjectItemsRaw.map((item, idx) => ({
      ...item,
      pct: pcts[idx] || 0,
    }));

    return {
      dailyBars,
      totalMonthSec,
      totalMonthAllowedSec,
      maxDaySec,
      activeDaysCount,
      dailyAverageSec,
      weeks,
      maxWeekSec,
      bestWeek: bestWeek.totalSec > 0 ? bestWeek : null,
      subjectBreakdown,
      daysInMonth,
    };
  }, [
    year,
    month,
    sessions,
    subjects,
    subjectMap,
    dayOffs,
    todayLogicalDate,
  ]);

  const activeHoverItem = useMemo(() => {
    if (!hoveredSubjectId) return null;
    return monthData.subjectBreakdown.find((item) => item.id === hoveredSubjectId) || null;
  }, [hoveredSubjectId, monthData.subjectBreakdown]);

  const dominantItem = monthData.subjectBreakdown[0] || null;

  return (
    <div className="space-y-6">
      {/* 1. Month Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/5 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Month (View Future Logs)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
              {monthLabel}
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Monthly overview, weekly progress, and day-by-day distribution
            </p>
          </div>
        </div>

        {!isCurrentMonth && (
          <button
            onClick={handleResetToCurrentMonth}
            className="self-start sm:self-auto text-xs font-serif uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Jump to This Month
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Time */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-[#38bdf8] font-medium block">
            Total focus time
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {formatSeconds(monthData.totalMonthSec)}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Allowed Apps: {formatSeconds(monthData.totalMonthAllowedSec)}
          </p>
        </div>

        {/* Daily Average */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-emerald-400 font-medium block">
            Daily average
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {formatSeconds(monthData.dailyAverageSec)}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Across {monthData.activeDaysCount} active days
          </p>
        </div>

        {/* Best Week */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-amber-400 font-medium block">
            Peak week
          </span>
          <div className="font-serif text-2xl sm:text-3xl text-white font-normal truncate">
            {monthData.bestWeek ? `${monthData.bestWeek.label}` : 'None'}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            {monthData.bestWeek ? `${formatHourMin(monthData.bestWeek.totalSec)} (${monthData.bestWeek.range})` : 'No records'}
          </p>
        </div>

        {/* Active Days */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-purple-400 font-medium block">
            Active days
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {monthData.activeDaysCount} / {monthData.daysInMonth}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            {Math.round((monthData.activeDaysCount / monthData.daysInMonth) * 100)}% monthly consistency
          </p>
        </div>
      </div>

      {/* 3. Section: Weekly Progression in Month (Stacked Bars) */}
      <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
              Weekly Progression in Month
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Focus hours accumulated across each week of {monthLabel}
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300 px-3 py-1 rounded-full bg-slate-900 border border-white/10">
            Weekly Max: {formatHourMin(monthData.maxWeekSec)}
          </span>
        </div>

        {monthData.totalMonthSec === 0 ? (
          <div className="py-12 text-center text-xs font-serif text-slate-500">
            No study sessions recorded for this month.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-48 flex items-end justify-between gap-4 sm:gap-8 border-b border-white/10 pb-2">
              {monthData.weeks.map((week) => {
                const heightPct =
                  monthData.maxWeekSec > 0
                    ? Math.min(100, Math.round((week.totalSec / monthData.maxWeekSec) * 100))
                    : 0;

                const isBest = monthData.bestWeek?.label === week.label;

                return (
                  <div
                    key={week.label}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl">
                      <span className="text-cyan-300 font-semibold">{week.label} ({week.range})</span>: {formatHourMin(week.totalSec)}
                    </div>

                    {week.totalSec > 0 && (
                      <span
                        className={`text-[10px] font-mono mb-2 transition-opacity ${
                          isBest ? 'text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {formatHourMin(week.totalSec)}
                      </span>
                    )}

                    <div
                      className={`w-full max-w-[56px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:brightness-110 shadow-sm ${
                        isBest ? 'ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]' : ''
                      }`}
                      style={{
                        height: `${Math.max(heightPct, week.totalSec > 0 ? 6 : 2)}%`,
                        backgroundColor: week.totalSec > 0 ? '#1e293b' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {Object.entries(week.bySubject).map(([subId, subSec]) => {
                        if (subSec <= 0 || week.totalSec <= 0) return null;
                        const segPct = (subSec / week.totalSec) * 100;
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

            <div className="flex justify-between text-xs font-serif text-slate-400 uppercase tracking-wider">
              {monthData.weeks.map((week) => (
                <div key={week.label} className="flex-1 text-center">
                  <span className="block font-semibold text-slate-200">{week.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 block">{week.range}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Section: Daily Focus Strip for the Whole Month (All days 1..31) */}
      <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Daily Focus Timeline (Day 1 – {monthData.daysInMonth})
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Daily study distribution across all calendar days of this month
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {monthData.activeDaysCount} days studied
          </span>
        </div>

        <div className="pt-2">
          {/* Daily micro-bar strip */}
          <div className="h-32 flex items-end justify-between gap-1 border-b border-white/10 pb-1">
            {monthData.dailyBars.map((d) => {
              const heightPct =
                monthData.maxDaySec > 0
                  ? Math.min(100, Math.round((d.totalSec / monthData.maxDaySec) * 100))
                  : 0;

              return (
                <div
                  key={d.dateStr}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-white/15 px-2 py-0.5 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl">
                    Day {d.dayNum}: {d.totalSec > 0 ? formatHourMin(d.totalSec) : d.isOff ? 'Day Off' : 'No records'}
                  </div>

                  <div
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      d.totalSec > 0
                        ? d.isToday
                          ? 'bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                          : 'bg-cyan-600/80 group-hover:bg-cyan-400'
                        : d.isOff
                        ? 'bg-amber-500/40'
                        : 'bg-slate-800/40'
                    }`}
                    style={{
                      height: `${Math.max(heightPct, d.totalSec > 0 ? 8 : d.isOff ? 5 : 2)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1.5">
            <span>1</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
            <span>25</span>
            <span>{monthData.daysInMonth}</span>
          </div>
        </div>
      </div>

      {/* 5. Lower Grid: Subject Breakdown Donut & Share Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Donut Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                Monthly Subject Ratio
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Total hours and percentage share for each subject
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {monthData.subjectBreakdown.length} {monthData.subjectBreakdown.length === 1 ? 'subject' : 'subjects'}
            </span>
          </div>

          {monthData.subjectBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs font-serif text-slate-500">
              No subject study time recorded for this month.
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
                    return monthData.subjectBreakdown.map((item) => {
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

              {/* Legend List */}
              <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {monthData.subjectBreakdown.map((item) => (
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

        {/* Right: Monthly Highlights (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm flex flex-col justify-between space-y-6">
          <div className="pb-3 border-b border-white/5">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Monthly Highlights
            </h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Key performance milestones for this month
            </p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-serif text-slate-300 block font-medium">Top Subject</span>
                <span className="text-xs font-mono text-slate-400">
                  {dominantItem ? dominantItem.name : 'None'}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-cyan-300">
                {dominantItem ? `${dominantItem.pct}% (${formatHourMin(dominantItem.sec)})` : '0h'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-serif text-slate-300 block font-medium">Peak Week</span>
                <span className="text-xs font-mono text-slate-400">
                  {monthData.bestWeek ? `${monthData.bestWeek.label} (${monthData.bestWeek.range})` : 'None'}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-amber-300">
                {monthData.bestWeek ? formatHourMin(monthData.bestWeek.totalSec) : '0h'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-serif text-slate-300 block font-medium">Days Studied Ratio</span>
                <span className="text-xs font-mono text-slate-400">
                  {monthData.activeDaysCount} of {monthData.daysInMonth} calendar days
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-300">
                {Math.round((monthData.activeDaysCount / monthData.daysInMonth) * 100)}%
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500 text-center">
            {monthLabel} • Generated from verified session logs
          </div>
        </div>
      </div>
    </div>
  );
};
