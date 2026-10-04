import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Subject, StudySession } from '../../types/tracker';
import { getStudySessions, saveStudySession, deleteStudySession } from '../../lib/db';
import { getCurrentLogicalDate } from '../../lib/timeUtils';
import { useConfigStore } from '../../store/useConfigStore';
import { useSubjectStore } from '../../store/useSubjectStore';
import { useTimerStore } from '../../store/useTimerStore';
import { DayCalendarCard } from './day/DayCalendarCard';
import { DayOverviewCard } from './day/DayOverviewCard';
import { DayDonutChartsCard } from './day/DayDonutChartsCard';
import { DayManualLogCard } from './day/DayManualLogCard';
import { DayTimelineCard } from './day/DayTimelineCard';
import { WeekDashboard } from './week/WeekDashboard';
import { MonthDashboard } from './month/MonthDashboard';
import { YearDashboard } from './year/YearDashboard';

interface StatisticsPageProps {
  onBack: () => void;
  subjects: Subject[];
  totalSecondsToday: number;
}

type PeriodFilter = 'Day' | 'Week' | 'Month' | 'Year';

export const StatisticsPage: React.FC<StatisticsPageProps> = ({
  onBack,
  subjects: propSubjects,
  totalSecondsToday: propTotalSecondsToday,
}) => {
  const [activeFilter, setActiveFilter] = useState<PeriodFilter>('Day');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live reactivity from stores
  const storeSubjects = useSubjectStore((state) => state.subjects);
  const getStoreTotalSecondsToday = useSubjectStore((state) => state.getTotalSecondsToday);
  const liveTotalSecondsToday = getStoreTotalSecondsToday();

  // Use the most up-to-date live subjects
  const subjects = storeSubjects.length > 0 ? storeSubjects : propSubjects;
  const totalSecondsToday = liveTotalSecondsToday > 0 ? liveTotalSecondsToday : propTotalSecondsToday;

  const { rolloverTime, dayOffs } = useConfigStore();

  const todayLogicalDate = useMemo(() => getCurrentLogicalDate(rolloverTime), [rolloverTime]);
  const [selectedDayDate, setSelectedDayDate] = useState<string>(todayLogicalDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (todayLogicalDate && !selectedDayDate) {
      setSelectedDayDate(todayLogicalDate);
    }
  }, [todayLogicalDate, selectedDayDate]);

  // Live timer subscriptions from useTimerStore
  const isTimerRunning = useTimerStore((s) => s.isRunning);
  const timerSessionId = useTimerStore((s) => s.sessionId);
  const timerSubjectId = useTimerStore((s) => s.subjectId);
  const timerPureFocusSec = useTimerStore((s) => s.pureFocusSec);
  const timerAllowedUsageSec = useTimerStore((s) => s.allowedUsageSec);
  const timerDivertedSec = useTimerStore((s) => s.divertedSec);
  const timerStartTimeUtc = useTimerStore((s) => s.startTimeUtc);

  // Load all recorded study sessions once on mount
  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      try {
        const data = await getStudySessions();
        setSessions(data);
      } catch (err) {
        console.error('Failed to load sessions for statistics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // Valid, non-deleted subject IDs set
  const validSubjectIds = useMemo(() => new Set(subjects.map((s) => s.id)), [subjects]);

  // Exclude all historical sessions belonging to deleted subjects
  const activeSessions = useMemo(() => {
    return sessions.filter((s) => validSubjectIds.has(s.subject_id));
  }, [sessions, validSubjectIds]);

  // Unified live sessions: merges real-time ticking unpersisted session into activeSessions
  const unifiedSessions = useMemo(() => {
    if (!isTimerRunning || !timerSessionId || !timerSubjectId || !validSubjectIds.has(timerSubjectId)) {
      return activeSessions;
    }

    const existingIndex = activeSessions.findIndex((s) => s.id === timerSessionId);
    if (existingIndex >= 0) {
      const updated = [...activeSessions];
      const existing = updated[existingIndex];
      updated[existingIndex] = {
        ...existing,
        pure_focus_sec: timerPureFocusSec || 0,
        allowed_usage_sec: timerAllowedUsageSec || 0,
        diverted_sec: timerDivertedSec || 0,
        logical_date: existing.logical_date || todayLogicalDate,
      };
      return updated;
    } else {
      const liveSession: StudySession = {
        id: timerSessionId,
        subject_id: timerSubjectId,
        start_time_utc: timerStartTimeUtc || Math.floor(Date.now() / 1000),
        end_time_utc: null,
        pure_focus_sec: timerPureFocusSec || 0,
        allowed_usage_sec: timerAllowedUsageSec || 0,
        diverted_sec: timerDivertedSec || 0,
        logical_date: todayLogicalDate,
        status: 'in_progress',
      };
      return [liveSession, ...activeSessions];
    }
  }, [
    activeSessions,
    isTimerRunning,
    timerSessionId,
    timerSubjectId,
    timerPureFocusSec,
    timerAllowedUsageSec,
    timerDivertedSec,
    timerStartTimeUtc,
    todayLogicalDate,
    validSubjectIds,
  ]);

  // Filter sessions specifically for the selected date
  const selectedDaySessions = useMemo(() => {
    return unifiedSessions.filter((s) => s.logical_date === selectedDayDate);
  }, [unifiedSessions, selectedDayDate]);

  const isSelectedDayToday = selectedDayDate === todayLogicalDate;

  // Session mutation handlers that keep DB, sessions, and live subject store in sync
  const loadSubjectsFromStore = useSubjectStore((state) => state.loadSubjects);

  const handleAddSession = async (newSession: StudySession) => {
    await saveStudySession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    await loadSubjectsFromStore();
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteStudySession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    await loadSubjectsFromStore();
  };

  return (
    <div className="flex flex-col w-full h-screen bg-[#070709] text-slate-100 select-none font-sans overflow-hidden">
      {/* 1. Full-Width Desktop Header */}
      <header className="w-full h-16 px-6 sm:px-12 border-b border-white/5 bg-[#070709]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer text-xs font-serif uppercase tracking-wider"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Home</span>
        </button>

        <h1 className="font-serif text-lg sm:text-xl font-medium tracking-widest uppercase text-white">
          Statistics
        </h1>

        <button
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-serif uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="AI Insights"
        >
          <span>AI</span>
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        </button>
      </header>

      {/* 2. Enhanced Desktop Canvas: Wide max-w-6xl/7xl layout without narrow mobile gaps */}
      <main className="flex-1 overflow-y-auto w-full px-6 sm:px-10 xl:px-14 py-6 scroll-smooth">
        <div className="w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col space-y-6 pb-24">
          
          {/* Top Filter & Period Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f1015] border border-white/5 shadow-sm">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(['Day', 'Week', 'Month', 'Year'] as const).map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-1.5 rounded-full text-xs font-serif tracking-wider transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#38bdf8] text-black font-bold shadow-sm'
                        : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {/* Date Range Indicator */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="font-serif text-sm font-semibold text-white block">
                  {activeFilter === 'Day'
                    ? selectedDayDate
                    : activeFilter === 'Week'
                    ? 'Weekly Analysis'
                    : activeFilter === 'Month'
                    ? 'Monthly Analysis'
                    : 'Yearly Analysis'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeFilter === 'Day'
                    ? isSelectedDayToday
                      ? 'Today (Live)'
                      : 'Selected Day'
                    : activeFilter === 'Week'
                    ? '7-Day breakdown & trends'
                    : activeFilter === 'Month'
                    ? 'Full month breakdown'
                    : '12-Month focus journey'}
                </span>
              </div>
            </div>
          </div>

          {activeFilter === 'Day' && (
            /* ==================== DAY DASHBOARD (Desktop 2-Column Responsive Layout) ==================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column (5 cols on lg/xl): Calendar Navigation + Manual Log Card */}
              <div className="lg:col-span-5 space-y-6 flex flex-col">
                <DayCalendarCard
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  selectedDateStr={selectedDayDate}
                  onSelectDate={setSelectedDayDate}
                  sessions={unifiedSessions}
                  dayOffs={dayOffs}
                  todayLogicalDate={todayLogicalDate}
                  liveTotalSecondsToday={totalSecondsToday}
                />

                <DayManualLogCard
                  selectedDateStr={selectedDayDate}
                  subjects={subjects}
                  existingSessions={selectedDaySessions}
                  onAddSession={handleAddSession}
                />
              </div>

              {/* Right Column (7 cols on lg/xl): Overview Metrics + Subject Pie/Donut Chart */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <DayOverviewCard
                  selectedDateStr={selectedDayDate}
                  daySessions={selectedDaySessions}
                  subjects={subjects}
                  rolloverTime={rolloverTime}
                  liveSecondsToday={totalSecondsToday}
                  isToday={isSelectedDayToday}
                />

                <DayDonutChartsCard
                  daySessions={selectedDaySessions}
                  subjects={subjects}
                  liveSecondsToday={totalSecondsToday}
                  isToday={isSelectedDayToday}
                  selectedDateStr={selectedDayDate}
                />
              </div>

              {/* Full Width Bottom (12 cols on lg/xl): Daily Session Timeline */}
              <div className="col-span-1 lg:col-span-12">
                <DayTimelineCard
                  selectedDateStr={selectedDayDate}
                  daySessions={selectedDaySessions}
                  subjects={subjects}
                  rolloverTime={rolloverTime}
                  onDeleteSession={handleDeleteSession}
                />
              </div>
            </div>
          )}

          {activeFilter === 'Week' && (
            <WeekDashboard
              sessions={unifiedSessions}
              subjects={subjects}
              dayOffs={dayOffs}
              todayLogicalDate={todayLogicalDate}
              totalSecondsToday={totalSecondsToday}
            />
          )}

          {activeFilter === 'Month' && (
            <MonthDashboard
              sessions={unifiedSessions}
              subjects={subjects}
              dayOffs={dayOffs}
              todayLogicalDate={todayLogicalDate}
              totalSecondsToday={totalSecondsToday}
            />
          )}

          {activeFilter === 'Year' && (
            <YearDashboard
              sessions={unifiedSessions}
              subjects={subjects}
              dayOffs={dayOffs}
              todayLogicalDate={todayLogicalDate}
              totalSecondsToday={totalSecondsToday}
            />
          )}
        </div>
      </main>
    </div>
  );
};

