import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { StudySession } from '../../../types/tracker';
import { formatDurationHuman } from '../../../lib/timeUtils';

interface DayCalendarCardProps {
  currentMonth: Date;
  onMonthChange: (newMonth: Date) => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  sessions: StudySession[];
  dayOffs: string[];
  todayLogicalDate: string;
  liveTotalSecondsToday: number;
}

export const DayCalendarCard: React.FC<DayCalendarCardProps> = ({
  currentMonth,
  onMonthChange,
  selectedDateStr,
  onSelectDate,
  sessions,
  dayOffs,
  todayLogicalDate,
  liveTotalSecondsToday,
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthLabel = monthNames[month];

  // Daily totals map for the displayed month
  const { dailyTotals, monthTotalSeconds } = useMemo(() => {
    const map = new Map<string, number>();
    let monthTotal = 0;

    for (const s of sessions) {
      if (s.status === 'completed' || s.status === 'in_progress') {
        const sec = (s.pure_focus_sec || 0) + (s.allowed_usage_sec || 0);
        if (sec > 0 && s.logical_date) {
          map.set(s.logical_date, (map.get(s.logical_date) || 0) + sec);
        }
      }
    }

    // Include live today seconds if today is in this month
    if (liveTotalSecondsToday > 0 && todayLogicalDate) {
      map.set(todayLogicalDate, Math.max(map.get(todayLogicalDate) || 0, liveTotalSecondsToday));
    }

    // Calculate month total
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    for (const [dateStr, sec] of map.entries()) {
      if (dateStr.startsWith(monthPrefix)) {
        monthTotal += sec;
      }
    }

    return { dailyTotals: map, monthTotalSeconds: monthTotal };
  }, [sessions, liveTotalSecondsToday, todayLogicalDate, year, month]);

  // Calendar matrix calculation (Monday start)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // In JS getDay(): 0 is Sunday, 1 is Monday...
    let firstWeekday = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    // Convert to Monday start: 0 = Mon, 6 = Sun
    firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1;

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      totalSec: number;
      isOff: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dNum);
      const dStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        totalSec: dailyTotals.get(dStr) || 0,
        isOff: dayOffs.includes(dStr),
        isToday: dStr === todayLogicalDate,
        isSelected: dStr === selectedDateStr,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        totalSec: dailyTotals.get(dStr) || 0,
        isOff: dayOffs.includes(dStr),
        isToday: dStr === todayLogicalDate,
        isSelected: dStr === selectedDateStr,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: false,
        totalSec: dailyTotals.get(dStr) || 0,
        isOff: dayOffs.includes(dStr),
        isToday: dStr === todayLogicalDate,
        isSelected: dStr === selectedDateStr,
      });
    }

    return cells;
  }, [year, month, dailyTotals, dayOffs, todayLogicalDate, selectedDateStr]);

  // Format short study time (e.g. 5:49 or 1:32)
  const formatShortTime = (sec: number) => {
    if (sec <= 0) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  // Intensity style based on hours: 0, 4, 7, 10, 12 hours
  const getIntensityStyle = (sec: number) => {
    const hours = sec / 3600;
    if (hours >= 12) {
      return 'bg-[#2bbad9] text-slate-950 font-bold border border-cyan-200 shadow-sm';
    }
    if (hours >= 10) {
      return 'bg-[#23859b] text-white font-semibold border border-cyan-400/40';
    }
    if (hours >= 7) {
      return 'bg-[#206677] text-cyan-100 font-medium border border-cyan-500/30';
    }
    if (hours >= 4) {
      return 'bg-[#1b4f5c] text-cyan-200 border border-cyan-600/30';
    }
    if (hours > 0) {
      return 'bg-[#133842] text-cyan-300 border border-cyan-700/30';
    }
    return 'bg-[#0d0f14] text-slate-400 hover:bg-slate-800/40 border border-white/5';
  };

  const handlePrevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
  };

  // Month total formatted: SEP: 29H 11M
  const formatMonthTotal = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${monthLabel}: ${h}H ${m}M`;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 space-y-4 shadow-sm flex flex-col justify-between">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-serif text-sm font-semibold tracking-widest uppercase text-white px-2">
            {monthLabel} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick today jump */}
        <button
          onClick={() => onSelectDate(todayLogicalDate)}
          className="text-[11px] font-serif uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Weekday Column Headers (MON to SUN) */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-serif text-[11px] text-slate-500 uppercase tracking-wider pb-1 border-b border-white/5">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell) => {
          const hasStudy = cell.totalSec > 0;
          const intensityClass = cell.isCurrentMonth
            ? getIntensityStyle(cell.totalSec)
            : 'bg-transparent text-slate-700 border border-transparent';

          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`h-12 rounded-lg p-1 flex flex-col justify-between items-center transition-all cursor-pointer relative select-none ${intensityClass} ${
                cell.isSelected ? 'ring-2 ring-[#38bdf8] ring-offset-1 ring-offset-[#0f1015] z-10' : ''
              } ${cell.isToday && !cell.isSelected ? 'outline outline-1 outline-white/80' : ''}`}
            >
              {/* Day Number */}
              <span
                className={`text-[11px] font-mono leading-none ${
                  cell.isCurrentMonth ? (hasStudy ? 'font-bold' : 'text-slate-400') : 'text-slate-700'
                }`}
              >
                {cell.dayNum}
              </span>

              {/* Day Off icon OR study hours */}
              {cell.isCurrentMonth && (
                <>
                  {hasStudy ? (
                    <span className="text-[10px] font-mono font-medium leading-none tracking-tight">
                      {formatShortTime(cell.totalSec)}
                    </span>
                  ) : cell.isOff ? (
                    <div
                      title="Day Off"
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/40 border border-white/10 text-[8px] font-mono text-slate-400 uppercase tracking-wider leading-none"
                    >
                      <FileText className="w-2.5 h-2.5 text-slate-400" />
                      <span>OFF</span>
                    </div>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer: Legend & Month Total */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-serif">
        {/* Heat Legend: 0+ 4+ 7+ 10+ 12+ */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#133842] border border-cyan-700/30" title="0+ hours" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#1b4f5c] border border-cyan-600/30" title="4+ hours" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#206677] border border-cyan-500/30" title="7+ hours" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#23859b] border border-cyan-400/40" title="10+ hours" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#2bbad9] border border-cyan-200" title="12+ hours" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 ml-1">
            0+ 4+ 7+ 10+ 12+
          </span>
        </div>

        {/* Month Total Study Time */}
        <div className="font-mono text-xs uppercase tracking-wider text-slate-300 font-semibold">
          {formatMonthTotal(monthTotalSeconds)}
        </div>
      </div>
    </div>
  );
};
