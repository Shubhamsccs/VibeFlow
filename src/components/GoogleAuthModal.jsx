import { useState } from "react";
import { X, ShieldCheck, UserPlus, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../store/useTaskStore";

const MOCK_GOOGLE_ACCOUNTS = [
  {
    name: "Alex Chen",
    email: "alex.chen@vibeflow.io",
    role: "Engineering & Product Lead",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Sarah Jenkins",
    email: "sarah.jenkins.tech@gmail.com",
    role: "Full-Stack Creator",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
];

export default function GoogleAuthModal() {
  const { isAuthModalOpen, closeAuthModal, signInWithGoogle } = useTaskStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSelectAccount = (account) => {
    setSelectedEmail(account.email);
    setIsLoading(true);

    setTimeout(() => {
      signInWithGoogle(account);
      setIsLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const account = {
      name: customName.trim() || customEmail.split("@")[0],
      email: customEmail.trim(),
      role: "Founder & Builder",
      avatar: "",
    };

    setSelectedEmail(account.email);
    setIsLoading(true);

    setTimeout(() => {
      signInWithGoogle(account);
      setIsLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          disabled={isLoading}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-lg p-2.5 mb-3.5">
            <svg viewBox="0 0 24 24" className="w-full h-full">
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
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Sign in with Google
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose an account to securely access <strong className="text-slate-200">VibeFlow</strong>
          </p>
        </div>

        {/* Loading overlay during handshake */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-3" />
            <p className="text-sm font-semibold text-white">Authenticating with Google...</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">{selectedEmail}</p>
          </div>
        ) : customMode ? (
          /* Custom Google Email Form */
          <form onSubmit={handleCustomSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-primary transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Google Account Email
              </label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl btn-primary text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-brand-primary/25"
              >
                Continue with Google
              </button>
            </div>
          </form>
        ) : (
          /* Account Selector List */
          <div className="space-y-2.5 mb-6">
            {MOCK_GOOGLE_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => handleSelectAccount(account)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-white/8 hover:border-brand-primary/40 hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-brand-primary transition-colors truncate">
                      {account.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {account.email}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}

            {/* Use another Google account */}
            <button
              onClick={() => setCustomMode(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-950/30 border border-dashed border-white/10 hover:border-white/25 hover:bg-slate-800/30 transition-all text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-300">
                  Use another Google account
                </div>
                <div className="text-[11px] text-slate-500">
                  Sign in with custom Gmail or Google Workspace
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Security / Trust Footer */}
        <div className="pt-4 border-t border-white/6 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span className="hover:text-slate-400 cursor-pointer">
            Privacy Policy • Terms
          </span>
        </div>
      </div>
    </div>
  );
}
