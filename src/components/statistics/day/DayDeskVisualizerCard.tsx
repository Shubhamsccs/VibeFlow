import React, { useMemo } from 'react';
import { StudySession, Subject } from '../../../types/tracker';
import { formatSeconds } from '../../../lib/timeUtils';

interface DayDeskVisualizerCardProps {
  selectedDateStr: string;
  daySessions: StudySession[];
  subjects: Subject[];
  totalSeconds: number;
  rolloverTime: string;
}

export const DayDeskVisualizerCard: React.FC<DayDeskVisualizerCardProps> = ({
  selectedDateStr,
  daySessions,
  subjects,
  totalSeconds,
  rolloverTime,
}) => {
  // Format full header date e.g. "FRI, SEP 18, 2026"
  const formattedFullDate = useMemo(() => {
    if (!selectedDateStr) return 'TODAY';
    const [y, m, d] = selectedDateStr.split('-').map((v) => parseInt(v, 10));
    const dateObj = new Date(y, m - 1, d);
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return `${weekday}, ${month} ${d}, ${y}`;
  }, [selectedDateStr]);

  // Safe timestamp converter
  const toMs = (ts: number | null | undefined): number => {
    if (!ts) return 0;
    return ts < 1e11 ? ts * 1000 : ts;
  };

  // Map subjects by ID
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects) {
      map.set(s.id, s.color_hex);
    }
    return map;
  }, [subjects]);

  // Compute 24 hours of 10-minute blocks anchored to rollover cutoff
  // Rows: 24 hours starting at rolloverTime (e.g. 5 AM)
  const hourLabels = [5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const gridData = useMemo(() => {
    if (!selectedDateStr) return [];

    const [y, m, d] = selectedDateStr.split('-').map((v) => parseInt(v, 10));
    const [rollH] = (rolloverTime || '05:00').split(':').map((v) => parseInt(v, 10));
    const dayStartMs = new Date(y, m - 1, d, rollH, 0, 0, 0).getTime();

    // Map each valid session into intervals
    const valid = daySessions.filter((s) => s.status === 'completed' || s.status === 'in_progress');
    const sessionIntervals = valid.map((sess) => {
      const sMs = toMs(sess.start_time_utc);
      const focusSec = (sess.pure_focus_sec || 0) + (sess.allowed_usage_sec || 0);
      const eMs = sess.end_time_utc ? toMs(sess.end_time_utc) : sMs + focusSec * 1000;
      const color = subjectColorMap.get(sess.subject_id) || '#ef4444';
      return { sMs, eMs, color };
    });

    // Generate 20 display hours as shown in screenshot (5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
    return hourLabels.map((displayHour, hourIdx) => {
      const hourStartMs = dayStartMs + hourIdx * 3600 * 1000;

      // 6 blocks per hour (each block = 10 minutes)
      const blocks = Array.from({ length: 6 }, (_, blockIdx) => {
        const blockStartMs = hourStartMs + blockIdx * 600 * 1000;
        const blockEndMs = blockStartMs + 600 * 1000;

        // Check if any session overlaps with this 10-minute block
        const match = sessionIntervals.find(
          (sess) => sess.sMs < blockEndMs && sess.eMs > blockStartMs
        );

        return {
          blockIdx,
          isFilled: !!match,
          color: match ? match.color : null,
        };
      });

      return {
        displayHour,
        blocks,
      };
    });
  }, [selectedDateStr, rolloverTime, daySessions, subjectColorMap]);

  const hasStudy = totalSeconds > 0;

  return (
    <div className="p-6 rounded-2xl bg-[#0f1015] border border-white/5 space-y-4 shadow-sm flex flex-col justify-between">
      {/* Header with full date */}
      <h3 className="font-serif text-sm font-medium text-slate-300 tracking-widest uppercase pb-3 border-b border-white/5">
        {formattedFullDate}
      </h3>

      {/* Visualizer Body: Left (Desk & Lamp Illustration) + Right (24-Hour Block Matrix) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-2">
        {/* Left: Desk & Lamp Vector Illustration */}
        <div className="sm:col-span-6 flex flex-col items-center justify-center p-4">
          <div className="w-44 h-44 flex items-center justify-center relative">
            <svg
              viewBox="0 0 160 160"
              className="w-full h-full"
              fill="none"
              stroke={hasStudy ? '#38bdf8' : '#475569'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Desk */}
              <path d="M 25 105 L 135 105" />
              <path d="M 25 105 L 25 140" />
              <path d="M 135 105 L 135 140" />
              <path d="M 25 115 L 135 115" />

              {/* Desk Lamp */}
              <path d="M 115 105 L 115 75" />
              <path d="M 100 75 L 130 75 L 122 55 L 108 55 Z" />

              {hasStudy ? (
                <>
                  {/* Lamp Light Radiance */}
                  <line x1="100" y1="82" x2="88" y2="95" strokeDasharray="3 3" opacity="0.6" />
                  <line x1="115" y1="82" x2="110" y2="98" strokeDasharray="3 3" opacity="0.6" />

                  {/* Student Sitting at Desk (Focused Posture) */}
                  {/* Head */}
                  <circle cx="70" cy="58" r="16" />
                  {/* Headband / Focus stripe */}
                  <path d="M 52 56 Q 70 52 88 56" strokeWidth="2.5" />
                  {/* Headband Knot */}
                  <path d="M 52 56 L 46 64" strokeWidth="2.5" />
                  <path d="M 52 56 L 44 58" strokeWidth="2.5" />
                  {/* Torso & Arms resting on desk */}
                  <path d="M 50 105 C 50 82 90 82 90 105" />
                  {/* Motion / Focus Sparkles above head */}
                  <g stroke="#38bdf8" strokeWidth="2.5" opacity="0.8">
                    <line x1="38" y1="46" x2="44" y2="40" />
                    <line x1="44" y1="36" x2="50" y2="30" />
                    <line x1="52" y1="48" x2="58" y2="42" />
                  </g>
                </>
              ) : null}
            </svg>
          </div>

          {/* Time display beneath illustration */}
          <div className="mt-2 text-center">
            {hasStudy ? (
              <span className="font-serif text-2xl sm:text-3xl text-[#38bdf8] font-normal tracking-wide tabular-nums">
                {formatSeconds(totalSeconds)}
              </span>
            ) : (
              <span className="font-serif text-xs text-slate-500 uppercase tracking-widest">
                No focus recorded
              </span>
            )}
          </div>
        </div>

        {/* Right: 24-Hour Vertical Block Matrix (Matching Reference Images 3 & 5) */}
        <div className="sm:col-span-6 flex flex-col justify-center">
          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
            {gridData.map((row) => (
              <div key={row.displayHour} className="flex items-center gap-2 text-[10px] font-mono">
                {/* Hour Label (5, 6, 7 ... 12, 1, 2) */}
                <span className="w-4 text-right text-slate-500 text-[10px] shrink-0 font-medium">
                  {row.displayHour}
                </span>

                {/* 6 Ten-Minute Blocks */}
                <div className="grid grid-cols-6 gap-0.5 flex-1">
                  {row.blocks.map((b) => (
                    <div
                      key={b.blockIdx}
                      className="h-2.5 rounded-[2px] transition-colors"
                      style={{
                        backgroundColor: b.isFilled ? b.color || '#ef4444' : 'rgba(255, 255, 255, 0.03)',
                        border: b.isFilled ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                      title={`${row.displayHour}:${String(b.blockIdx * 10).padStart(2, '0')}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
