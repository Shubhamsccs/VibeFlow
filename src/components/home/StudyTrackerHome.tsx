import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  Play,
  Pause,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  Plus,
  X,
  Check,
  HelpCircle,
  Home as HomeIcon,
  CheckSquare,
  Calendar as CalendarIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Settings as SettingsIcon,
  ArrowLeft,
  BarChart2,
  Coffee,
  Moon,
} from 'lucide-react';
import { useSubjectStore } from '../../store/useSubjectStore';
import { useConfigStore } from '../../store/useConfigStore';
import { useTimerStore } from '../../store/useTimerStore';
import { formatSeconds, getCurrentLogicalDate } from '../../lib/timeUtils';
import { Subject, StudySession } from '../../types/tracker';
import { isTauri, getStudySessions } from '../../lib/db';
import { StatisticsPage } from '../statistics/StatisticsPage';
import { PlannerTabView } from './PlannerTabView';
import { TodoView } from './TodoView';
import { CalendarView } from './CalendarView';
import { GroupsView } from './GroupsView';
import { HelpModal } from './HelpModal';

interface StudyTrackerHomeProps {
  onOpenTimeline: () => void;
  onOpenWhitelist: () => void;
  onOpenSettings: () => void;
  onOpenSubjects: () => void;
}

// Preset vibrant subject colors matching YPT palette (DSA lime, Web Dev cyan, College Work red, My Space yellow)
const PALETTE_COLORS = [
  '#84cc16', // Lime Green (like DSA in reference)
  '#06b6d4', // Vibrant Cyan (like Web Dev in reference)
  '#ef4444', // Crimson Red (like College Work in reference)
  '#eab308', // Golden Yellow (like My Space in reference)
  '#a855f7', // Purple Glow
  '#f97316', // Bright Orange
  '#38bdf8', // Sky Blue
  '#ec4899', // Pink Flame
];

export const StudyTrackerHome: React.FC<StudyTrackerHomeProps> = ({
  onOpenTimeline,
  onOpenWhitelist,
  onOpenSettings,
}) => {
  const {
    subjects,
    activeSubjectId,
    toggleTimer,
    addSubject,
    editSubject,
    resetSubjectTime,
    deleteSubject,
    getTotalSecondsToday,
  } = useSubjectStore();

  const { rolloverTime, isDateDayOff, toggleDateDayOff, dayOffs } = useConfigStore();
  const todayLogicalDate = useMemo(() => getCurrentLogicalDate(rolloverTime), [rolloverTime]);
  const { currentStatus, currentProcess, graceRemainingSec, isRunning } = useTimerStore();

  // Primary Tabs: TIMER | STATISTICS | PLANNER
  const [activeTab, setActiveTab] = useState<'TIMER' | 'PLANNER'>('TIMER');

  // Active view: 'home' | 'statistics' | 'todo' | 'calendar' | 'groups'
  const [currentView, setCurrentView] = useState<'home' | 'statistics' | 'todo' | 'calendar' | 'groups'>('home');

  // Dropdown menu for subject 3-dots
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modals & Popovers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(PALETTE_COLORS[0]);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');

  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Selected date anchor on homepage (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Formatted logical date string YYYY-MM-DD
  const selectedDateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const isSelectedToday = selectedDateStr === todayLogicalDate;
  const isSelectedDayOff = isDateDayOff(selectedDateStr);

  // Date formatted like screenshot: "SAT, 9/26" in serif typography
  const dateText = useMemo(() => {
    const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    return `${weekday}, ${month}/${day}`;
  }, [selectedDate]);

  // Sessions loaded for selected historical / future date
  const [selectedDaySessions, setSelectedDaySessions] = useState<StudySession[]>([]);

  useEffect(() => {
    if (!isSelectedToday) {
      getStudySessions(selectedDateStr).then((data) => {
        setSelectedDaySessions(data);
      });
    }
  }, [selectedDateStr, isSelectedToday, subjects]);

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleJumpToToday = () => {
    setSelectedDate(new Date());
  };

  const handleToggleDayOff = async () => {
    await toggleDateDayOff(selectedDateStr);
  };

  // Live total seconds today from store
  const totalSecondsToday = getTotalSecondsToday();

  // Grand total seconds for homepage
  const totalSecondsForSelectedDate = useMemo(() => {
    if (isSelectedToday) {
      return totalSecondsToday;
    }
    return selectedDaySessions.reduce((acc, s) => {
      if (s.status === 'completed' || s.status === 'in_progress') {
        return acc + (s.pure_focus_sec || 0) + (s.allowed_usage_sec || 0);
      }
      return acc;
    }, 0);
  }, [isSelectedToday, totalSecondsToday, selectedDaySessions]);

  // Get seconds for subject on the selected date
  const getSubjectSecondsForSelectedDate = (subjectId: string): number => {
    if (isSelectedToday) {
      const subj = subjects.find((s) => s.id === subjectId);
      return subj?.seconds_today || 0;
    }
    return selectedDaySessions
      .filter((s) => s.subject_id === subjectId && (s.status === 'completed' || s.status === 'in_progress'))
      .reduce((acc, s) => acc + (s.pure_focus_sec || 0) + (s.allowed_usage_sec || 0), 0);
  };

  const handleSubjectTimerClick = (subjectId: string) => {
    if (!isSelectedToday) {
      setSelectedDate(new Date());
    }
    toggleTimer(subjectId);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setIsGridMenuOpen(false);
      setShowInfoPopover(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard shortcuts (Space to toggle active subject, Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (activeSubjectId) {
          toggleTimer(activeSubjectId);
        } else if (subjects.length > 0) {
          toggleTimer(subjects[0].id);
        }
      } else if (e.code === 'Escape') {
        setIsAddOpen(false);
        setEditingSubject(null);
        setIsGridMenuOpen(false);
        setShowInfoPopover(false);
        setIsHelpOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubjectId, subjects, toggleTimer]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    await addSubject(newSubjectName.trim(), newSubjectColor);
    setNewSubjectName('');
    setIsAddOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim()) return;
    await editSubject(editingSubject.id, editName.trim());
    setEditingSubject(null);
  };

  // If Statistics page is opened, render full-screen StatisticsPage with back navigation
  if (currentView === 'statistics') {
    return (
      <StatisticsPage
        onBack={() => setCurrentView('home')}
        subjects={subjects}
        totalSecondsToday={totalSecondsToday}
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-[#09090b] text-slate-100 select-none font-sans overflow-hidden">
      {/* 1. Desktop Window Top Header Bar */}
      <header className="w-full h-16 px-6 sm:px-10 border-b border-white/5 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        {/* Left: Brand / Home Link */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <span className="font-serif font-bold text-base sm:text-lg tracking-widest uppercase text-white group-hover:text-slate-300 transition-colors">
              VibeFlow
            </span>
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
              title={isRunning ? 'Tracking Active' : 'Idle'}
            />
          </button>

          {currentView !== 'home' && (
            <button
              onClick={() => setCurrentView('home')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer ml-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </button>
          )}
        </div>

        {/* Center: Date with Left/Right Arrows + Day-Off Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Navigator with Left & Right Arrow Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/80 border border-white/10 rounded-xl px-1.5 py-0.5 shadow-sm">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-serif text-sm sm:text-base font-medium text-slate-100 tracking-widest uppercase px-1 sm:px-2 select-none whitespace-nowrap">
              {dateText}
            </span>

            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-Off Toggle Button: Off / On for selected date */}
          <button
            onClick={handleToggleDayOff}
            role="switch"
            aria-checked={isSelectedDayOff}
            className={`inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-serif uppercase tracking-wider transition-all cursor-pointer border select-none ${
              isSelectedDayOff
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-sm'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title={isSelectedDayOff ? `Day Off is ON for ${dateText} (Click to turn OFF)` : `Day Off is OFF for ${dateText} (Click to turn ON)`}
          >
            <Moon className={`w-3.5 h-3.5 transition-colors ${isSelectedDayOff ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="font-medium text-[11px]">Day Off</span>
            <div className="flex items-center bg-black/60 p-0.5 rounded-full border border-white/5 font-mono text-[9px]">
              <span
                className={`px-1.5 py-0.5 rounded-full font-bold transition-all ${
                  !isSelectedDayOff
                    ? 'bg-slate-700 text-slate-200 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                OFF
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-full font-bold transition-all ${
                  isSelectedDayOff
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                ON
              </span>
            </div>
          </button>
        </div>

        {/* Right: Menu App Button (Contains Home, Statistics, To-Do, Calendar, Groups & Utilities) */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHelpOpen(true);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Help & Shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsGridMenuOpen(!isGridMenuOpen);
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isGridMenuOpen
                ? 'bg-slate-800 border-slate-700 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent'
            }`}
            title="App Menu"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {/* Top-Right Menu App Popover */}
          {isGridMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 animate-in fade-in duration-150"
            >
              {/* Apps Navigation Section */}
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                App Navigation
              </div>

              <button
                onClick={() => {
                  setCurrentView('home');
                  setIsGridMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors cursor-pointer text-left ${
                  currentView === 'home'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <HomeIcon className="w-4 h-4 text-sky-400" />
                  Home
                </span>
                {currentView === 'home' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentView('statistics');
                  setIsGridMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  Statistics
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('todo');
                  setIsGridMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors cursor-pointer text-left ${
                  currentView === 'todo'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  To-Do
                </span>
                {currentView === 'todo' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentView('calendar');
                  setIsGridMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors cursor-pointer text-left ${
                  currentView === 'calendar'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  Calendar
                </span>
                {currentView === 'calendar' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentView('groups');
                  setIsGridMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors cursor-pointer text-left ${
                  currentView === 'groups'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  Groups
                </span>
                {currentView === 'groups' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                )}
              </button>

              {/* Workspace Utilities Section */}
              <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-t border-slate-800 mt-2 mb-1">
                Workspace Utilities
              </div>

              <button
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onOpenTimeline();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Daily Timeline Matrix
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onOpenWhitelist();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Whitelist Rules
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5">
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  Settings & Rollover
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Main Desktop Body Canvas */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto px-6 sm:px-12 py-8 w-full">
        <div className="w-full max-w-4xl flex flex-col flex-1">
          {/* Main View Router based on Top-Right Menu App */}
          {currentView === 'home' && (
            <>

              {/* Grand Cumulative Timer */}
              <div className="text-center pt-2 pb-8 relative">
                <div className="flex items-center justify-center gap-3">
                  <div className="font-serif text-7xl sm:text-8xl md:text-9xl text-white font-normal tracking-tight drop-shadow-sm tabular-nums">
                    {formatSeconds(totalSecondsForSelectedDate)}
                  </div>

                  {/* Info Icon Button (?) matching screenshot */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfoPopover(!showInfoPopover);
                      }}
                      className="p-1 rounded-full text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      title="Anti-Cheat Diagnostic & Rollover"
                    >
                      <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Popover */}
                    {showInfoPopover && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 w-72 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-left text-xs space-y-2 animate-in fade-in duration-150"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-1.5 font-serif">
                          <span>Verification Engine</span>
                          <span className="text-[10px] text-sky-400 font-mono">
                            {isTauri() ? 'Win32 Native' : 'Sandbox'}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-slate-300">
                          <div className="flex items-center justify-between">
                            <span>Focus Status:</span>
                            <span className="font-mono font-semibold text-emerald-400">
                              {currentStatus}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Current Window:</span>
                            <span className="font-mono text-slate-400 truncate max-w-[130px]">
                              {currentProcess || 'None'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Day Rollover Cutoff:</span>
                            <span className="font-mono text-slate-400">{rolloverTime}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!isSelectedToday && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-serif text-slate-300">
                      Viewing records for <strong className="text-white">{dateText}</strong>
                    </span>
                    <button
                      onClick={handleJumpToToday}
                      className="px-2.5 py-1 rounded-full text-xs font-serif text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-colors cursor-pointer"
                    >
                      Return to Today
                    </button>
                  </div>
                )}

                {/* Grace Warning if Diverted */}
                {isRunning && graceRemainingSec < 30 && graceRemainingSec > 0 && currentStatus !== 'FOCUS' && (
                  <div className="mt-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 inline-block px-4 py-1 rounded-full">
                    {graceRemainingSec}s grace remaining before penalized
                  </div>
                )}
              </div>

              {/* Navigation Tabs (TIMER, STATISTICS, PLANNER) */}
              <div className="flex border-b border-white/10 mb-8 w-full">
                {(['TIMER', 'STATISTICS', 'PLANNER'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'STATISTICS') {
                        setCurrentView('statistics');
                      } else {
                        setActiveTab(tab);
                      }
                    }}
                    className={`flex-1 py-3 text-sm md:text-base font-serif tracking-widest uppercase transition-colors cursor-pointer text-center relative ${
                      activeTab === tab
                        ? 'text-white font-bold'
                        : 'text-slate-500 hover:text-slate-300 font-medium'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab 1: TIMER (Subjects List) */}
              {activeTab === 'TIMER' && (
                <div className="flex-1 flex flex-col pb-16">
                  {/* Subject List */}
                  <div className="space-y-4 mb-6">
                    {subjects.length === 0 ? (
                      /* Empty state when no user subjects exist yet */
                      <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-white/10 bg-slate-900/20">
                        <p className="text-base font-serif text-slate-300 mb-1">
                          No subjects added yet
                        </p>
                        <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                          Add your subjects to start tracking your daily study sessions.
                        </p>
                        <button
                          onClick={() => setIsAddOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-serif uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-sky-400" />
                          Add Subject
                        </button>
                      </div>
                    ) : (
                      /* Render user-added subjects with circular play button matching reference */
                      subjects.map((subject) => {
                        const isRunningThis = isSelectedToday && activeSubjectId === subject.id;

                        return (
                          <div
                            key={subject.id}
                            className={`flex items-center justify-between px-4 sm:px-6 py-4 rounded-2xl transition-all duration-150 ${
                              isRunningThis
                                ? 'bg-slate-900/90 border border-white/15 shadow-lg'
                                : 'bg-transparent hover:bg-slate-900/40 border border-transparent hover:border-white/5'
                            }`}
                          >
                            {/* Left Side: Solid Vibrant Circular Play Button + Subject Name */}
                            <div className="flex items-center gap-4 sm:gap-6">
                              <button
                                onClick={() => handleSubjectTimerClick(subject.id)}
                                className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 border-none shrink-0"
                                style={{ backgroundColor: subject.color_hex || '#84cc16' }}
                                title={isRunningThis ? 'Pause Timer' : !isSelectedToday ? 'Jump to Today & Start' : 'Start Timer'}
                              >
                                {isRunningThis ? (
                                  <Pause className="w-5 h-5 fill-black text-black" />
                                ) : (
                                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                                )}
                              </button>

                              <span className="font-serif uppercase tracking-wider text-base sm:text-lg font-medium text-slate-100">
                                {subject.name}
                              </span>
                            </div>

                            {/* Right Side: Monospace/Serif Time + 3-Dot Menu */}
                            <div className="flex items-center gap-4 sm:gap-6">
                              <span
                                className={`font-serif text-lg sm:text-xl tracking-wider tabular-nums transition-colors ${
                                  isRunningThis ? 'text-white font-bold' : 'text-slate-300 font-normal'
                                }`}
                              >
                                {formatSeconds(getSubjectSecondsForSelectedDate(subject.id))}
                              </span>

                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === subject.id ? null : subject.id);
                                  }}
                                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu (Edit Subject, Reset Time, Delete Subject) */}
                                {openMenuId === subject.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1.5 z-40 w-44 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden py-1.5 animate-in fade-in duration-100"
                                  >
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setEditingSubject(subject);
                                        setEditName(subject.name);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-serif text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                      Edit Subject
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        resetSubjectTime(subject.id);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-serif text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                      Reset Time
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        deleteSubject(subject.id);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-serif text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer border-t border-slate-800 mt-1 pt-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete Subject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* ONLY "Add Subject" Button */}
                  <div className="flex items-center mt-2">
                    <button
                      onClick={() => setIsAddOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-serif uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-sky-400" />
                      Add subject
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: PLANNER (Static Desktop View) */}
              {activeTab === 'PLANNER' && (
                <PlannerTabView onOpenTimeline={onOpenTimeline} />
              )}
            </>
          )}

          {/* Sub-Views Switched via Top-Right Menu App */}
          {currentView === 'todo' && <TodoView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'groups' && <GroupsView />}
        </div>
      </main>

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        rolloverTime={rolloverTime}
      />

      {/* Add Subject Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                Add Subject
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-slate-400 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. DSA, Web Development, Math"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-serif text-white placeholder-slate-600 outline-none focus:border-slate-500 uppercase tracking-wide"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-slate-400 mb-2">
                  Button Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubjectColor(c)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
                        newSubjectColor === c
                          ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {newSubjectColor === c && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors font-bold cursor-pointer"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal (Opened via 3-dots on Subject row) */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                Edit Subject
              </h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-slate-400 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-serif text-white outline-none focus:border-slate-500 uppercase tracking-wide"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-serif uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
