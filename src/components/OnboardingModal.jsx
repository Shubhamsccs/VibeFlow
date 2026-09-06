import { useState } from "react";
import { Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { useTaskStore, WORKFLOW_PRESETS } from "../store/useTaskStore";

export default function OnboardingModal() {
  const { user, completeOnboarding } = useTaskStore();
  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("software-dev");
  const [step, setStep] = useState(1);

  if (user.hasCompletedOnboarding) return null;

  const handleFinish = () => {
    completeOnboarding(
      {
        name: name.trim() || "Productivity Architect",
      },
      selectedPreset
    );
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl glass-panel border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Subtle accent backdrop glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />

        {step === 1 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-lg shadow-brand-primary/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Welcome to VibeFlow
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  The flow-first, anti-burnout productivity command center.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex, Jordan..."
                  autoFocus
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary transition-all"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] text-xs text-slate-400 leading-relaxed">
                VibeFlow is engineered to keep you in flow state without the cognitive overwhelm of bloated enterprise tools or robotic AI scheduling.
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="btn-primary py-3 px-6 rounded-xl flex items-center gap-2 text-sm font-semibold cursor-pointer shadow-lg shadow-brand-primary/25"
              >
                Choose Workflow <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Select Your Starting Workspace
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pick a battle-tested workflow structure. You can customize, recolor, and rename columns anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {Object.values(WORKFLOW_PRESETS).map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-brand-primary/10 border-brand-primary text-white shadow-lg shadow-brand-primary/10"
                        : "bg-slate-900/60 border-white/[0.06] text-slate-300 hover:border-white/[0.15] hover:bg-slate-800/40"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-brand-primary">
                        <CheckCircle className="w-4 h-4 fill-brand-primary text-slate-950" />
                      </div>
                    )}
                    <div className="font-bold text-sm text-white">{preset.name}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.columns.slice(0, 4).map((c) => (
                        <span
                          key={c.id}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800"
                        >
                          {c.title}
                        </span>
                      ))}
                      {preset.columns.length > 4 && (
                        <span className="text-[10px] text-slate-500">+{preset.columns.length - 4}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="btn-primary py-3 px-6 rounded-xl flex items-center gap-2 text-sm font-semibold cursor-pointer shadow-lg shadow-brand-primary/25"
              >
                Launch Workspace <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
