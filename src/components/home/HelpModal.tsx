import React from 'react';
import { X, HelpCircle, Shield, Clock, Keyboard, Sparkles } from 'lucide-react';
import { isTauri } from '../../lib/db';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  rolloverTime: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, rolloverTime }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider">
                Study Tracker Guide
              </h3>
              <p className="text-xs text-slate-400">Desktop accountability & verification system</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Sections */}
        <div className="space-y-4 text-xs">
          {/* Section 1: Verification Engine */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-serif font-semibold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Anti-Cheat Verification Engine</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              When tracking is active, the desktop background poller verifies foreground window titles against your whitelist rules. If you navigate to an unauthorized application, a 30-second grace countdown initiates before time accumulation halts.
            </p>
            <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span>Engine Status:</span>
              <span className="text-emerald-400 font-semibold">
                {isTauri() ? 'Win32 Native Hooks Active' : 'Web Dev Sandbox Ready'}
              </span>
            </div>
          </div>

          {/* Section 2: Day Rollover Cutoff */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-serif font-semibold">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Logical Day Rollover ({rolloverTime})</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Late-night study sessions before {rolloverTime} AM are credited to the previous calendar day. This ensures midnight-spanning study sprints are accurately counted toward today's goal without artificial date splitting.
            </p>
          </div>

          {/* Section 3: Keyboard Shortcuts */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-serif font-semibold">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>Quick Desktop Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <div className="flex items-center justify-between">
                <span>Start / Pause Active:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Space</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Add New Subject:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">N</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Edit Subjects:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">E</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Close Dialog:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-serif uppercase tracking-wider transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
