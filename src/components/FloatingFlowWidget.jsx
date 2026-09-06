import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  CheckCircle,
  X,
  Radio,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  StickyNote,
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import { audioEngine } from "../utils/audioEngine";

export default function FloatingFlowWidget() {
  const {
    activeFlow,
    tickFlow,
    pauseFlow,
    resumeFlow,
    stopFlow,
    updateFlowContextNote,
    toggleFlowSubtask,
    setFlowAmbientSound,
    openProModal,
    plan,
  } = useTaskStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [pipWindow, setPipWindow] = useState(null);
  const isPro = plan === "pro" || plan === "lifetime";

  // Interval timer tick
  useEffect(() => {
    if (!activeFlow || !activeFlow.isRunning) return;
    const interval = setInterval(() => {
      tickFlow();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeFlow, tickFlow]);

  // Tab Title Ticker Sync: updates document.title across browser tabs
  useEffect(() => {
    if (!activeFlow) {
      document.title = "VibeFlow";
      return;
    }
    const mins = Math.floor(activeFlow.remainingSeconds / 60);
    const secs = activeFlow.remainingSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    const statusIcon = activeFlow.isRunning ? "▶" : "⏸";
    document.title = `${statusIcon} [${timeStr}] ${activeFlow.title} • VibeFlow`;

    return () => {
      document.title = "VibeFlow";
    };
  }, [activeFlow]);

  // Handle ambient audio playback
  useEffect(() => {
    if (!activeFlow || !activeFlow.isRunning || activeFlow.ambientSound === "none") {
      audioEngine.stop();
    } else {
      audioEngine.setVolume(activeFlow.ambientVolume ?? 0.5);
      audioEngine.play(activeFlow.ambientSound);
    }
    return () => {
      if (!activeFlow) audioEngine.stop();
    };
  }, [activeFlow]);

  // Document Picture-in-Picture (PiP) Window
  const handleLaunchPiP = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("Document Picture-in-Picture is supported in modern Chrome, Edge, and Opera browsers. In other browsers, use this sleek floating dock!");
      return;
    }

    try {
      if (pipWindow) {
        pipWindow.close();
        setPipWindow(null);
        return;
      }

      const pip = await window.documentPictureInPicture.requestWindow({
        width: 360,
        height: 480,
      });

      // Copy stylesheets to PiP window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = styleSheet.type;
            link.media = styleSheet.media;
            link.href = styleSheet.href;
            pip.document.head.appendChild(link);
          } else if (styleSheet.cssRules) {
            const style = document.createElement("style");
            [...styleSheet.cssRules].forEach((rule) => {
              style.appendChild(document.createTextNode(rule.cssText));
            });
            pip.document.head.appendChild(style);
          }
        } catch {
          // Ignore cross-origin stylesheet limits
        }
      });

      pip.document.body.className = "bg-slate-950 text-slate-100 p-4 font-sans select-none";
      pip.addEventListener("pagehide", () => setPipWindow(null));
      setPipWindow(pip);
    } catch (err) {
      console.warn("PiP launch error:", err);
    }
  };

  if (!activeFlow) return null;

  const mins = Math.floor(activeFlow.remainingSeconds / 60);
  const secs = activeFlow.remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const progressPercent = Math.round(
    ((activeFlow.totalSeconds - activeFlow.remainingSeconds) / activeFlow.totalSeconds) * 100
  );

  const widgetContent = (
    <div className="flex flex-col gap-3">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-ping" />
          <span className="text-xs font-semibold text-white truncate max-w-[180px]">
            {activeFlow.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleLaunchPiP}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Always-on-top PiP Mini Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex items-center justify-between bg-slate-900/90 rounded-xl p-3 border border-white/[0.08]">
        <div>
          <div className="text-2xl font-black tracking-tight font-heading text-white">
            {timeFormatted}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            {activeFlow.isRunning ? "Focus Block Active" : "Paused"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFlow.isRunning ? (
            <button
              onClick={pauseFlow}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Pause"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={resumeFlow}
              className="p-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all cursor-pointer shadow-lg shadow-brand-primary/25"
              title="Resume"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}

          <button
            onClick={() => {
              audioEngine.playCompletionChime();
              stopFlow(true, 5);
            }}
            className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
            title="Complete Task"
          >
            <CheckCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => stopFlow(false, 3)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Discard Session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-brand-primary to-brand-cyan transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="space-y-3 pt-1 border-t border-white/[0.06] animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
              <StickyNote className="w-3 h-3 text-brand-primary" />
              Interruption Note (Where left off)
            </div>
            <input
              type="text"
              value={activeFlow.contextNote || ""}
              onChange={(e) => updateFlowContextNote(e.target.value)}
              placeholder="e.g. debugging line 42..."
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-brand-cyan" />
                Focus Soundscape
              </span>
              {!isPro && (
                <span
                  onClick={openProModal}
                  className="text-[9px] text-amber-400 hover:underline cursor-pointer"
                >
                  Pro Feature
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "none", label: "Off" },
                { id: "binaural", label: "Alpha" },
                { id: "brown", label: "Brown" },
                { id: "rain", label: "Rain" },
              ].map((snd) => (
                <button
                  key={snd.id}
                  onClick={() => {
                    if (snd.id !== "none" && !isPro) {
                      openProModal();
                      return;
                    }
                    setFlowAmbientSound(snd.id);
                  }}
                  className={`py-1 px-2 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    activeFlow.ambientSound === snd.id
                      ? "bg-brand-primary/20 border-brand-primary text-white"
                      : "bg-slate-900 border-white/[0.06] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>
          </div>

          {activeFlow.subtasks && activeFlow.subtasks.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Micro-Checkpoints
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {activeFlow.subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleFlowSubtask(st.id)}
                      className="rounded border-slate-700 text-brand-primary focus:ring-0 bg-slate-900"
                    />
                    <span className={st.completed ? "line-through text-slate-500" : ""}>
                      {st.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 w-80 glass-dock rounded-2xl p-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {widgetContent}
      </div>
      {pipWindow && createPortal(widgetContent, pipWindow.document.body)}
    </>
  );
}
