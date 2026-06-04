import { useMemo, useState } from 'react';
import { Clock, Calendar, Smile, Search, Filter, History, Trash2, AlertCircle } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { format, parseISO, compareDesc } from 'date-fns';

export default function Timeline() {
  const { tasks, deleteTask } = useTaskStore();
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const finishedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'done' && 
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       t.status?.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [tasks, searchQuery]);

  // Helper to format time display (stripping dates)
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return "";
    // If it contains a date like "5/9/2026 8:00 AM", split and take only the time parts
    const parts = timeStr.trim().split(/\s+/);
    if (parts.length >= 3) {
      // Looks like "MM/DD/YYYY HH:MM AM/PM"
      return `${parts[1]} ${parts[2]}`;
    }
    if (parts.length === 2 && (parts[1] === 'AM' || parts[1] === 'PM')) {
      // Already "HH:MM AM/PM"
      return timeStr;
    }

    // Convert 24h to 12h if needed
    if (timeStr.includes(':') && !timeStr.includes('AM') && !timeStr.includes('PM')) {
      try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      } catch {
        return timeStr;
      }
    }
    return timeStr;
  };

  // Helper to normalize duration display (e.g., 01:00:00 or 1H -> 1h 0m)
  const formatDurationDisplay = (dur) => {
    if (!dur) return "0m";
    let h = 0, m = 0;

    if (dur.includes(':')) {
      const parts = dur.split(':').map(Number);
      if (parts.length === 3) { [h, m] = parts; }
      else if (parts.length === 2) { [h, m] = parts; }
    } else {
      h = parseInt(dur.match(/(\d+)\s*h/i)?.[1] || 0);
      m = parseInt(dur.match(/(\d+)\s*m/i)?.[1] || 0);
      // Fallback for simple numbers
      if (h === 0 && m === 0 && !isNaN(parseInt(dur))) h = parseInt(dur);
    }

    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // Helper to convert time strings to minutes for sorting
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(/\s+/);
    let timePart = parts.length >= 3 ? parts[1] : parts[0];
    let ampm = parts.length >= 3 ? parts[2] : (parts.length === 2 ? parts[1] : "");

    try {
      let [h, m] = timePart.split(':').map(Number);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + (m || 0);
    } catch {
      return 0;
    }
  };

  // Grouping logic
  const groupedTasks = useMemo(() => {
    const groups = {};
    finishedTasks.forEach(task => {
      const dateKey = task.dueDate || task.createdAt.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          items: [],
          totalMinutes: 0
        };
      }
      groups[dateKey].items.push(task);
      
      if (task.duration) {
        if (task.duration.includes(':')) {
          const parts = task.duration.split(':').map(Number);
          groups[dateKey].totalMinutes += (parts[0] * 60) + (parts[1] || 0);
        } else {
          const h = parseInt(task.duration.match(/(\d+)h/)?.[1] || 0);
          const m = parseInt(task.duration.match(/(\d+)m/)?.[1] || 0);
          groups[dateKey].totalMinutes += (h * 60) + m;
        }
      }
    });

    // Sort items within each group by time (descending: latest at top)
    Object.values(groups).forEach(group => {
      group.items.sort((a, b) => timeToMinutes(b.startTime) - timeToMinutes(a.startTime));
    });

    return Object.values(groups).sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
  }, [finishedTasks]);

  const MoodHeatmap = ({ score }) => {
    return (
      <div className="flex gap-1" title={`Mood: ${score}/5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-sm transition-colors ${
              i <= (score || 5)
                ? 'bg-brand-success' // Always green for finished tasks to match your aesthetics
                : 'bg-slate-800'
            }`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fade-in pb-12 bg-black">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Timeline</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Your productivity journey</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-all w-64 text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-12">
        {groupedTasks.length > 0 ? (
          groupedTasks.map((group) => (
            <div key={group.date} className="relative">
              {/* Date Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-white text-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                  {format(parseISO(group.date), 'EEEE, MMM d')}
                </div>
                <div className="h-px flex-1 bg-slate-800" />
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                  Total: {Math.floor(group.totalMinutes / 60)}h {group.totalMinutes % 60}m
                </div>
              </div>

              <div className="space-y-10 pl-2">
                {group.items.map((item) => {
                  const category = (item.category || item.status || 'college').toLowerCase();
                  
                  // Calculate badge based on focus ratio
                  const parseMins = (dur) => {
                    if (!dur) return 0;
                    if (dur.includes(':')) {
                      const parts = dur.split(':').map(Number);
                      if (parts.length >= 2) return (parts[0] * 60) + parts[1];
                    }
                    const h = parseInt(dur.match(/(\d+)h/)?.[1] || 0);
                    const m = parseInt(dur.match(/(\d+)m/)?.[1] || 0);
                    return (h * 60) + m;
                  };
                  const plannedMinutes = parseMins(item.duration);
                  const actualMinutes = item.actualDurationMinutes || 0;
                  const ratio = plannedMinutes > 0 ? (actualMinutes / plannedMinutes) : 0;
                  
                  let badge = null;
                  if (plannedMinutes > 0) {
                    if (ratio >= 1.1) {
                      badge = {
                        label: "Hyper-focused",
                        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      };
                    } else if (ratio >= 0.9) {
                      badge = {
                        label: "On Track",
                        className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      };
                    } else {
                      if (item.status === 'done') {
                        badge = {
                          label: "Efficient",
                          className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                        };
                      } else {
                        badge = {
                          label: "Under-focused",
                          className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        };
                      }
                    }
                  }
                  
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-8 group relative"
                    >
                      {/* Status Circle Icon */}
                      <div className="w-10 h-10 flex items-center justify-center relative z-10 shrink-0">
                        <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center bg-black transition-all group-hover:scale-110 shadow-lg ${
                          category === 'college' ? 'border-brand-primary' : 
                          category === 'myspace' ? 'border-brand-success' :
                          category === 'java' || category === 'dsa-java' ? 'border-white' :
                          category === 'web-dev' || category === 'webdev' ? 'border-brand-secondary' :
                          category === 'practice' || category === 'dsa-practice' ? 'border-brand-warning' :
                          'border-slate-500'
                        }`}>
                           <div className={`w-3 h-3 rounded-full ${
                            category === 'college' ? 'bg-brand-primary shadow-[0_0_10px_#0000ff]' : 
                            category === 'myspace' ? 'bg-brand-success shadow-[0_0_10px_#25d366]' :
                            category === 'java' || category === 'dsa-java' ? 'bg-white shadow-[0_0_10px_#ffffff]' :
                            category === 'web-dev' || category === 'webdev' ? 'bg-brand-secondary shadow-[0_0_10px_#ff0000]' :
                            category === 'practice' || category === 'dsa-practice' ? 'bg-brand-warning shadow-[0_0_10px_#ffd700]' :
                            'bg-slate-500'
                          }`} />
                        </div>
                      </div>

                      <div className="flex-1 bg-slate-900/20 hover:bg-slate-900/40 border border-slate-800/50 p-6 rounded-4xl transition-all group-hover:border-slate-700">
                        <div className="flex justify-between items-start gap-6">
                          <div className="flex-1">
                            <h4 className="text-xl font-black text-white group-hover:text-brand-primary transition-colors leading-none tracking-tight mb-3">
                              {item.title}
                            </h4>
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black border border-slate-800 text-slate-400 min-w-[60px] text-center">
                                  {category.replace('-', ' ')}
                                </span>
                                {item.mood && (
                                  <>
                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                    <MoodHeatmap score={item.mood} />
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap text-slate-400">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                  <span>Planned:</span>
                                  <span className="text-xs font-black text-slate-300">
                                    {formatDurationDisplay(item.duration)}
                                  </span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                  <span>Focused:</span>
                                  <span className="text-xs font-black text-brand-success">
                                    {item.actualDuration || "0m"}
                                  </span>
                                </div>
                                {badge && (
                                  <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badge.className}`}>
                                      {badge.label}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Session Time</p>
                              <p className="text-sm font-black text-white whitespace-nowrap">
                                {formatTimeDisplay(item.startTime)}
                                {item.endTime && ` — ${formatTimeDisplay(item.endTime)}`}
                              </p>
                            </div>
                            
                            <button 
                              onClick={() => setTaskToDelete(item)}
                              className="opacity-0 group-hover:opacity-100 p-3 bg-brand-danger/5 text-brand-danger/40 hover:text-brand-danger hover:bg-brand-danger/10 rounded-2xl transition-all border border-transparent hover:border-brand-danger/20"
                              title="Delete activity"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-slate-700">
            <History className="w-20 h-20 mb-6 opacity-5" />
            <h3 className="text-2xl font-black text-slate-500 uppercase tracking-tighter">No History Yet</h3>
            <p className="text-sm mt-2 font-bold text-slate-600 uppercase tracking-widest">Complete tasks to build your timeline</p>
          </div>
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-4xl p-10 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-brand-danger/10 rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <AlertCircle className="w-10 h-10 text-brand-danger" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter mb-3 text-center uppercase">Delete Activity?</h3>
            <p className="text-slate-400 mb-10 text-center leading-relaxed">
              Are you sure you want to delete <span className="text-white font-bold">"{taskToDelete.title}"</span>? 
              This will permanently remove it from your history.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-6 py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 bg-slate-800 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="px-6 py-5 rounded-2xl font-black uppercase text-xs tracking-widest bg-brand-danger text-white hover:scale-105 transition-all shadow-xl shadow-brand-danger/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
