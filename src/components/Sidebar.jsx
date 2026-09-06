import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  LineChart,
  History,
  Shield,
  Settings,
  Zap,
  Coffee,
  Globe,
  Sparkles,
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

export default function Sidebar() {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    user,
    streakShields,
    streakCount,
    restDays,
    plan,
    openSettingsModal,
  } = useTaskStore();

  const todayStr = new Date().toLocaleDateString("en-CA");
  const isRestDayToday = restDays.includes(todayStr);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, shortcut: "1" },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, shortcut: "2" },
    { name: "Timeline", path: "/timeline", icon: History, shortcut: "3" },
    { name: "Analytics", path: "/analytics", icon: LineChart, shortcut: "4" },
  ];

  const userInitial = (user.name || "A").trim()[0].toUpperCase();

  return (
    <aside
      className={`${
        isSidebarCollapsed ? "w-20" : "w-64"
      } bg-slate-950 border-r border-white/[0.08] flex flex-col transition-all duration-300 relative z-30 select-none`}
    >
      {/* Brand Header */}
      <button
        onClick={toggleSidebar}
        className={`h-16 flex items-center ${
          isSidebarCollapsed ? "justify-center" : "px-6"
        } border-b border-white/[0.08] hover:bg-slate-900/50 transition-colors group w-full text-left cursor-pointer`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-white fill-current" />
          </div>
          {!isSidebarCollapsed && (
            <h1 className="text-lg font-heading font-black tracking-tight whitespace-nowrap animate-in fade-in duration-300">
              Vibe<span className="text-brand-primary">Flow</span>
            </h1>
          )}
        </div>
      </button>

      {/* Nav Menu */}
      <nav className={`flex-1 ${isSidebarCollapsed ? "px-2" : "px-4"} py-6 space-y-1.5`}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={isSidebarCollapsed ? `${item.name} (${item.shortcut})` : ""}
            className={({ isActive }) =>
              `flex items-center ${
                isSidebarCollapsed ? "justify-center" : "gap-3 px-3.5"
              } py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative ${
                isActive
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20 font-bold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate">{item.name}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.shortcut}
                </span>
              </div>
            )}
          </NavLink>
        ))}

        {/* Commercial Landing & Plans Link */}
        <NavLink
          to="/"
          title={isSidebarCollapsed ? "Product Landing & Plans" : ""}
          className={`flex items-center ${
            isSidebarCollapsed ? "justify-center" : "gap-3 px-3.5"
          } py-2.5 rounded-xl font-medium text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all duration-200 group border border-dashed border-white/[0.06] hover:border-brand-primary/30 mt-3`}
        >
          <Globe className="w-4 h-4 shrink-0 text-brand-primary group-hover:scale-110 transition-transform" />
          {!isSidebarCollapsed && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="truncate">Product & Plans</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100" />
            </div>
          )}
        </NavLink>

        {/* Rest Day Indicator */}
        {isRestDayToday && !isSidebarCollapsed && (
          <div className="mt-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2 text-xs font-semibold">
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Rest Day Active</span>
          </div>
        )}
      </nav>

      {/* Momentum & Shield Stats Pill */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.06] text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{streakCount}d Streak</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
              <Shield className="w-3 h-3" />
              <span>{streakShields} Shield{streakShields === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom User Profile card */}
      <div className={`p-3 border-t border-white/[0.08] ${isSidebarCollapsed ? "flex justify-center" : ""}`}>
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/60 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-slate-500 truncate capitalize">{user.role || `${plan} plan`}</div>
              </div>
            </div>

            <button
              onClick={openSettingsModal}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={openSettingsModal}
            className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-xs shadow-md cursor-pointer"
            title={`${user.name} - Settings`}
          >
            {userInitial}
          </button>
        )}
      </div>
    </aside>
  );
}
