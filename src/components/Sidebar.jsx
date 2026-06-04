import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  LineChart,
  History,
  Timer,
  Menu,
  ChevronLeft
} from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

export default function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar } = useTaskStore();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, shortcut: "1" },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, shortcut: "2" },
    { name: "Timeline", path: "/timeline", icon: History, shortcut: "3" },
    { name: "Calendar", path: "/calendar", icon: Calendar, shortcut: "4" },
    { name: "Analytics", path: "/analytics", icon: LineChart, shortcut: "5" },
  ];

  return (
    <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-black border-r border-slate-800 flex flex-col transition-all duration-300 relative`}>
      <button 
        onClick={toggleSidebar}
        className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-6'} border-b border-slate-800 hover:bg-slate-900 transition-colors group w-full text-left`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-heading font-bold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              Vibe<span className="text-brand-primary">Flow</span>
            </h1>
          )}
        </div>
      </button>

      <nav className={`flex-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2`}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={isSidebarCollapsed ? `${item.name} (${item.shortcut})` : ""}
            className={({ isActive }) =>
              `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`
            }
          >
            <div className="relative">
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarCollapsed && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-slate-800 text-[8px] font-black flex items-center justify-center rounded-full border border-slate-700 text-slate-400">
                  {item.shortcut}
                </span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                  {item.name}
                </span>
                <span className="text-[10px] font-black text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.shortcut}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {!isSidebarCollapsed && (
        <div className="p-4 border-t border-slate-800 animate-in fade-in duration-500">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pro Tip
            </p>
            <p className="text-sm text-slate-400">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-xs text-slate-300">⌘</kbd>{" "}
              +{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-xs text-slate-300">K</kbd>{" "}
              to quick add a task.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
