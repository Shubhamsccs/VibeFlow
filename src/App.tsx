import React, { useEffect, useState } from 'react';
import {
  Flame,
  Calendar,
  Shield,
  Layers,
  Settings,
  Cpu,
  CheckCircle,
} from 'lucide-react';
import { TimerView } from './components/timer/TimerView';
import { SessionSummaryModal } from './components/timer/SessionSummaryModal';
import { SubjectManagerModal } from './components/subjects/SubjectManagerModal';
import { WhitelistModal } from './components/whitelist/WhitelistModal';
import { TimelineModal } from './components/timeline/TimelineModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { initDb, isTauri } from './lib/db';
import { useSubjectStore } from './store/useSubjectStore';
import { useConfigStore } from './store/useConfigStore';
import { StudySession } from './types/tracker';

export const App: React.FC = () => {
  const [completedSession, setCompletedSession] = useState<StudySession | null>(null);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { loadSubjects } = useSubjectStore();
  const { loadConfig } = useConfigStore();

  useEffect(() => {
    async function boot() {
      try {
        await initDb();
        await Promise.all([loadSubjects(), loadConfig()]);
        setIsInitialized(true);
      } catch (err) {
        console.error('Boot error:', err);
        setIsInitialized(true);
      }
    }
    boot();
  }, [loadSubjects, loadConfig]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Booting VibeFlow local engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans">
      {/* Top Application Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl shrink-0 select-none">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/20">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-base font-bold text-white tracking-tight">
                VibeFlow
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 1 Tracker
              </span>
            </div>
          </div>
        </div>

        {/* Runtime Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Runtime: <strong className="text-slate-200">{isTauri() ? 'Tauri Native OS' : 'Web Dev Sandbox'}</strong>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>

        {/* Header Action Nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimelineOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-white/5 transition-all cursor-pointer shadow-sm hover:border-white/15"
            title="Daily Timeline Logs"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setIsWhitelistOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-white/5 transition-all cursor-pointer shadow-sm hover:border-white/15"
            title="Whitelist Apps & Keywords"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Whitelist</span>
          </button>

          <button
            onClick={() => setIsSubjectsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-white/5 transition-all cursor-pointer shadow-sm hover:border-white/15"
            title="Manage Study Subjects"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Subjects</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-white/5 transition-all cursor-pointer hover:border-white/15"
            title="Settings & Rollover"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-8">
        <TimerView
          onSessionComplete={(session) => setCompletedSession(session)}
          onOpenSubjectsModal={() => setIsSubjectsOpen(true)}
        />
      </main>

      {/* Footer Info */}
      <footer className="py-3 px-6 text-center text-[11px] text-slate-600 border-t border-white/5 font-mono">
        Offline-first SQLite persistence • Win32 OS foreground verification • 04:00 AM dynamic day rollover
      </footer>

      {/* Modals */}
      <SessionSummaryModal
        session={completedSession}
        onClose={() => setCompletedSession(null)}
      />

      <SubjectManagerModal
        isOpen={isSubjectsOpen}
        onClose={() => setIsSubjectsOpen(false)}
      />

      <WhitelistModal
        isOpen={isWhitelistOpen}
        onClose={() => setIsWhitelistOpen(false)}
      />

      <TimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
