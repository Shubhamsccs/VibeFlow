import React from 'react';
import { CheckCircle2, ShieldCheck, Shield, ShieldAlert, X } from 'lucide-react';
import { StudySession } from '../../types/tracker';
import { useSubjectStore } from '../../store/useSubjectStore';
import { formatDurationHuman } from '../../lib/timeUtils';

interface SessionSummaryModalProps {
  session: StudySession | null;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ session, onClose }) => {
  if (!session) return null;

  const { subjects } = useSubjectStore();
  const subject = subjects.find((s) => s.id === session.subject_id);

  const total = session.pure_focus_sec + session.allowed_usage_sec + session.diverted_sec;
  const focusPct = total > 0 ? Math.round((session.pure_focus_sec / total) * 100) : 100;
  const allowedPct = total > 0 ? Math.round((session.allowed_usage_sec / total) * 100) : 0;
  const divertedPct = total > 0 ? Math.round((session.diverted_sec / total) * 100) : 0;

  const productivityScore = total > 0 ? Math.round(((session.pure_focus_sec + session.allowed_usage_sec) / total) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        {/* Top accent glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: subject?.color_hex || '#6366f1' }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Session Completed</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: subject?.color_hex || '#6366f1' }}
              />
              <span className="text-sm font-medium text-slate-300">
                {subject?.name || 'General Study'}
              </span>
            </div>
          </div>
        </div>

        {/* Big Total Duration & Productivity Card */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-white/5 mb-6 text-center">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Total Duration</span>
            <div className="font-mono text-2xl font-black text-white mt-1">
              {formatDurationHuman(total)}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Integrity Score</span>
            <div className="font-mono text-2xl font-black text-emerald-400 mt-1">
              {productivityScore}%
            </div>
          </div>
        </div>

        {/* Detailed 3-Bucket Breakdown */}
        <div className="space-y-4 mb-8">
          {/* Pure Focus */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
                Pure Focus (VibeFlow frontmost)
              </span>
              <span className="text-white font-mono">
                {formatDurationHuman(session.pure_focus_sec)} ({focusPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${focusPct}%` }}
              />
            </div>
          </div>

          {/* Allowed Usage */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-4 h-4" />
                Allowed Study Tools
              </span>
              <span className="text-white font-mono">
                {formatDurationHuman(session.allowed_usage_sec)} ({allowedPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${allowedPct}%` }}
              />
            </div>
          </div>

          {/* Diverted Usage */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                Diverted (Past 30s Grace)
              </span>
              <span className="text-white font-mono">
                {formatDurationHuman(session.diverted_sec)} ({divertedPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${divertedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
        >
          Save to Study Journal
        </button>
      </div>
    </div>
  );
};
