import React, { useEffect, useState } from 'react';
import { StudyTrackerHome } from './components/home/StudyTrackerHome';
import { SubjectManagerModal } from './components/subjects/SubjectManagerModal';
import { WhitelistModal } from './components/whitelist/WhitelistModal';
import { TimelineModal } from './components/timeline/TimelineModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { initDb } from './lib/db';
import { useSubjectStore } from './store/useSubjectStore';
import { useConfigStore } from './store/useConfigStore';

export const App: React.FC = () => {
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
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300 font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading VibeFlow...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Home Page as per Wireframe Reference */}
      <StudyTrackerHome
        onOpenTimeline={() => setIsTimelineOpen(true)}
        onOpenWhitelist={() => setIsWhitelistOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSubjects={() => setIsSubjectsOpen(true)}
      />

      {/* Auxiliary Modals */}
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
    </>
  );
};

export default App;
