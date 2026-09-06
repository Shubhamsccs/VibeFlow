import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import TaskModal from "../components/TaskModal";
import FloatingFlowWidget from "../components/FloatingFlowWidget";
import OnboardingModal from "../components/OnboardingModal";
import PricingModal from "../components/PricingModal";
import FreshStartModal from "../components/FreshStartModal";
import SettingsModal from "../components/SettingsModal";
import GoogleAuthModal from "../components/GoogleAuthModal";
import { useTaskStore } from "../store/useTaskStore";
import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";

export default function MainLayout() {
  const {
    isTaskModalOpen,
    closeTaskModal,
    taskToEdit,
    isResetModalOpen,
    closeResetModal,
    resetStore,
    shieldConsumedToday,
    dismissShieldNotification,
    checkAndResetDaily,
  } = useTaskStore();
  const navigate = useNavigate();

  // Run daily check on mount (streaks, auto-shields, rest days)
  useEffect(() => {
    checkAndResetDaily();
  }, [checkAndResetDaily]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.contentEditable === "true"
      ) {
        return;
      }

      const shortcuts = {
        "1": "/dashboard",
        "2": "/tasks",
        "3": "/timeline",
        "4": "/analytics",
      };

      if (shortcuts[e.key]) {
        navigate(shortcuts[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 relative selection:bg-brand-primary/20 selection:text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 transition-all duration-300 bg-slate-950">
          <div className="h-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Primary Modals */}
      <TaskModal isOpen={isTaskModalOpen} onClose={closeTaskModal} taskToEdit={taskToEdit} />
      <FloatingFlowWidget />
      <OnboardingModal />
      <PricingModal />
      <FreshStartModal />
      <SettingsModal />
      <GoogleAuthModal />

      {/* Streak Auto-Freeze Shield Notification Toast */}
      {shieldConsumedToday && (
        <div className="fixed top-6 right-6 z-90 max-w-sm glass-panel border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 animate-in slide-in-from-top-2 duration-300">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Streak Auto-Protected
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              A Streak Shield was automatically activated to keep your momentum safe after a missed day.
            </p>
            <button
              onClick={dismissShieldNotification}
              className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest mt-2.5 underline block cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hard Wipe Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="glass-panel border border-rose-500/30 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center">
            <h3 className="text-xl font-black text-white tracking-tight mb-2">
              Wipe All Data?
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              This will permanently delete all tasks, habits, and focus history. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeResetModal}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-300 font-semibold text-xs hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetStore();
                  closeResetModal();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/25 cursor-pointer"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
