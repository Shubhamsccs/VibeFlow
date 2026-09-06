import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Kanban,
  Grid,
  Zap,
  Coffee,
  Layers,
  Settings2,
} from "lucide-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useTaskStore } from "../store/useTaskStore";
import TaskCard from "../components/TaskCard";

export default function TasksBoard() {
  const { tasks, columns, openTaskModal, moveTask, updateTask, openSettingsModal } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [energyFilter, setEnergyFilter] = useState("all"); // 'all' | 'deep' | 'standard' | 'light'
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'eisenhower'

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    if (viewMode === "kanban") {
      moveTask(result.draggableId, result.destination.droppableId, result.destination.index);
    } else {
      // Eisenhower Matrix Drag & Drop
      const taskId = result.draggableId;
      const destQuad = result.destination.droppableId;
      const today = new Date().toLocaleDateString("en-CA");

      let updates = {};
      if (destQuad === "q1") {
        updates = { priority: "high", dueDate: today };
      } else if (destQuad === "q2") {
        updates = { priority: "high", dueDate: "" };
      } else if (destQuad === "q3") {
        updates = { priority: "low", dueDate: today };
      } else if (destQuad === "q4") {
        updates = { priority: "low", dueDate: "" };
      }
      updateTask(taskId, updates);
    }
  };

  // Filter tasks by search query and energy level
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEnergy = energyFilter === "all" || t.energyLevel === energyFilter;
      return matchesSearch && matchesEnergy;
    });
  }, [tasks, searchQuery, energyFilter]);

  // Active non-completed tasks for Eisenhower
  const activeTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status !== "done");
  }, [filteredTasks]);

  // Eisenhower Matrix quadrants
  const quadrants = useMemo(() => {
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toLocaleDateString("en-CA");

    const isUrgent = (task) => {
      if (!task.dueDate) return false;
      return task.dueDate <= tomorrow;
    };

    const isImportant = (task) => {
      return task.priority === "high" || task.priority === "medium";
    };

    return {
      q1: activeTasks.filter((t) => isImportant(t) && isUrgent(t)),
      q2: activeTasks.filter((t) => isImportant(t) && !isUrgent(t)),
      q3: activeTasks.filter((t) => !isImportant(t) && isUrgent(t)),
      q4: activeTasks.filter((t) => !isImportant(t) && !isUrgent(t)),
    };
  }, [activeTasks]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Execution Board
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize work by custom columns or strategic Eisenhower quadrants.
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex p-1 bg-slate-900 border border-white/[0.08] rounded-xl">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("eisenhower")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "eisenhower"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Eisenhower</span>
            </button>
          </div>

          {/* Energy Level Filter */}
          <div className="flex p-1 bg-slate-900 border border-white/[0.08] rounded-xl text-xs">
            {[
              { id: "all", label: "All" },
              { id: "deep", label: "Deep", icon: Zap, color: "text-brand-primary" },
              { id: "standard", label: "Standard", icon: Layers, color: "text-brand-cyan" },
              { id: "light", label: "Quick", icon: Coffee, color: "text-amber-400" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setEnergyFilter(f.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  energyFilter === f.id
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.icon && <f.icon className={`w-3 h-3 ${f.color}`} />}
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-slate-900 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary w-36 sm:w-48"
            />
          </div>

          {/* Settings / Column Manager Button */}
          <button
            onClick={openSettingsModal}
            className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white cursor-pointer"
            title="Edit columns & colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* New Task Button */}
          <button
            onClick={() => openTaskModal()}
            className="btn-primary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Drag-and-Drop Area */}
      <DragDropContext onDragEnd={handleDragEnd}>
        {viewMode === "kanban" ? (
          /* Multi-Column Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 no-scrollbar min-h-[600px]">
            {columns.map((column) => {
              const colTasks = filteredTasks.filter((t) => t.status === column.id);

              return (
                <div
                  key={column.id}
                  className="w-72 sm:w-80 shrink-0 glass-panel rounded-3xl p-4 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: column.accent || "#6366f1" }}
                      />
                      <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                        {column.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-white/[0.04]">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => openTaskModal({ status: column.id })}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title={`Add task to ${column.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Droppable Column */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-2.5 transition-colors rounded-2xl p-1 ${
                          snapshot.isDraggingOver ? "bg-slate-900/60" : ""
                        }`}
                      >
                        {colTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            columnAccent={column.accent}
                          />
                        ))}
                        {provided.placeholder}

                        {colTasks.length === 0 && (
                          <div className="h-36 flex flex-col items-center justify-center border border-dashed border-white/[0.06] rounded-2xl text-slate-600 text-xs text-center p-3">
                            <span>Drop tasks here</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}

            {/* Done Column if not already in custom columns */}
            {!columns.some((c) => c.id === "done") && (
              <div className="w-72 sm:w-80 shrink-0 glass-panel rounded-3xl p-4 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-bold text-white tracking-wide uppercase">Done</h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-white/[0.04]">
                      {filteredTasks.filter((t) => t.status === "done").length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId="done">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2.5 transition-colors rounded-2xl p-1 ${
                        snapshot.isDraggingOver ? "bg-slate-900/60" : ""
                      }`}
                    >
                      {filteredTasks
                        .filter((t) => t.status === "done")
                        .map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            columnAccent="#10b981"
                          />
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>
        ) : (
          /* Eisenhower Matrix View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: "q1", title: "Urgent & Important (Do First)", tasks: quadrants.q1, accent: "#f43f5e" },
              { id: "q2", title: "Not Urgent & Important (Schedule)", tasks: quadrants.q2, accent: "#6366f1" },
              { id: "q3", title: "Urgent & Not Important (Delegate/Quick)", tasks: quadrants.q3, accent: "#f59e0b" },
              { id: "q4", title: "Not Urgent & Not Important (Eliminate)", tasks: quadrants.q4, accent: "#71717a" },
            ].map((quad) => (
              <div key={quad.id} className="glass-panel rounded-3xl p-5 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: quad.accent }} />
                    <h3 className="text-xs font-bold text-white uppercase">{quad.title}</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded-full">
                    {quad.tasks.length}
                  </span>
                </div>

                <Droppable droppableId={quad.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2.5 rounded-2xl p-1 transition-colors ${
                        snapshot.isDraggingOver ? "bg-slate-900/60" : ""
                      }`}
                    >
                      {quad.tasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} columnAccent={quad.accent} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        )}
      </DragDropContext>
    </div>
  );
}
