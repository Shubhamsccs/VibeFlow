import { useState } from "react";
import { X, Check, Sparkles, Key } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

export default function PricingModal() {
  const { isProModalOpen, closeProModal, plan, setPlan, verifyLicenseKey } = useTaskStore();
  const [billingCycle, setBillingCycle] = useState("lifetime"); // 'monthly' | 'annual' | 'lifetime'
  const [licenseInput, setLicenseInput] = useState("");
  const [licenseStatus, setLicenseStatus] = useState(null);

  if (!isProModalOpen) return null;

  const handleApplyLicense = (e) => {
    e.preventDefault();
    const res = verifyLicenseKey(licenseInput);
    if (res.success) {
      setLicenseStatus({ ok: true, msg: `Activated ${res.plan.toUpperCase()} plan successfully!` });
      setTimeout(() => {
        closeProModal();
      }, 1200);
    } else {
      setLicenseStatus({ ok: false, msg: res.message });
    }
  };

  const handleSimulatePurchase = (tier) => {
    setPlan(tier);
    closeProModal();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-2xl glass-panel border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl my-auto">
        {/* Close button */}
        <button
          onClick={closeProModal}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-md mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Supercharge Deep Flow
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Unlock VibeFlow Pro
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Eliminate cognitive friction, protect your deep work from burnout, and tap into state-of-the-art multi-tab focus tools.
          </p>

          {/* Billing selector tabs */}
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl mt-6">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                billingCycle === "monthly" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Monthly ($8)
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                billingCycle === "annual" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Annual ($69/yr)
            </button>
            <button
              onClick={() => setBillingCycle("lifetime")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer relative ${
                billingCycle === "lifetime"
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              Founder Lifetime ($79)
            </button>
          </div>
        </div>

        {/* Pricing Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Free Starter Card */}
          <div className="rounded-2xl bg-slate-950/60 border border-white/[0.06] p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Free Starter</div>
              <div className="text-2xl font-black text-white mt-1">$0</div>
              <p className="text-[11px] text-slate-500 mt-1">Foundational planning for individuals.</p>

              <div className="space-y-2.5 mt-5">
                {[
                  "Unlimited Tasks & Kanban Boards",
                  "Eisenhower Matrix 4-Quadrant View",
                  "Live Browser Tab Ticker",
                  "1 Active Streak Shield",
                  "Up to 3 Mind Dump Pads",
                  "Local Storage Persistence",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={closeProModal}
              className="w-full mt-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Continue on Free
            </button>
          </div>

          {/* Pro / Lifetime Card */}
          <div className="relative rounded-2xl bg-linear-to-b from-brand-primary/15 to-slate-950 border border-brand-primary/40 p-5 flex flex-col justify-between shadow-xl shadow-brand-primary/10">
            <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-brand-primary text-[10px] font-black uppercase tracking-wider text-white shadow-md">
              Most Popular
            </div>

            <div>
              <div className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                {billingCycle === "lifetime" ? "Founder Lifetime License" : "VibeFlow Pro"}
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {billingCycle === "monthly" ? "$8" : billingCycle === "annual" ? "$69" : "$79"}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  {billingCycle === "monthly" ? "/month" : billingCycle === "annual" ? "/year" : "one-time"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Everything you need to master deep work and avoid burnout.
              </p>

              <div className="space-y-2.5 mt-5">
                {[
                  "Document Picture-in-Picture Floating HUD",
                  "Built-in Procedural Binaural & Rain Audio",
                  "Cognitive Burnout Prevention Meter",
                  "Anti-Guilt 1-Click Backlog Triage",
                  "Unlimited Streak Shields & Rest Days",
                  "Second Chance Comeback Quests",
                  "Encrypted JSON Data Backup & Export",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                    <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSimulatePurchase(billingCycle === "lifetime" ? "lifetime" : "pro")}
              className="btn-primary w-full mt-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-primary/25 cursor-pointer"
            >
              Get {billingCycle === "lifetime" ? "Lifetime Access" : "Pro"} Now
            </button>
          </div>
        </div>

        {/* License Activation Form */}
        <div className="border-t border-white/[0.06] pt-5">
          <form onSubmit={handleApplyLicense} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="Have a license key? Enter VIBE-PRO-XXXX..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              Activate Key
            </button>
          </form>

          {licenseStatus && (
            <div
              className={`text-xs mt-2 font-medium ${
                licenseStatus.ok ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {licenseStatus.msg}
            </div>
          )}

          {/* Developer Quick Test Toggle */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-4 pt-3 border-t border-white/[0.04]">
            <span>Developer Test Mode (Instant Switch):</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPlan("free")}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                  plan === "free" ? "bg-slate-700 text-white" : "hover:text-slate-300"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setPlan("pro")}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                  plan === "pro" ? "bg-brand-primary text-white" : "hover:text-slate-300"
                }`}
              >
                Pro
              </button>
              <button
                onClick={() => setPlan("lifetime")}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                  plan === "lifetime" ? "bg-amber-500 text-slate-950 font-bold" : "hover:text-slate-300"
                }`}
              >
                Lifetime
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
