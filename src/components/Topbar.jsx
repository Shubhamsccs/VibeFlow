import { useState } from "react";
import { Search, Bell, Menu, Plus, AlertCircle, RotateCcw } from "lucide-react";
import { useTaskStore } from "../store/useTaskStore";

export default function Topbar() {
  const { openTaskModal, openResetModal } = useTaskStore();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-100 sticky top-0">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-slate-400 hover:text-slate-200">
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, tags..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-full pl-11 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => openResetModal()}
          className="text-slate-500 hover:text-red-500 p-2 rounded-full transition-colors group relative"
          title="Hard Reset"
        >
          <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        </button>

        <button
          onClick={() => openTaskModal()}
          className="btn-primary py-2 px-4 rounded-full flex items-center gap-2 text-sm sm:flex"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>

        <div className="flex items-center gap-2 border-l border-slate-800 pl-4 ml-2">
          <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-secondary rounded-full"></span>
          </button>

          <button className="w-8 h-8 rounded-full bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer hover:shadow-brand-primary/40 transition-shadow">
            S
          </button>
        </div>
      </div>
    </header>
  );
}
