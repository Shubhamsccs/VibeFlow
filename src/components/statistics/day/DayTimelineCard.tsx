import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Coffee, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { StudySession, Subject } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';

interface DayTimelineCardProps {
  selectedDateStr: string;
  daySessions: StudySession[];
  subjects: Subject[];
  rolloverTime?: string;
  onDeleteSession?: (sessionId: string) => Promise<void> | void;
}

interface TimelineSessionItem {
  id: string;
  startMs: number;
  endMs: number;
  durationSec: number;
  startStr: string;
  endStr: string;
  subjectName: string;
  subjectColor: string;
}

interface TimelineGapItem {
  id: string;
  gapSec: number;
  startMs: number;
  endMs: number;
  startStr: string;
  endStr: string;
}

type TimelineEntry =
  | { type: 'session'; data: TimelineSessionItem }
  | { type: 'gap'; data: TimelineGapItem };

export const DayTimelineCard: React.FC<DayTimelineCardProps> = ({
  selectedDateStr,
  daySessions,
  subjects,
  onDeleteSession,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close three-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  // Map subjects by ID for lookup
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
    }
    return map;
  }, [subjects]);

  // Safe timestamp to ms
  const toMs = (ts: number | null | undefined): number => {
    if (!ts) return 0;
    return ts < 1e11 ? ts * 1000 : ts;
  };

  // Format 12-hour AM/PM time e.g. "AM 7:33" or "PM 1:54"
  const formatAmPm = (ms: number): string => {
    if (!ms) return '-';
    const d = new Date(ms);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${ampm} ${h12}:${String(minutes).padStart(2, '0')}`;
  };

  // Format simple duration in hours, minutes, seconds (e.g. "1h 30m", "45m", "45s")
  const formatDurationSimple = (sec: number): string => {
    const safe = Math.max(0, Math.floor(sec));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;

    if (h > 0) {
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    if (m > 0) {
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    return `${s}s`;
  };

  // Build clean, simple timeline: logged sessions + gap breaks between consecutive tasks
  const timelineEntries = useMemo(() => {
    if (!selectedDateStr || !daySessions || daySessions.length === 0) return [];

    // Filter valid sessions with focus duration
    const valid = daySessions
      .filter((s) => s.status === 'completed' || s.status === 'in_progress')
      .map((s) => {
        const startMs = toMs(s.start_time_utc);
        const focusSec = (s.pure_focus_sec || 0) + (s.allowed_usage_sec || 0);
        const isLive = s.status === 'in_progress';
        const endMs = s.end_time_utc
          ? toMs(s.end_time_utc)
          : isLive
          ? Date.now()
          : startMs + focusSec * 1000;
        return { session: s, startMs, endMs, focusSec, isLive };
      })
      .filter((s) => s.focusSec > 0 && s.startMs > 0)
      .sort((a, b) => a.startMs - b.startMs);

    const entries: TimelineEntry[] = [];

    // Loop backwards: most recent session at top, oldest at bottom
    for (let i = valid.length - 1; i >= 0; i--) {
      const sess = valid[i];
      const subj = subjectMap.get(sess.session.subject_id);

      // Add session (newest first)
      entries.push({
        type: 'session',
        data: {
          id: sess.session.id,
          startMs: sess.startMs,
          endMs: sess.endMs,
          durationSec: sess.focusSec,
          startStr: formatAmPm(sess.startMs),
          endStr: sess.isLive ? 'Live' : formatAmPm(sess.endMs),
          subjectName: subj ? subj.name : 'Study Session',
          subjectColor: subj?.color_hex || '#38bdf8',
        },
      });

      // Gap break between this session and the earlier session before it
      if (i > 0) {
        const earlierSess = valid[i - 1];
        if (sess.startMs > earlierSess.endMs) {
          const gapSec = Math.round((sess.startMs - earlierSess.endMs) / 1000);
          if (gapSec > 0) {
            entries.push({
              type: 'gap',
              data: {
                id: `gap_${earlierSess.endMs}_${sess.startMs}`,
                gapSec,
                startMs: earlierSess.endMs,
                endMs: sess.startMs,
                startStr: formatAmPm(earlierSess.endMs),
                endStr: formatAmPm(sess.startMs),
              },
            });
          }
        }
      }
    }

    return entries;
  }, [selectedDateStr, daySessions, subjectMap]);

  return (
    <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
            Daily Timeline
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Logged Sessions & Breaks
        </span>
      </div>

      {/* Simple Logged Sessions & Breaks List */}
      <div className="space-y-3 pt-1">
        {timelineEntries.length === 0 ? (
          <div className="py-10 text-center text-xs font-serif text-slate-500">
            No study sessions logged for this day.
          </div>
        ) : (
          timelineEntries.map((entry) => {
            if (entry.type === 'gap') {
              return (
                <div
                  key={entry.data.id}
                  className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-slate-400"
                >
                  <div className="flex items-center gap-2.5 text-xs font-serif">
                    <Coffee className="w-3.5 h-3.5 text-amber-400/80" />
                    <span className="text-slate-300 font-medium">Break / Gap</span>
                    <span className="font-mono text-slate-400">
                      ({entry.data.startStr} ~ {entry.data.endStr})
                    </span>
                  </div>

                  <span className="font-mono text-xs font-semibold text-amber-300">
                    {formatDurationSimple(entry.data.gapSec)}
                  </span>
                </div>
              );
            }

            // Logged Study Session
            const sess = entry.data;
            return (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-colors"
              >
                {/* Left: Subject Color Bar + Name + Time Range */}
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-8 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: sess.subjectColor }}
                  />
                  <div>
                    <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-slate-100">
                      {sess.subjectName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                      <span>{sess.startStr} ~ {sess.endStr}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Studied Duration + Three-Dot Action Menu */}
                <div className="flex items-center gap-3.5">
                  <div className="text-right">
                    <span className="font-serif text-base font-bold text-cyan-300 block leading-tight">
                      {formatDurationSimple(sess.durationSec)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatSeconds(sess.durationSec)}
                    </span>
                  </div>

                  {/* Three-Dot Menu */}
                  {onDeleteSession && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === sess.id ? null : sess.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Session Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === sess.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-8 w-36 rounded-xl bg-[#13141c] border border-white/10 shadow-2xl py-1 z-30"
                        >
                          <button
                            onClick={() => {
                              onDeleteSession(sess.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Log</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
