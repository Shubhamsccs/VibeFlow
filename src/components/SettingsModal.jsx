import { useState } from "react";
import {
  X,
  User,
  Columns,
  Calendar,
  CreditCard,
  Download,
  Upload,
  Trash2,
  Plus,
} from "lucide-react";
import { useTaskStore, WORKFLOW_PRESETS } from "../store/useTaskStore";

const ACCENT_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#94a3b8", // Slate
];

export default function SettingsModal() {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    user,
    updateUserProfile,
    columns,
    addColumn,
    updateColumn,
    deleteColumn,
    applyPresetWorkflow,
    restDays,
    toggleRestDay,
    plan,
    setPlan,
    verifyLicenseKey,
    openResetModal,
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'columns' | 'rest' | 'plan' | 'data'
  const [newColTitle, setNewColTitle] = useState("");
  const [newColAccent] = useState(ACCENT_COLORS[0]);
  const [keyInput, setKeyInput] = useState("");
  const [keyMessage, setKeyMessage] = useState(null);

  if (!isSettingsModalOpen) return null;

  // Export JSON backup
  const handleExportData = () => {
    const rawData = localStorage.getItem("vibeflow-store-v2");
    const blob = new Blob([rawData || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vibeflow-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.state) {
          localStorage.setItem("vibeflow-store-v2", JSON.stringify(parsed));
          window.location.reload();
        } else {
          alert("Invalid backup file format.");
        }
      } catch {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    addColumn({
      id: `col-${Date.now()}`,
      title: newColTitle.trim(),
      accent: newColAccent,
    });
    setNewColTitle("");
  };

  const handleActivateKey = (e) => {
    e.preventDefault();
    const res = verifyLicenseKey(keyInput);
    if (res.success) {
      setKeyMessage({ ok: true, text: `Successfully activated ${res.plan.toUpperCase()} plan!` });
    } else {
      setKeyMessage({ ok: false, text: res.message });
    }
  };

  const todayStr = new Date().toLocaleDateString("en-CA");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA");

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-2xl glass-panel border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl my-auto">
        <button
          onClick={closeSettingsModal}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-white tracking-tight mb-6">
          Settings & Workspaces
        </h2>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] pb-3 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "columns", label: "Board Columns", icon: Columns },
            { id: "rest", label: "Rest Days", icon: Calendar },
            { id: "plan", label: "Subscription", icon: CreditCard },
            { id: "data", label: "Data Backup", icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Profile */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => updateUserProfile({ name: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Role / Title
              </label>
              <input
                type="text"
                value={user.role || ""}
                onChange={(e) => updateUserProfile({ role: e.target.value })}
                placeholder="e.g. Software Engineer, Designer, Founder..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Daily Focus Target (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={Math.round((user.dailyFocusTargetMinutes || 240) / 60)}
                onChange={(e) =>
                  updateUserProfile({ dailyFocusTargetMinutes: Number(e.target.value) * 60 })
                }
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Used to calculate your daily cognitive capacity and burnout warnings.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Board Columns */}
        {activeTab === "columns" && (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Current Columns ({columns.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {columns.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: col.accent }}
                      />
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                        className="bg-transparent text-xs font-semibold text-white focus:outline-none focus:underline"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {ACCENT_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateColumn(col.id, { accent: color })}
                            className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                              col.accent === color ? "scale-125 ring-2 ring-white/40" : "opacity-60 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      {columns.length > 1 && (
                        <button
                          onClick={() => deleteColumn(col.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete column"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Column Form */}
            <form onSubmit={handleAddColumn} className="flex items-center gap-2">
              <input
                type="text"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder="+ Add custom column..."
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {/* Starter Presets */}
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">
                Apply Workflow Preset:
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(WORKFLOW_PRESETS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (confirm(`Apply "${p.name}" preset? This updates your columns.`)) {
                        applyPresetWorkflow(p.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.06] text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Rest Days / Vacation */}
        {activeTab === "rest" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Rest days prevent burnout. When a day is scheduled as a Rest Day, your habit streak is automatically frozen and safe without burning shields.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => toggleRestDay(todayStr)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  restDays.includes(todayStr)
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-slate-900 border-white/[0.08] text-slate-300 hover:text-white"
                }`}
              >
                {restDays.includes(todayStr) ? "Today is a Rest Day (Active)" : "Mark Today as Rest Day"}
              </button>

              <button
                onClick={() => toggleRestDay(tomorrowStr)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  restDays.includes(tomorrowStr)
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-slate-900 border-white/[0.08] text-slate-300 hover:text-white"
                }`}
              >
                {restDays.includes(tomorrowStr) ? "Tomorrow is a Rest Day" : "Schedule Tomorrow as Rest Day"}
              </button>
            </div>

            {restDays.length > 0 && (
              <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-white/[0.04] text-[11px] text-slate-400">
                Scheduled Rest Dates: {restDays.join(", ")}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Subscription & Plan */}
        {activeTab === "plan" && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.08] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Current Plan</div>
                <div className="text-lg font-black text-white capitalize">{plan} Plan</div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  plan === "lifetime"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : plan === "pro"
                    ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {plan === "free" ? "Free Starter" : plan}
              </span>
            </div>

            <form onSubmit={handleActivateKey} className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Activate License Key
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="VIBE-PRO-XXXX or VIBE-LIFETIME-XXXX"
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/[0.08] cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {keyMessage && (
                <div className={`text-xs ${keyMessage.ok ? "text-emerald-400" : "text-rose-400"}`}>
                  {keyMessage.text}
                </div>
              )}
            </form>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span>Developer Quick Switch:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlan("free")}
                  className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                    plan === "free" ? "bg-slate-800 text-white" : "hover:text-slate-200"
                  }`}
                >
                  Free
                </button>
                <button
                  onClick={() => setPlan("pro")}
                  className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                    plan === "pro" ? "bg-brand-primary text-white" : "hover:text-slate-200"
                  }`}
                >
                  Pro
                </button>
                <button
                  onClick={() => setPlan("lifetime")}
                  className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                    plan === "lifetime" ? "bg-amber-500 text-slate-950 font-bold" : "hover:text-slate-200"
                  }`}
                >
                  Lifetime
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Data Backup */}
        {activeTab === "data" && (
          <div className="space-y-5">
            <p className="text-xs text-slate-300 leading-relaxed">
              Your data stays in your browser. Download encrypted JSON snapshots anytime to keep your history safe or migrate to another device.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] hover:border-brand-primary/40 text-left transition-all cursor-pointer flex items-center gap-3"
              >
                <Download className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Download Backup</div>
                  <div className="text-[10px] text-slate-500">Export JSON file</div>
                </div>
              </button>

              <label className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] hover:border-brand-primary/40 text-left transition-all cursor-pointer flex items-center gap-3">
                <Upload className="w-5 h-5 text-brand-cyan shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Restore Backup</div>
                  <div className="text-[10px] text-slate-500">Upload JSON file</div>
                </div>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-rose-400">Hard Reset Workspace</div>
                <div className="text-[10px] text-slate-500">Wipes all tasks and history permanently.</div>
              </div>
              <button
                onClick={() => {
                  closeSettingsModal();
                  openResetModal();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
              >
                Reset Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
