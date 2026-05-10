import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export default function CalendarView() {
  const [viewDate, setViewDate] = useState(new Date());
  const { tasks } = useTaskStore();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const parseDuration = (dur) => {
    if (!dur) return 0;
    const parts = dur.match(/(\d+)/g);
    if (!parts) return 0;
    const h = parseInt(dur.match(/(\d+)\s*h/i)?.[1] || 0);
    const m = parseInt(dur.match(/(\d+)\s*m/i)?.[1] || 0);
    if (dur.includes(':')) return (parseInt(parts[0]) * 60) + (parseInt(parts[1]) || 0);
    return (h * 60) + m;
  };

  const getHeatmapColor = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const completed = tasks.filter(t => (t.completedAt?.split('T')[0] || t.dueDate) === dateStr && t.status === 'done');
    const mins = completed.reduce((acc, t) => acc + parseDuration(t.duration), 0);
    const hours = mins / 60;
    if (hours === 0) return 'transparent';
    if (hours < 1) return '#22c55e22'; 
    if (hours < 3) return '#22c55e66'; 
    if (hours < 5) return '#22c55eaa'; 
    return '#22c55e';
  };

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`p-${i}`} className="border-r border-b border-white/5" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const color = getHeatmapColor(d);
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
      cells.push(
        <div key={d} className="relative min-h-[120px] border-r border-b border-white/10 flex items-center justify-center bg-black" style={{ backgroundColor: color }}>
          <span className={`text-xl font-black ${isToday ? 'text-blue-500' : 'text-zinc-600'}`}>{d}</span>
        </div>
      );
    }
    while (cells.length % 7 !== 0 || cells.length < 42) cells.push(<div key={`e-${cells.length}`} className="border-r border-b border-white/5" />);
    return cells;
  };

  return (
    <div className="h-full flex flex-col bg-black p-4">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 text-zinc-600 hover:text-white"><ChevronLeft /></button>
        <span className="text-xl font-black text-white uppercase tracking-widest">
          {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)}
        </span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 text-zinc-600 hover:text-white"><ChevronRight /></button>
      </div>

      <div className="flex-1 grid grid-cols-7 border-t border-l border-white/10">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="py-4 text-center text-xs font-black text-zinc-500 border-r border-b border-white/10">{d}</div>
        ))}
        {renderCells()}
      </div>
    </div>
  );
}
