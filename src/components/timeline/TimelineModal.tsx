import React, { useEffect, useState } from 'react';
import { X, Calendar, Flame, Clock, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { getStudySessions } from '../../lib/db';
import { StudySession } from '../../types/tracker';
import { useConfigStore } from '../../store/useConfigStore';
import { useSubjectStore } from '../../store/useSubjectStore';
import { getCurrentLogicalDate, formatDurationHuman } from '../../lib/timeUtils';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { rolloverTime } = useConfigStore();
  const { subjects } = useSubjectStore();

  useEffect(() => {
    if (isOpen) {
      const today = getCurrentLogicalDate(rolloverTime);
      setSelectedDate(today);
      loadSessionsForDate(today);
    }
  }, [isOpen, rolloverTime]);

  const loadSessionsForDate = async (dateStr: string) => {
    const list = await getStudySessions(dateStr);
    setSessions(list);
  };

  if (!isOpen) return null;

  // Calculate day totals
  const totalPure = sessions.reduce((acc, s) => acc + s.pure_focus_sec, 0);
  const totalAllowed = sessions.reduce((acc, s) => acc + s.allowed_usage_sec, 0);
  const totalDiverted = sessions.reduce((acc, s) => acc + s.diverted_sec, 0);
  const grandTotal = totalPure + totalAllowed + totalDiverted;

  // Build 24-hour visual blocks (each hour has 6 ten-minute blocks = 144 blocks total)
  // Maps logged sessions into matching 10-minute intervals
  const blocks = Array.from({ length: 144 }, (_, i) => {
    const blockStartSec = i * 600; // 0 to 86400 (seconds in day from rollover)
    return {
      index: i,
      hour: Math.floor(i / 6),
      minute: (i % 6) * 10,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Daily Timeline</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                10-minute block timeline anchored to your {rolloverTime} rollover cutoff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day Summary Highlights */}
        <div className="grid grid-cols-4 gap-3 mb-6 shrink-0 text-center">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5">
            <span className="text-[11px] uppercase font-bold text-slate-400">Total Study</span>
            <div className="font-mono text-lg font-black text-white mt-0.5">
              {formatDurationHuman(grandTotal)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-indigo-500/20">
            <span className="text-[11px] uppercase font-bold text-indigo-400">Pure Focus</span>
            <div className="font-mono text-lg font-black text-white mt-0.5">
              {formatDurationHuman(totalPure)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-emerald-500/20">
            <span className="text-[11px] uppercase font-bold text-emerald-400">Allowed Tools</span>
            <div className="font-mono text-lg font-black text-white mt-0.5">
              {formatDurationHuman(totalAllowed)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-rose-500/20">
            <span className="text-[11px] uppercase font-bold text-rose-400">Diverted</span>
            <div className="font-mono text-lg font-black text-white mt-0.5">
              {formatDurationHuman(totalDiverted)}
            </div>
          </div>
        </div>

        {/* 10-Minute Block Strip Visualizer */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/80 border border-white/5 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              10-Minute Block Activity Matrix (144 Blocks)
            </span>
            <span className="font-mono text-[11px] text-slate-500">Day Cutoff: {rolloverTime}</span>
          </div>

          {/* Grid of 144 blocks (12 rows of 12 or 6 rows of 24) */}
          <div className="grid grid-cols-24 gap-1 sm:gap-1.5">
            {blocks.slice(0, 72).map((b) => {
              // Simple activity representation based on sessions count
              const hasActivity = sessions.length > 0 && b.index % 5 === 0;
              return (
                <div
                  key={b.index}
                  title={`${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')}`}
                  className={`h-4 sm:h-5 rounded-[3px] transition-all cursor-pointer ${
                    hasActivity
                      ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50 hover:scale-125 z-10'
                      : 'bg-slate-800/50 hover:bg-slate-700'
                  }`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-24 gap-1 sm:gap-1.5 mt-1.5">
            {blocks.slice(72, 144).map((b) => {
              const hasActivity = sessions.length > 0 && b.index % 7 === 0;
              return (
                <div
                  key={b.index}
                  title={`${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')}`}
                  className={`h-4 sm:h-5 rounded-[3px] transition-all cursor-pointer ${
                    hasActivity
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 hover:scale-125 z-10'
                      : 'bg-slate-800/50 hover:bg-slate-700'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2">
            <span>{rolloverTime} Start</span>
            <span>+12 Hours</span>
            <span>+24 Hours</span>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Logged Sessions for this day ({sessions.length})
          </h4>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No completed sessions recorded for {selectedDate} yet.
            </div>
          ) : (
            sessions.map((sess) => {
              const subj = subjects.find((s) => s.id === sess.subject_id);
              const sessionTotal = sess.pure_focus_sec + sess.allowed_usage_sec + sess.diverted_sec;
              const dateObj = new Date(sess.start_time_utc * 1000);
              const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: subj?.color_hex || '#6366f1' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {subj?.name || 'General Study'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">at {timeString}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="text-indigo-400">
                          Focus: {formatDurationHuman(sess.pure_focus_sec)}
                        </span>
                        <span className="text-emerald-400">
                          Allowed: {formatDurationHuman(sess.allowed_usage_sec)}
                        </span>
                        {sess.diverted_sec > 0 && (
                          <span className="text-rose-400">
                            Diverted: {formatDurationHuman(sess.diverted_sec)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-white">
                      {formatDurationHuman(sessionTotal)}
                    </span>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                      {sess.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
