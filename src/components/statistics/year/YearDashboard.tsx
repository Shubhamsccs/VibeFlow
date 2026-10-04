import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp,
  BarChart2,
  Award,
  Sparkles,
} from 'lucide-react';
import { StudySession, Subject } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';
import { useTimerStore } from '../../../store/useTimerStore';

interface YearDashboardProps {
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

export const YearDashboard: React.FC<YearDashboardProps> = ({
  sessions,
  subjects,
  dayOffs = [],
  todayLogicalDate,
  totalSecondsToday,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
    }
    return map;
  }, [subjects]);

  const currentYearNow = new Date().getFullYear();
  const isCurrentYear = selectedYear === currentYearNow;

  const handlePrevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  const handleResetToCurrentYear = () => {
    setSelectedYear(currentYearNow);
  };

  // 12 Months Data (Jan to Dec)
  const yearData = useMemo(() => {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthlyMap: Record<number, { totalSec: number; bySubject: Record<string, number> }> = {};

    for (let m = 0; m < 12; m++) {
      monthlyMap[m] = { totalSec: 0, bySubject: {} };
    }

    const yearPrefix = `${selectedYear}-`;
    let totalYearAllowedSec = 0;
    const yearSubjectSecMap: Record<string, number> = {};
    const activeDates = new Set<string>();

    for (const sess of sessions) {
      if (sess.status === 'completed' || sess.status === 'in_progress') {
        const dStr = sess.logical_date;
        if (dStr && dStr.startsWith(yearPrefix)) {
          const [_, mPart] = dStr.split('-');
          const mIndex = parseInt(mPart, 10) - 1;

          const focus = sess.pure_focus_sec || 0;
          const allowed = sess.allowed_usage_sec || 0;
          const sessSec = focus + allowed;

          if (sessSec > 0 && mIndex >= 0 && mIndex < 12) {
            monthlyMap[mIndex].totalSec += sessSec;
            monthlyMap[mIndex].bySubject[sess.subject_id] =
              (monthlyMap[mIndex].bySubject[sess.subject_id] || 0) + sessSec;
            yearSubjectSecMap[sess.subject_id] =
              (yearSubjectSecMap[sess.subject_id] || 0) + sessSec;
            totalYearAllowedSec += allowed;
            activeDates.add(dStr);
          }
        }
      }
    }

    // 12 Months Array
    const months = monthNames.map((name, index) => {
      const rec = monthlyMap[index];
      return {
        name,
        monthIndex: index,
        totalSec: rec.totalSec,
        bySubject: rec.bySubject,
        isCurrent: isCurrentYear && new Date().getMonth() === index,
      };
    });

    const totalYearSec = months.reduce((sum, m) => sum + m.totalSec, 0);
    const maxMonthSec = Math.max(1, ...months.map((m) => m.totalSec));
    const activeMonthsCount = months.filter((m) => m.totalSec > 0).length;
    const monthlyAverageSec = activeMonthsCount > 0 ? Math.round(totalYearSec / activeMonthsCount) : 0;

    // Best Month
    let bestMonth = months[0];
    for (const m of months) {
      if (m.totalSec > bestMonth.totalSec) {
        bestMonth = m;
      }
    }

    // Subject breakdown
    const subjectItemsRaw = Object.entries(yearSubjectSecMap)
      .filter(([_, sec]) => sec > 0)
      .map(([id, sec]) => {
        const subj = subjectMap.get(id);
        const name = subj ? subj.name : 'Study';
        const color = subj?.color_hex || '#38bdf8';
        return { id, name, color, sec };
      })
      .sort((a, b) => b.sec - a.sec);

    const pcts = computePercentages(subjectItemsRaw, totalYearSec);
    const subjectBreakdown = subjectItemsRaw.map((item, idx) => ({
      ...item,
      pct: pcts[idx] || 0,
    }));

    const yearDayOffsCount = dayOffs.filter((d) => d.startsWith(yearPrefix)).length;

    return {
      months,
      totalYearSec,
      totalYearAllowedSec,
      maxMonthSec,
      activeMonthsCount,
      monthlyAverageSec,
      bestMonth: bestMonth.totalSec > 0 ? bestMonth : null,
      activeDaysCount: activeDates.size,
      yearDayOffsCount,
      subjectBreakdown,
    };
  }, [
    selectedYear,
    sessions,
    subjects,
    subjectMap,
    dayOffs,
    isCurrentYear,
  ]);

  const activeHoverItem = useMemo(() => {
    if (!hoveredSubjectId) return null;
    return yearData.subjectBreakdown.find((item) => item.id === hoveredSubjectId) || null;
  }, [hoveredSubjectId, yearData.subjectBreakdown]);

  const dominantItem = yearData.subjectBreakdown[0] || null;

  return (
    <div className="space-y-6">
      {/* 1. Year Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/5 rounded-xl p-1">
            <button
              onClick={handlePrevYear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextYear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Year (View Future Logs)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
              Year {selectedYear}
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              12-month annual overview, peak study periods, and subject allocation
            </p>
          </div>
        </div>

        {!isCurrentYear && (
          <button
            onClick={handleResetToCurrentYear}
            className="self-start sm:self-auto text-xs font-serif uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Jump to {currentYearNow}
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Yearly Time */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-[#38bdf8] font-medium block">
            Annual focus time
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {formatSeconds(yearData.totalYearSec)}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Allowed Apps: {formatSeconds(yearData.totalYearAllowedSec)}
          </p>
        </div>

        {/* Monthly Average */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-emerald-400 font-medium block">
            Monthly average
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {formatSeconds(yearData.monthlyAverageSec)}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Across {yearData.activeMonthsCount} active months
          </p>
        </div>

        {/* Peak Month */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-amber-400 font-medium block">
            Peak month
          </span>
          <div className="font-serif text-2xl sm:text-3xl text-white font-normal truncate">
            {yearData.bestMonth ? yearData.bestMonth.name : 'None'}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            {yearData.bestMonth ? formatHourMin(yearData.bestMonth.totalSec) : 'No sessions'}
          </p>
        </div>

        {/* Total Days Studied */}
        <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-purple-400 font-medium block">
            Days active
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-white font-normal tabular-nums">
            {yearData.activeDaysCount} Days
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            {yearData.yearDayOffsCount > 0
              ? `${yearData.yearDayOffsCount} Days Off marked`
              : `Recorded in ${selectedYear}`}
          </p>
        </div>
      </div>

      {/* 3. Hero Section: 12-Month Multi-Subject Stacked Bar Chart */}
      <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
              12-Month Performance (Jan – Dec {selectedYear})
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Subject hours accumulated in each calendar month
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300 px-3 py-1 rounded-full bg-slate-900 border border-white/10">
            Monthly Max: {formatHourMin(yearData.maxMonthSec)}
          </span>
        </div>

        {yearData.totalYearSec === 0 ? (
          <div className="py-16 text-center text-xs font-serif text-slate-500">
            No study sessions recorded for {selectedYear}.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 border-b border-white/10 pb-2">
              {yearData.months.map((m) => {
                const heightPct =
                  yearData.maxMonthSec > 0
                    ? Math.min(100, Math.round((m.totalSec / yearData.maxMonthSec) * 100))
                    : 0;

                const isBest = yearData.bestMonth?.name === m.name;

                return (
                  <div
                    key={m.name}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl">
                      <span className="text-cyan-300 font-semibold">{m.name} {selectedYear}</span>: {formatHourMin(m.totalSec)}
                    </div>

                    {m.totalSec > 0 && (
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono mb-2 transition-opacity truncate max-w-full ${
                          isBest ? 'text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {formatHourMin(m.totalSec)}
                      </span>
                    )}

                    <div
                      className={`w-full max-w-[42px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:brightness-110 shadow-sm ${
                        isBest ? 'ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]' : ''
                      }`}
                      style={{
                        height: `${Math.max(heightPct, m.totalSec > 0 ? 6 : 2)}%`,
                        backgroundColor: m.totalSec > 0 ? '#1e293b' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {Object.entries(m.bySubject).map(([subId, subSec]) => {
                        if (subSec <= 0 || m.totalSec <= 0) return null;
                        const segPct = (subSec / m.totalSec) * 100;
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

            {/* 12 Months Labels */}
            <div className="flex justify-between text-[11px] sm:text-xs font-serif text-slate-400 uppercase tracking-wider">
              {yearData.months.map((m) => (
                <div key={m.name} className="flex-1 text-center">
                  <span
                    className={`block font-semibold ${
                      m.isCurrent ? 'text-cyan-400' : 'text-slate-300'
                    }`}
                  >
                    {m.name}
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

      {/* 4. Lower Grid: Yearly Subject Breakdown Donut & Annual Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Donut Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                Annual Subject Allocation
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Full-year focus time distribution across subjects
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {yearData.subjectBreakdown.length} {yearData.subjectBreakdown.length === 1 ? 'subject' : 'subjects'}
            </span>
          </div>

          {yearData.subjectBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs font-serif text-slate-500">
              No subject study time recorded for {selectedYear}.
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
                    return yearData.subjectBreakdown.map((item) => {
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
                {yearData.subjectBreakdown.map((item) => (
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

        {/* Right: Annual Highlights (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm flex flex-col justify-between space-y-6">
          <div className="pb-3 border-b border-white/5">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Annual Highlights
            </h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Yearly milestones and performance summary
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
                <span className="text-xs font-serif text-slate-300 block font-medium">Top Month</span>
                <span className="text-xs font-mono text-slate-400">
                  {yearData.bestMonth ? `${yearData.bestMonth.name} ${selectedYear}` : 'None'}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-amber-300">
                {yearData.bestMonth ? formatHourMin(yearData.bestMonth.totalSec) : '0h'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-serif text-slate-300 block font-medium">Days Studied in {selectedYear}</span>
                <span className="text-xs font-mono text-slate-400">
                  Total calendar days with records
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-300">
                {yearData.activeDaysCount} Days
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500 text-center">
            Year {selectedYear} • Connected to live database records
          </div>
        </div>
      </div>
    </div>
  );
};
