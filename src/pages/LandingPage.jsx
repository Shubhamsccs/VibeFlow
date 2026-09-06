import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Flame,
  Clock,
  Laptop,
  Layers,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  Lock,
  Compass,
  Headphones,
  Sliders,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";
import GoogleAuthModal from "../components/GoogleAuthModal";
import heroMockup from "../assets/hero-mockup.jpg";
import workflowPreview from "../assets/workflow-preview.jpg";
import focusSessionPreview from "../assets/focus-session.jpg";

export default function LandingPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    googleUser,
    user,
    openAuthModal,
    signOut,
    openProModal,
    setPlan,
    plan,
  } = useTaskStore();

  const [billingCycle, setBillingCycle] = useState("annual"); // 'monthly' | 'annual' | 'lifetime'
  const [activeWorkflowTab, setActiveWorkflowTab] = useState("engineering");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Scroll to section if hash exists
  useEffect(() => {
    if (window.location.hash) {
      const elem = document.querySelector(window.location.hash);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const workflows = {
    engineering: {
      title: "Engineering Sprints & Deep Focus",
      subtitle: "Burndown velocity, code triage, and zero context switching.",
      badge: "Built for Developers",
      image: workflowPreview,
      stats: [
        { label: "Active Momentum", val: "98%" },
        { label: "Shield Protected", val: "7 Days" },
        { label: "Cycle Time", val: "-34%" },
      ],
      points: [
        "Dynamic sprint columns with PR review and deployment checkpoints",
        "Automated Streak Shields activate if a release day drains your hours",
        "Live Browser Tab Ticker keeps your current ticket top of mind",
        "Native hotkeys (1-4) for lightning-fast view toggling",
      ],
    },
    creative: {
      title: "Content & Creative Studio",
      subtitle: "Binaural soundscapes, idea pipelines, and stress-free shipping.",
      badge: "Built for Creators",
      image: focusSessionPreview,
      stats: [
        { label: "Daily Deep Work", val: "4.2 hrs" },
        { label: "Soundscape", val: "Binaural" },
        { label: "Consistency", val: "14-Day Streak" },
      ],
      points: [
        "Integrated Pomodoro Flow Timer with real-time soundscapes (Rain, Lo-Fi, Binaural)",
        "Mind Dump scratchpad to capture fleeting ideas without losing focus",
        "Compulsory daily creative habits with guilt-free rest day scheduling",
        "Fresh Start overhaul to clear stale video or article drafts instantly",
      ],
    },
    founder: {
      title: "High-Velocity Founder & Executive",
      subtitle: "Eisenhower matrix, macro timelines, and relentless momentum.",
      badge: "Built for Builders",
      image: heroMockup,
      stats: [
        { label: "Focus Score", val: "94/100" },
        { label: "Quadrant 1", val: "Triaged" },
        { label: "Burnout Risk", val: "0.2% Low" },
      ],
      points: [
        "Automated 4-Quadrant Eisenhower Matrix for Ruthless Priority Triage",
        "Streak freeze shields that preserve multi-week consistency during travel",
        "High-level Gantt timeline mapping milestones across months",
        "100% offline-first architecture with instant local data persistence",
      ],
    },
  };

  const faqs = [
    {
      q: "How do Streak Auto-Freeze Shields work?",
      a: "Unlike traditional apps that punish you when life happens, VibeFlow awards you Streak Shields as you complete high-priority focus tasks. If you miss a planned day due to travel, emergencies, or sickness, a shield automatically activates to preserve your momentum without resetting your streak to zero.",
    },
    {
      q: "Can I use VibeFlow offline without an internet connection?",
      a: "Yes, 100%. VibeFlow uses an offline-first architecture with local persistence. You can plan tasks, run focus sessions, and manage habits completely offline. Everything syncs immediately once you reconnect.",
    },
    {
      q: "How does the Google Sign-In work?",
      a: "You can sign in with your existing Google account in one click. We do not store sensitive passwords and your personal focus metrics remain completely secure and private.",
    },
    {
      q: "What is the Anti-Guilt Fresh Start feature?",
      a: "When life gets busy, task backlogs can become overwhelming psychological burdens. Fresh Start gives you a 1-click option to triage overdue tasks: reschedule them realistically, archive them without guilt, or clean your slate so you can resume flow with confidence.",
    },
    {
      q: "Is there a money-back guarantee on paid plans?",
      a: "Yes. All Pro Velocity and Founder Lifetime plans include a no-questions-asked 30-day money-back guarantee. If VibeFlow does not measurably increase your deep work velocity, we refund you immediately.",
    },
  ];

  const currentWf = workflows[activeWorkflowTab];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-primary/30 selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-linear-to-b from-brand-primary/15 via-brand-secondary/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[1200px] right-0 w-[600px] h-[500px] bg-brand-cyan/10 blur-[150px] pointer-events-none -z-10" />

      {/* Top Commercial Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/25 group-hover:scale-105 transition-all">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-heading font-black tracking-tight text-white">
              Vibe<span className="text-brand-primary">Flow</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Commercial SaaS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#workflows" className="hover:text-white transition-colors">
              Workflows
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#momentum" className="hover:text-white transition-colors">
              Momentum Engine
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Plans & Pricing
            </a>
            <a href="#testimonials" className="hover:text-white transition-colors">
              Wall of Love
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action: Sign In / Launch App */}
          <div className="flex items-center gap-3">
            <button
              onClick={scrollToPricing}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-white/[0.08] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>View Plans</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 cursor-pointer"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={signOut}
                  className="text-xs text-slate-500 hover:text-slate-300 p-2 cursor-pointer"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                {/* Official Google G icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
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
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-xs font-bold text-brand-primary mb-6 animate-in fade-in duration-500">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
          <span>Introducing VibeFlow • The Momentum Engine for High Performers</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          Master Your Flow. <br className="hidden sm:inline" />
          Protect Your Streaks. <br />
          <span className="bg-linear-to-r from-brand-primary via-brand-secondary to-brand-cyan bg-clip-text text-transparent">
            Ship Without Burnout.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Traditional to-do apps make you feel guilty when life happens. VibeFlow combines
          an intelligent Kanban pipeline, automated streak freeze shields, and ambient focus
          soundscapes into a relentless momentum machine.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={openAuthModal}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 font-extrabold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-102 cursor-pointer group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
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
            <span>Get Started Free with Google</span>
            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 border border-white/10 hover:border-white/20 text-white font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
          >
            <Play className="w-4 h-4 text-brand-primary fill-current" />
            <span>Explore Interactive Workspace</span>
          </button>
        </div>

        {/* Micro Credibility Copy */}
        <div className="mt-5 flex items-center justify-center gap-5 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            No credit card required
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
            14-day Pro trial included
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            100% Offline-capable
          </span>
        </div>

        {/* Hero Showcase Image with Interactive Hotspots */}
        <div className="mt-14 relative rounded-3xl p-2 sm:p-3 bg-linear-to-b from-white/15 via-white/5 to-transparent border border-white/10 shadow-2xl overflow-hidden group">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950">
            <img
              src={heroMockup}
              alt="VibeFlow Commercial Dashboard Showcase"
              className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.01]"
            />

            {/* Glowing Accent Ring */}
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />

            {/* Floating Live Badges on Top of Showcase */}
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 glass-dock px-3.5 py-2 rounded-2xl flex items-center gap-3 border border-white/15 animate-in fade-in">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Momentum Shield
                </div>
                <div className="text-xs font-black text-white">14-Day Streak Safe</div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 glass-dock px-3.5 py-2 rounded-2xl hidden sm:flex items-center gap-3 border border-white/15">
              <div className="p-2 rounded-xl bg-brand-cyan/15 text-brand-cyan">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Session
                </div>
                <div className="text-xs font-black text-white">Deep Work (Pomodoro)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Trusted By Strip */}
      <section className="border-y border-white/[0.08] bg-slate-950/60 py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
            Loved by 14,000+ builders, founders, and engineers
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
            <span className="text-sm font-mono font-bold tracking-tight text-slate-300">
              LINEAR // STACK
            </span>
            <span className="text-sm font-mono font-bold tracking-tight text-slate-300">
              VERCEL // DEV
            </span>
            <span className="text-sm font-mono font-bold tracking-tight text-slate-300">
              SUPABASE // CLOUD
            </span>
            <span className="text-sm font-mono font-bold tracking-tight text-slate-300">
              STRIPE // PAY
            </span>
            <span className="text-sm font-mono font-bold tracking-tight text-slate-300">
              FIGMA // DESIGN
            </span>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-amber-400 font-bold">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
              ))}
            </div>
            <span className="text-slate-300 font-semibold ml-1">
              4.9 / 5 Average Rating across 1,200+ Reviews
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Workflows Showcase */}
      <section id="workflows" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" /> High-Resolution Workflows
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
            Tailored for How You Actually Work
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            One size doesn't fit high performers. Switch between dedicated operational modes
            fine-tuned for technical execution, creative output, and strategic leadership.
          </p>

          {/* Workflow Tabs */}
          <div className="inline-flex p-1 bg-slate-900 border border-white/10 rounded-2xl mt-8">
            <button
              onClick={() => setActiveWorkflowTab("engineering")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeWorkflowTab === "engineering"
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Software Engineering
            </button>
            <button
              onClick={() => setActiveWorkflowTab("creative")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeWorkflowTab === "creative"
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Content & Creator
            </button>
            <button
              onClick={() => setActiveWorkflowTab("founder")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeWorkflowTab === "founder"
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Founder & Executive
            </button>
          </div>
        </div>

        {/* Workflow Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-white/[0.08] text-xs font-bold uppercase tracking-wider text-brand-cyan">
              {currentWf.badge}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentWf.title}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {currentWf.subtitle}
            </p>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {currentWf.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-2xl bg-slate-900/90 border border-white/8 text-center"
                >
                  <div className="text-base font-black text-white">{stat.val}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Points */}
            <div className="space-y-3 pt-2">
              {currentWf.points.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-brand-primary/20 text-brand-primary shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-300 leading-normal">{point}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <span>Try This Workflow Live</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
            <img
              src={currentWf.image}
              alt={currentWf.title}
              className="w-full h-auto object-cover rounded-2xl hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Core Differentiators & Momentum Engine */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Built Different
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
            Why High Performers Choose VibeFlow
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            Eliminate cognitive friction and stay in flow with features engineered specifically
            to prevent burnout and protect consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Streak Auto-Freeze Shields</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Life happens. Earn shields through sustained focus. When you miss a day, your shield
                automatically deploys, keeping your multi-month streak intact without shame.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-[11px] text-emerald-400 font-bold">
              <span>Anti-Burnout Guarantee</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-5 border border-brand-primary/20">
                <Headphones className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Ambient Soundscapes & Focus</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero need for third-party music tabs. Built-in generative Lo-Fi, Rain, and Binaural
                synthesizers dial your brain straight into theta flow state with one tap.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-[11px] text-brand-primary font-bold">
              <span>Native Audio Engine</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Anti-Guilt Fresh Start</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drowning in 40 overdue tasks? Instead of abandoning your productivity system, activate
                Fresh Start to triage, archive, or rebalance your queue in 10 seconds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-[11px] text-amber-400 font-bold">
              <span>Clean Slate in 1-Click</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center mb-5 border border-brand-cyan/20">
                <Laptop className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Browser Tab Ticker</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never wonder what you should be doing. The live document title updates dynamically
                with your current focus task and countdown timer even while you work in other tabs.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-[11px] text-brand-cyan font-bold">
              <span>Zero Context Switching</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20">
                <Sliders className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Eisenhower Matrix 4-Quadrant</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically maps your tasks into Urgent vs. Important quadrants so you always tackle
                high-leverage work before trivial busywork drains your creative energy.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-[11px] text-purple-400 font-bold">
              <span>Strategic Prioritization</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 6 */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-5 border border-rose-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">100% Offline-First Privacy</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your data is stored securely on your local device. Work on flights, remote retreats,
                or offline cafes without worrying about network dropouts or cloud downtime.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-[11px] text-rose-400 font-bold">
              <span>Total Data Sovereignty</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Plans & Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
            Plans for High-Velocity Execution
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            Start free, upgrade when you want automated streak safety and unlimited focus tools.
            No hidden fees, no long contracts.
          </p>

          {/* Billing selector tabs */}
          <div className="inline-flex p-1.5 bg-slate-900 border border-white/10 rounded-2xl mt-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
                billingCycle === "annual"
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Annual Billing
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                Save 25%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle("lifetime")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                billingCycle === "lifetime"
                  ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              Founder Lifetime Pass
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Starter Tier */}
          <div className="glass-card rounded-3xl p-7 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Free Starter
              </div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Foundational task management and basic flow tools for personal use.
              </p>

              <div className="space-y-3 mt-8">
                {[
                  "Unlimited Tasks & Kanban Boards",
                  "Eisenhower Matrix 4-Quadrant View",
                  "Live Browser Tab Ticker",
                  "1 Active Streak Shield",
                  "Up to 3 Mind Dump scratchpads",
                  "Standard Pomodoro timer",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => {
                  setPlan("free");
                  navigate("/dashboard");
                }}
                className="w-full py-3 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                {plan === "free" ? "Current Plan (Active)" : "Continue with Starter"}
              </button>
            </div>
          </div>

          {/* Pro Velocity Tier (Featured) */}
          <div className="relative glass-card rounded-3xl p-7 border-2 border-brand-primary/60 bg-linear-to-b from-brand-primary/10 via-slate-900/90 to-slate-950 flex flex-col justify-between shadow-2xl shadow-brand-primary/20">
            {/* Best Value Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-primary text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Pro Velocity
              </div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-black text-white">
                  {billingCycle === "annual" ? "$69" : "$8"}
                </span>
                <span className="text-xs text-slate-400">
                  {billingCycle === "annual" ? "/ year ($5.75/mo)" : "/ month"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                For professionals, developers, and creators who refuse to lose momentum.
              </p>

              <div className="space-y-3 mt-8">
                {[
                  "Everything in Free Starter",
                  "Unlimited Auto-Freeze Streak Shields",
                  "Generative Audio Soundscapes (Rain, Lo-Fi, Binaural)",
                  "Anti-Guilt Fresh Start Overhaul Engine",
                  "Advanced Velocity & Burndown Charts",
                  "Unlimited Mind Dump Scratchpads",
                  "Custom Workflow Presets & Column Styling",
                  "Priority Product Feature Requests",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-white font-medium">
                    <Check className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => {
                  setPlan("pro");
                  openProModal();
                }}
                className="w-full py-3.5 rounded-xl btn-primary text-white font-black text-xs shadow-lg shadow-brand-primary/30 hover:scale-101 transition-all cursor-pointer"
              >
                {plan === "pro" ? "Current Pro Plan" : "Upgrade to Pro Velocity"}
              </button>
            </div>
          </div>

          {/* Founder Lifetime Tier */}
          <div className="glass-card rounded-3xl p-7 border border-amber-500/30 bg-linear-to-b from-amber-500/5 via-slate-900/90 to-slate-950 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Founder Lifetime
              </div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-black text-white">$79</span>
                <span className="text-xs text-slate-500">/ one-time payment</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Pay once, own VibeFlow forever. Includes all future updates and Pro features.
              </p>

              <div className="space-y-3 mt-8">
                {[
                  "Lifetime access to all Pro Velocity features",
                  "Zero recurring subscription fees forever",
                  "Permanent Founder Badge on your workspace",
                  "Maximum 99 Streak Shields pool capacity",
                  "Direct feedback channel with creators",
                  "All upcoming AI Workflow extensions included",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => {
                  setPlan("lifetime");
                  openProModal();
                }}
                className="w-full py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                {plan === "lifetime" ? "Founder Lifetime Active" : "Get Founder Lifetime Pass"}
              </button>
            </div>
          </div>
        </div>

        {/* Commercial Trust Badges */}
        <div className="mt-14 p-6 glass-panel rounded-2xl border border-white/8 flex flex-wrap items-center justify-around gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>30-Day Money-Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-primary" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-brand-cyan" />
            <span>SOC2 & GDPR Compliant Security</span>
          </div>
        </div>
      </section>

      {/* Wall of Love / Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Star className="w-3.5 h-3.5 fill-current" /> High Praise
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
            Loved by High-Output Operators
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            See how founders, engineers, and creators use VibeFlow to protect their mental bandwidth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              "The Streak Auto-Freeze Shield alone saved my sanity. As a founder who travels between
              investor pitches, knowing a single flight day won't reset my 40-day momentum streak is
              priceless."
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/6">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Marcus Vance"
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div>
                <div className="text-xs font-bold text-white">Marcus Vance</div>
                <div className="text-[11px] text-slate-400">Co-founder @ HyperScale Labs</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              "I ditched three different subscriptions (Pomodoro app, soundscape generator, and Kanban
              board). VibeFlow unified my entire desk setup into one high-velocity dark mode screen."
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/6">
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
                alt="Elena Rostova"
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div>
                <div className="text-xs font-bold text-white">Elena Rostova</div>
                <div className="text-[11px] text-slate-400">Senior Staff Engineer</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              "The Fresh Start button is a masterclass in psychological design. Every other to-do
              app turns into an overwhelming cemetery of guilt. VibeFlow lets you wipe the dust and
              re-focus instantly."
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/6">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                alt="David Sterling"
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div>
                <div className="text-xs font-bold text-white">David Sterling</div>
                <div className="text-[11px] text-slate-400">Product Architect & Writer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.08]">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-400 text-sm">
            Everything you need to know about plans, streaks, and data safety.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl border border-white/10 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
              >
                <span className="text-xs sm:text-sm font-bold text-white">{faq.q}</span>
                {openFaqIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-brand-primary shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/6 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Pre-Footer Call to Action */}
      <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="relative glass-dock rounded-3xl p-10 sm:p-14 border border-white/15 overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-brand-primary/30 blur-[90px] pointer-events-none" />

          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Experience True Deep Flow?
          </h3>
          <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of professionals who ship more and stress less. Start in 30 seconds with
            Google.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openAuthModal}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
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
              <span>Get Started with Google</span>
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 border border-white/10 hover:border-white/20 text-white font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer"
            >
              Open Instant Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Commercial SaaS Footer */}
      <footer className="border-t border-white/[0.08] bg-slate-950 py-12 px-4 sm:px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="font-heading font-black text-sm text-white tracking-tight">
              VibeFlow
            </span>
            <span className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} VibeFlow Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <a href="#workflows" className="hover:text-slate-300 transition-colors">
              Workflows
            </a>
            <a href="#pricing" className="hover:text-slate-300 transition-colors">
              Pricing
            </a>
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security</span>
          </div>

          {/* Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/8 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">All Systems Operational</span>
          </div>
        </div>
      </footer>

      {/* Google Auth Modal */}
      <GoogleAuthModal />
    </div>
  );
}
