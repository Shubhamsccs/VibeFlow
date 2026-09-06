import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Settings, Sparkles, SunMedium, Zap, Globe } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

export default function Topbar() {
  const {
    openTaskModal,
    openSettingsModal,
    openProModal,
    openFreshStartModal,
    openAuthModal,
    isAuthenticated,
    googleUser,
    plan,
    user,
    tasks,
  } = useTaskStore();

  const isPro = plan === "pro" || plan === "lifetime";
  const todayStr = new Date().toLocaleDateString("en-CA");

  // Check if overdue tasks exist
  const overdueCount = useMemo(() => {
    return tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < todayStr).length;
  }, [tasks, todayStr]);

  const userInitial = (user.name || "A").trim()[0].toUpperCase();

  return (
    <header className="h-16 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0">
      {/* Left side: branding/tagline and link to landing page */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-white/[0.08] transition-all cursor-pointer group"
          title="Back to Landing Page & Workflows"
        >
          <Globe className="w-3.5 h-3.5 text-brand-primary group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Landing & Plans</span>
        </Link>

        <span className="text-xs font-semibold text-slate-500 hidden md:inline">
          Workspace: <strong className="text-white font-bold">{user.role || "Personal"}</strong>
        </span>
      </div>

      {/* Right side: Actions & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Anti-Guilt Fresh Start Trigger (Only shown if overdue tasks exist) */}
        {overdueCount > 0 && (
          <button
            onClick={openFreshStartModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all cursor-pointer animate-pulse"
            title="Clean your overdue backlog"
          >
            <SunMedium className="w-3.5 h-3.5" />
            <span>{overdueCount} Overdue</span>
          </button>
        )}

        {/* View Plans / Upgrade to Pro / Pro Badge */}
        {!isPro ? (
          <button
            onClick={openProModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary/15 border border-brand-primary/40 text-brand-primary text-xs font-bold hover:bg-brand-primary/25 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>View Plans</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-brand-primary/30 text-brand-primary text-[10px] font-black uppercase tracking-wider">
            <Zap className="w-3 h-3 fill-current" /> {plan}
          </span>
        )}

        {/* Google Sign-in status button */}
        {!isAuthenticated ? (
          <button
            onClick={openAuthModal}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Sign In</span>
          </button>
        ) : null}

        {/* New Task Button */}
        <button
          onClick={() => openTaskModal()}
          className="btn-primary py-2 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>

        {/* Settings button */}
        <button
          onClick={openSettingsModal}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors border border-transparent hover:border-white/[0.08] cursor-pointer"
          title="Settings & Workspaces"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <button
          onClick={openSettingsModal}
          className="w-8 h-8 rounded-xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-xs shadow-md shadow-brand-primary/20 cursor-pointer overflow-hidden border border-white/10"
          title={user.name}
        >
          {googleUser?.avatar ? (
            <img src={googleUser.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            userInitial
          )}
        </button>
      </div>
    </header>
  );
}
