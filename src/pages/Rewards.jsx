import { useState, useEffect, useMemo, useRef } from "react";
import {
  Trophy, Flame, CheckCircle2, Circle, Moon, MoreVertical,
  Plus, Archive, ChevronDown, ChevronUp, ChevronRight, Star, Zap,
  Lock, PartyPopper, Trash2, X, AlertTriangle, Crown,
  Sparkles, Target, TrendingUp, Calendar, Clock
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

// ─── Constants ────────────────────────────────────────────────────────────────


const TASK_REWARDS = [
  { id: "t-10",   target: 10,   title: "Watch Reels / Instagram",   subtitle: "30 minutes",             tier: "small",     emoji: "📱" },
  { id: "t-25",   target: 25,   title: "Play a Game",               subtitle: "1 hour",                 tier: "small",     emoji: "🎮" },
  { id: "t-50",   target: 50,   title: "Give Yourself a Treat",     subtitle: "₹20 reward",              tier: "medium",    emoji: "🍩" },
  { id: "t-75",   target: 75,   title: "Watch a Movie",             subtitle: "Movie night",             tier: "medium",    emoji: "🎬" },
  { id: "t-100",  target: 100,  title: "Order Your Favourite Food", subtitle: "Well deserved!",          tier: "medium",    emoji: "🍕" },
  { id: "t-150",  target: 150,  title: "Take an Evening Off",       subtitle: "You earned it",           tier: "large",     emoji: "🌅" },
  { id: "t-200",  target: 200,  title: "A Day Trip or Outing",      subtitle: "Your choice",             tier: "large",     emoji: "🏞️" },
  { id: "t-300",  target: 300,  title: "Buy Something You Want",    subtitle: "You've been wanting it",  tier: "legendary", emoji: "🛍️" },
  { id: "t-400",  target: 400,  title: "Full Day Off",              subtitle: "Rest & recharge",         tier: "legendary", emoji: "😴" },
  { id: "t-500",  target: 500,  title: "Fancy Dinner or Outing",    subtitle: "Celebrate big",           tier: "legendary", emoji: "🍽️" },
  { id: "t-750",  target: 750,  title: "Weekend Getaway",           subtitle: "You're elite",            tier: "legendary", emoji: "✈️" },
  { id: "t-1000", target: 1000, title: "Whatever You Want",         subtitle: "No limits — you earned it", tier: "legendary", emoji: "👑" },
];

// Tasks completed per cycle (prestige resets every CYCLE_SIZE tasks)
const CYCLE_SIZE = 1000;

const TASK_CATEGORIES = [
  { id: "college",      label: "College Work",    accent: "#0000ff", accentLight: "#0000ff33" },
  { id: "myspace",      label: "MySpace",         accent: "#25d366", accentLight: "#25d36633" },
  { id: "dsa-java",     label: "DSA Java",        accent: "#e2e8f0", accentLight: "#e2e8f033" },
  { id: "web-dev",      label: "Web Development", accent: "#ff0000", accentLight: "#ff000033" },
  { id: "dsa-practice", label: "DSA Practice",    accent: "#ffd700", accentLight: "#ffd70033" },
];

const TIER_STYLES = {
  small:     { label: "Small",     color: "#22c55e", glow: "0 0 20px #22c55e55" },
  medium:    { label: "Medium",    color: "#f59e0b", glow: "0 0 20px #f59e0b55" },
  large:     { label: "Large",     color: "#ef4444", glow: "0 0 20px #ef444455" },
  legendary: { label: "Legendary", color: "#a855f7", glow: "0 0 30px #a855f7aa" },
};

const todayStr = () => new Date().toLocaleDateString("en-CA");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOnBreak(task) {
  if (!task.breakUntil) return false;
  return task.breakUntil >= todayStr();
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Returns current cycle (1-based) and progress within that cycle
function getCycleInfo(totalCount) {
  const cycle = Math.floor(totalCount / CYCLE_SIZE) + 1;
  const countInCycle = totalCount % CYCLE_SIZE;
  return { cycle, countInCycle };
}

function getProgress(current, rewards, claimed) {
  const lastClaimed = [...rewards].reverse().find(r => claimed.includes(r.id));
  const nextReward = rewards.find(r => !claimed.includes(r.id));
  const from = lastClaimed?.target ?? 0;
  const to = nextReward?.target ?? rewards[rewards.length - 1].target;
  const pct = Math.min(100, ((current - from) / (to - from)) * 100);
  return { from, to, pct: Math.max(0, pct), nextReward };
}

function normalizeStatus(status) {
  if (!status || status === "todo") return "college";
  if (status === "webdev") return "web-dev";
  if (status === "java") return "dsa-java";
  if (status === "practice") return "dsa-practice";
  return status;
}

// ─── Confetti Burst ───────────────────────────────────────────────────────────

function ConfettiBurst({ trigger }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ["#f59e0b", "#22c55e", "#a855f7", "#ef4444", "#3b82f6", "#ec4899"];
    const newParticles = Array.from({ length: 24 }, (_, i) => ({
      id: i, color: colors[i % colors.length],
      x: (Math.random() - 0.5) * 200, y: -(Math.random() * 150 + 50),
      rot: Math.random() * 360, size: Math.random() * 8 + 6,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1200);
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 50 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: "50%", top: "50%",
          width: p.size, height: p.size,
          backgroundColor: p.color,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          transform: `translate(-50%, -50%)`,
          animation: `confetti-fly 1.2s ease-out forwards`,
          "--tx": `${p.x}px`, "--ty": `${p.y}px`, "--rot": `${p.rot}deg`,
        }} />
      ))}
    </div>
  );
}

// ─── Type-to-Confirm Modal ─────────────────────────────────────────────────────

function TypeConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmWord, confirmLabel = "Confirm", confirmColor = "#ef4444" }) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (isOpen) setTyped(""); }, [isOpen]);
  if (!isOpen) return null;
  const matches = typed.trim().toLowerCase() === confirmWord?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: `${confirmColor}22` }}>
          <AlertTriangle className="w-8 h-8" style={{ color: confirmColor }} />
        </div>
        <h3 className="text-2xl font-black text-white text-center tracking-tight mb-2">{title}</h3>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">{message}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Type <span className="text-white font-black">"{confirmWord}"</span> to confirm
        </p>
        <input
          autoFocus
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder={confirmWord}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-all mb-6"
        />
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 bg-slate-800 hover:text-white transition-all">
            Cancel
          </button>
          <button
            onClick={() => { if (matches) { onConfirm(); onClose(); } }}
            disabled={!matches}
            className="py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: matches ? confirmColor : "#374151" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Break Date Picker ────────────────────────────────────────────────────────

function BreakPopover({ isOpen, onClose, onConfirm }) {
  const [date, setDate] = useState("");
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const minStr = minDate.toLocaleDateString("en-CA");

  if (!isOpen) return null;
  return (
    <div className="absolute right-0 top-8 z-40 bg-slate-800 border border-slate-700 rounded-2xl p-5 w-72 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Pause until</p>
      <input
        type="date" min={minStr} value={date}
        onChange={e => setDate(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 mb-4 transition-all"
      />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="py-2 rounded-xl text-xs font-black text-slate-400 bg-slate-900 uppercase tracking-widest hover:text-white transition-all">
          Cancel
        </button>
        <button
          onClick={() => { if (date) { onConfirm(date); onClose(); } }}
          disabled={!date}
          className="py-2 rounded-xl text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest hover:bg-amber-500/30 transition-all disabled:opacity-40"
        >
          Pause
        </button>
      </div>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function CompulsoryTaskRow({ task }) {
  const { toggleCompulsoryTaskToday, setTaskBreak, retireCompulsoryTask } = useTaskStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [breakOpen, setBreakOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);
  const menuRef = useRef(null);
  const onBreak = isOnBreak(task);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div className={`group flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 ${
        onBreak
          ? "bg-slate-900/30 border-slate-800/50 opacity-60"
          : task.completedToday
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
      }`}>
        <button
          onClick={() => !onBreak && toggleCompulsoryTaskToday(task.id)}
          disabled={onBreak}
          className="shrink-0 transition-transform hover:scale-110 disabled:cursor-not-allowed"
        >
          {task.completedToday
            ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            : <Circle className={`w-6 h-6 ${onBreak ? "text-slate-700" : "text-slate-500 group-hover:text-slate-400"}`} />
          }
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold transition-all ${
            task.completedToday ? "line-through text-slate-500" : onBreak ? "line-through text-slate-600" : "text-white"
          }`}>{task.title}</p>
          {onBreak && (
            <div className="flex items-center gap-2 mt-1">
              <Moon className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                On break until {formatDate(task.breakUntil + "T00:00:00")}
              </span>
              <button
                onClick={() => setTaskBreak(task.id, null)}
                className="text-[10px] font-black text-slate-500 hover:text-white underline transition-colors ml-1"
              >Resume</button>
            </div>
          )}
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-30 bg-slate-800 border border-slate-700 rounded-xl py-1 w-44 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => { setMenuOpen(false); setBreakOpen(true); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-slate-700 transition-colors"
              >
                <Moon className="w-3.5 h-3.5" /> Put on Break
              </button>
              <div className="border-t border-slate-700 my-1" />
              <button
                onClick={() => { setMenuOpen(false); setRetireOpen(true); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-slate-700 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" /> Retire Habit
              </button>
            </div>
          )}

          {breakOpen && (
            <BreakPopover
              isOpen={breakOpen}
              onClose={() => setBreakOpen(false)}
              onConfirm={(date) => setTaskBreak(task.id, date)}
            />
          )}
        </div>
      </div>

      <TypeConfirmModal
        isOpen={retireOpen}
        onClose={() => setRetireOpen(false)}
        onConfirm={() => retireCompulsoryTask(task.id)}
        title="Retire this Habit?"
        message="This habit will be archived with its full history preserved. It will no longer count toward your daily streak. You can permanently delete it from the Archive tab later."
        confirmWord={task.title}
        confirmLabel="Retire"
        confirmColor="#f59e0b"
      />
    </>
  );
}

// ─── Milestone Rail ───────────────────────────────────────────────────────────

function MilestoneRail({ rewards, current, claimedRewards, onClaim, accent = "#a855f7" }) {
  const [confettiTrigger, setConfettiTrigger] = useState(null);

  const handleClaim = (reward) => {
    onClaim(reward.id);
    setConfettiTrigger(reward.id);
  };

  // Overall progress for rail fill
  const pct = rewards.length === 0 ? 0 : Math.min(100, (current / rewards[rewards.length - 1].target) * 100);

  return (
    <div className="w-full">
      {/* Progress bar with milestone markers */}
      <div className="relative mb-6 px-1">
        <div className="h-1.5 bg-slate-900 rounded-full w-full">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})` }}
          />
        </div>
        {/* Tick marks */}
        {rewards.map((r) => {
          const pos = (r.target / rewards[rewards.length - 1].target) * 100;
          const reached = current >= r.target;
          const claimed = claimedRewards.includes(r.id);
          return (
            <div
              key={r.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${pos}%` }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border transition-all duration-300"
                style={{
                  backgroundColor: claimed ? accent : reached ? `${accent}aa` : "#18181b",
                  borderColor: claimed || reached ? accent : "#27272a",
                  boxShadow: reached && !claimed ? `0 0 6px ${accent}aa` : claimed ? `0 0 8px ${accent}` : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Reward cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {rewards.map(reward => {
          const reached = current >= reward.target;
          const claimed = claimedRewards.includes(reward.id);
          const tier = TIER_STYLES[reward.tier];
          const isNext = !claimed && rewards.find(r => !claimedRewards.includes(r.id))?.id === reward.id;

          return (
            <div
              key={reward.id}
              className={`relative rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                claimed
                  ? "bg-slate-950/20 border-slate-900/60 opacity-50"
                  : reached
                  ? "border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                  : isNext
                  ? "border-slate-800 bg-slate-900/40"
                  : "border-slate-900 bg-slate-950/40 opacity-40 hover:opacity-50"
              }`}
              style={{
                boxShadow: isNext && reached ? `0 0 20px ${accent}33` : "none",
                animation: isNext && reached ? "pulse-glow 2s ease-in-out infinite" : "none",
              }}
            >
              <ConfettiBurst trigger={confettiTrigger === reward.id} />

              <div>
                {/* Card Header (Tier badge & target) */}
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                    style={{
                      color: tier.color,
                      borderColor: `${tier.color}33`,
                      backgroundColor: `${tier.color}05`,
                    }}
                  >
                    {tier.label}
                  </span>
                  <span className="text-slate-500 text-[10px] font-bold">
                    {reward.target} tasks
                  </span>
                </div>

                {/* Emoji, Title & Subtitle */}
                <div className="mb-3">
                  <div className="text-xl mb-1">
                    {claimed ? "✅" : reached ? reward.emoji : "🔒"}
                  </div>
                  <p className={`text-xs font-bold transition-all ${claimed ? "text-slate-500 line-through" : reached ? "text-white" : "text-slate-300"}`}>
                    {reward.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{reward.subtitle}</p>
                </div>
              </div>

              {/* Status and Action Section */}
              <div className="mt-2 pt-2 border-t border-slate-900/50">
                {/* Progress bar (only for the NEXT in-progress locked milestone) */}
                {isNext && !reached && (
                  <div className="mb-2">
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-1 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (current / reward.target) * 100)}%`,
                          background: accent,
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">
                      {current}/{reward.target} — {reward.target - current} to go
                    </p>
                  </div>
                )}

                {/* Claim Button */}
                {reached && !claimed && (
                  <button
                    onClick={() => handleClaim(reward)}
                    className="w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  >
                    Claim 🎉
                  </button>
                )}

                {claimed && (
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center py-1">
                    Claimed ✓
                  </p>
                )}

                {!reached && !claimed && !isNext && (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <Lock className="w-3 h-3 text-slate-600" />
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Locked</p>
                  </div>
                )}

                {!reached && !claimed && isNext && (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">In Progress</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Archive Card ─────────────────────────────────────────────────────────────

function ArchiveCard({ entry }) {
  const { permanentlyDeleteArchivedTask } = useTaskStore();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-slate-800 p-5 bg-slate-900/20 transition-all hover:border-slate-700">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-500/70 shrink-0" />
              <p className="text-sm font-bold text-slate-200 truncate">{entry.title}</p>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              {formatDate(entry.addedAt)} → {formatDate(entry.retiredAt)}
            </p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 cursor-pointer"
            title="Permanently delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
            <p className="text-lg font-black text-white">{entry.totalDaysCompleted}</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">days done</p>
          </div>
          <div className="text-center p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
            <p className="text-lg font-black text-amber-400">{entry.bestStreak}</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">best streak</p>
          </div>
          <div className="text-center p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
            <p className="text-lg font-black text-emerald-400">{entry.completionRate ?? "—"}%</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">completion</p>
          </div>
        </div>

        {/* Activity bar */}
        <div>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Activity</p>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${entry.completionRate ?? 0}%`,
                background: "linear-gradient(90deg, #f59e0b88, #f59e0b)",
              }}
            />
          </div>
        </div>
      </div>

      <TypeConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => permanentlyDeleteArchivedTask(entry.id)}
        title="Permanently Delete?"
        message="This will wipe all history for this retired habit. This action cannot be undone."
        confirmWord={entry.title}
        confirmLabel="Delete Forever"
        confirmColor="#ef4444"
      />
    </>
  );
}

// ─── Streak Tab ───────────────────────────────────────────────────────────────

function StreakTab() {
  const {
    compulsoryTasks, streakCount, addCompulsoryTask, checkAndResetDaily,
  } = useTaskStore();

  const [newTask, setNewTask] = useState("");

  useEffect(() => { checkAndResetDaily(); }, []);

  const activeTasks = compulsoryTasks.filter(t => !isOnBreak(t));
  const allActiveDone = activeTasks.length > 0 && activeTasks.every(t => t.completedToday);
  const doneCount = activeTasks.filter(t => t.completedToday).length;
  const pausedTasks = compulsoryTasks.filter(t => isOnBreak(t));

  const handleAddTask = () => {
    const title = newTask.trim();
    if (title) { addCompulsoryTask(title); setNewTask(""); }
  };

  return (
    <div className="space-y-6">
      {/* Streak hero */}
      <div className="relative rounded-2xl p-6 overflow-hidden border border-slate-800 bg-slate-900/30 backdrop-blur-xs">
        <div className="absolute inset-0 opacity-[0.03] bg-radial-[circle_at_20%_50%] from-amber-500 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 shrink-0">
                <Flame className="w-8 h-8 text-amber-500" />
              </div>
              {allActiveDone && (
                <div className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-emerald-500 rounded-full flex items-center justify-center border border-slate-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Current Streak</p>
              <p className="text-3xl font-black text-white tracking-tight">{streakCount}
                <span className="text-sm text-amber-500 ml-1.5 font-bold uppercase tracking-wider">days</span>
              </p>
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-sm font-bold text-slate-300">
              {activeTasks.length === 0
                ? "No active habits — add one below"
                : allActiveDone
                ? "✨ Daily habits done! Streak secured."
                : `${doneCount} of ${activeTasks.length} habits done today`
              }
            </p>
            {pausedTasks.length > 0 && (
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-1">
                ⏸️ {pausedTasks.length} habit{pausedTasks.length > 1 ? "s" : ""} on break
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Daily checklist */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/10">
        <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Today's Habits</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {doneCount}/{activeTasks.length} done
          </span>
        </div>

        <div className="p-4 space-y-2">
          {compulsoryTasks.length === 0 && (
            <div className="flex flex-col items-center py-8 text-slate-600">
              <Circle className="w-6 h-6 opacity-20 mb-2" />
              <p className="text-xs font-medium">No habits yet. Add one below.</p>
            </div>
          )}
          {compulsoryTasks.map(task => (
            <CompulsoryTaskRow key={task.id} task={task} />
          ))}
        </div>

        {/* Add task input */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 p-1 bg-slate-950/40 rounded-xl border border-slate-800/80 focus-within:border-brand-primary/50 transition-colors">
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddTask()}
              placeholder="Add a new daily habit..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
            />
            <button
              onClick={handleAddTask}
              disabled={!newTask.trim()}
              className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Rewards Tab ──────────────────────────────────────────────────────────

function TaskRewardsTab() {
  const { tasks, claimedRewards, claimReward } = useTaskStore();
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const categoryCounts = useMemo(() => {
    const counts = {};
    TASK_CATEGORIES.forEach(c => { counts[c.id] = 0; });
    // Done tasks preserve their category field from when they were created
    tasks.filter(t => t.status === "done").forEach(t => {
      // category is saved as the column id at creation time (see TaskModal handleSubmit)
      const rawCat = t.category || t.status;
      const catId = normalizeStatus(rawCat);
      if (counts[catId] !== undefined) counts[catId]++;
      else counts["college"]++;
    });
    return counts;
  }, [tasks]);

  // Build per-category, per-cycle reward IDs so they don't conflict
  // Each cycle gets unique IDs: `${catId}-c${cycle}-${rewardId}`
  const categoryRewards = (catId, cycle) =>
    TASK_REWARDS.map(r => ({ ...r, id: `${catId}-c${cycle}-${r.id}` }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 mb-2">
        <Zap className="w-4 h-4 text-brand-primary" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Each category has its own independent reward track · Resets every 1000 tasks (prestige)
        </p>
      </div>

      {TASK_CATEGORIES.map(cat => {
        const count = categoryCounts[cat.id] ?? 0;
        const { cycle, countInCycle } = getCycleInfo(count);
        const rewards = categoryRewards(cat.id, cycle);
        // Rewards ready to claim (reached target but not yet claimed)
        const claimableRewards = rewards.filter(r => !claimedRewards.includes(r.id) && countInCycle >= r.target);
        // Next reward that's genuinely still locked (not yet reached)
        const nextLockedReward = rewards.find(r => !claimedRewards.includes(r.id) && countInCycle < r.target);
        const allDone = !nextLockedReward && claimableRewards.length === 0;
        const isExpanded = !!expandedCategories[cat.id];

        return (
          <div key={cat.id} className="rounded-2xl border overflow-hidden transition-all duration-300"
            style={{ borderColor: `${cat.accent}22`, backgroundColor: `${cat.accent}05` }}>

            {/* Category header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${cat.accent}22` }}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.accent }} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{cat.label}</h3>
                    {cycle > 1 && (
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                        style={{ color: "#a855f7", borderColor: "#a855f744", backgroundColor: "#a855f711" }}
                      >
                        🔄 Cycle {cycle}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-bold">
                    <span className="text-white font-black">{count}</span> total ·{" "}
                    <span style={{ color: cat.accent }} className="font-black">{countInCycle}</span>/{CYCLE_SIZE} this cycle
                  </p>
                </div>
              </div>

              {/* Mini progress / claim status */}
              {claimableRewards.length > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs font-black text-emerald-400">
                      {claimableRewards.length} ready!
                    </p>
                  </div>
                  {nextLockedReward && (
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      next: {nextLockedReward.target - countInCycle} to go
                    </p>
                  )}
                </div>
              )}
              {!claimableRewards.length && nextLockedReward && (
                <div className="text-right">
                  <p className="text-xs font-black" style={{ color: cat.accent }}>
                    {nextLockedReward.target - countInCycle} to go
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    next: {nextLockedReward.title}
                  </p>
                </div>
              )}
              {allDone && (
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-400">Cycle {cycle} complete!</span>
                </div>
              )}
            </div>

            {/* Quick Claim Area if rewards are ready (visible even when collapsed) */}
            {claimableRewards.length > 0 && (
              <div className="px-6 py-4 bg-emerald-500/5 border-b border-emerald-500/10 flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5">
                  <PartyPopper className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    Rewards Ready to Claim!
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {claimableRewards.map(reward => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-slate-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{reward.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{reward.title}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{reward.subtitle} ({reward.target} tasks)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => claimReward(reward.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Claim 🎉
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slim progress bar — shows cycle progress */}
            <div className="px-6 py-3" style={{ backgroundColor: `${cat.accent}08` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                  Cycle {cycle} progress
                </span>
                <span className="text-[9px] font-black" style={{ color: cat.accent }}>
                  {countInCycle} / {CYCLE_SIZE}
                </span>
              </div>
              <div className="h-1 bg-slate-900 rounded-full">
                <div
                  className="h-1 rounded-full transition-all duration-700"
                  style={{
                    width: `${(countInCycle / CYCLE_SIZE) * 100}%`,
                    background: `linear-gradient(90deg, ${cat.accent}66, ${cat.accent})`,
                  }}
                />
              </div>
            </div>

            {/* Collapsible Milestone Rail */}
            {isExpanded && (
              <div className="p-6 border-t border-slate-900/40 bg-slate-950/20 animate-in fade-in slide-in-from-top-1 duration-200">
                <MilestoneRail
                  rewards={rewards}
                  current={countInCycle}
                  claimedRewards={claimedRewards}
                  onClaim={claimReward}
                  accent={cat.accent}
                />
              </div>
            )}

            {/* Toggle Footer */}
            <button
              onClick={() => toggleExpand(cat.id)}
              className="w-full py-2.5 bg-slate-900/30 hover:bg-slate-900/50 border-t border-slate-800/40 flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all cursor-pointer"
            >
              {isExpanded ? (
                <>
                  Hide Rewards Map <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                </>
              ) : (
                <>
                  View Rewards Map & Milestones <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Archive Tab ──────────────────────────────────────────────────────────────

function ArchiveTab() {
  const { archivedCompulsoryTasks } = useTaskStore();

  if (archivedCompulsoryTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-600">
        <div className="w-20 h-20 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 opacity-20" />
        </div>
        <h3 className="text-lg font-bold text-slate-500 mb-2">No retired habits yet</h3>
        <p className="text-sm text-center max-w-xs">
          When you retire a compulsory habit from the Streak tab, its full history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Crown className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
          Habits you've built and graduated from
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {archivedCompulsoryTasks.map(entry => (
          <ArchiveCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "streak",  label: "Streak Rewards", icon: Flame,   shortDesc: "Daily habits" },
  { id: "tasks",   label: "Task Rewards",   icon: Target,  shortDesc: "Category goals" },
  { id: "archive", label: "Archive",        icon: Archive, shortDesc: "Retired habits" },
];

export default function Rewards() {
  const [activeTab, setActiveTab] = useState("streak");
  const { streakCount, compulsoryTasks, archivedCompulsoryTasks, tasks, claimedRewards } = useTaskStore();

  const archivedCount = archivedCompulsoryTasks.length;
  const totalDone = tasks.filter(t => t.status === "done").length;
  const totalClaimed = claimedRewards.length;

  return (
    <>
      <style>{`
        @keyframes confetti-fly {
          0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px var(--accent-color, #a855f7); }
          50% { box-shadow: 0 0 25px var(--accent-color, #a855f7); }
        }
      `}</style>

      <div className="space-y-6 pb-12 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Rewards <span className="text-brand-primary">Hub</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
              Earn rewards by building habits & completing tasks
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-black text-orange-400">{streakCount} day streak</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
              <Trophy className="w-3.5 h-3.5 text-brand-primary" />
              <span className="text-xs font-black text-brand-primary">{totalClaimed} claimed</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-900/30 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 border relative ${
                activeTab === tab.id
                  ? "bg-white text-black border-white shadow-xl"
                  : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "archive" && archivedCount > 0 && (
                <span className="w-4 h-4 bg-amber-500 text-black text-[8px] font-black rounded-full flex items-center justify-center">
                  {archivedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">
          {activeTab === "streak"  && <StreakTab />}
          {activeTab === "tasks"   && <TaskRewardsTab />}
          {activeTab === "archive" && <ArchiveTab />}
        </div>
      </div>
    </>
  );
}
