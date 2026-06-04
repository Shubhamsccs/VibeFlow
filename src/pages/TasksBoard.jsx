import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  AlertCircle,
  Lock,
  History
} from "lucide-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useTaskStore } from "../store/useTaskStore";
import TaskCard from "../components/TaskCard";

const COLUMNS = [
  { id: "college", title: "College Work", accent: "#0000ff" },
  { id: "myspace", title: "MySpace", accent: "#25d366" },
  { id: "dsa-java", title: "DSA Java", accent: "#ffffff" },
  { id: "web-dev", title: "Web Development", accent: "#ff0000" },
  { id: "dsa-practice", title: "DSA Practice", accent: "#ffd700" },
];

export default function TasksBoard() {
  const { tasks, openTaskModal, moveTask, deleteTask, updateTask } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("college");
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  // View mode: kanban | eisenhower
  const [viewMode, setViewMode] = useState("kanban");

  const normalizeStatus = (status) => {
    if (!status || status === "todo") return "college";
    if (status === "webdev") return "web-dev";
    if (status === "java") return "dsa-java";
    if (status === "practice") return "dsa-practice";
    return status;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    if (viewMode === "kanban") {
      moveTask(result.draggableId, result.destination.droppableId, result.destination.index);
    } else {
      // Eisenhower Matrix Drag & Drop
      const taskId = result.draggableId;
      const destQuad = result.destination.droppableId;
      const today = new Date().toLocaleDateString('en-CA');
      
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

  // Kanban tasks
  const currentColumn = COLUMNS.find(c => c.id === activeTab);
  const columnTasks = tasks.filter((t) => normalizeStatus(t.status) === activeTab && 
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.description?.toLowerCase().includes(searchQuery.toLowerCase())));

  // Eisenhower quadrants tasks
  const activeTasks = useMemo(() => {
    return tasks.filter(t => t.status !== "done" &&
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tasks, searchQuery]);

  const quadrants = useMemo(() => {
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toLocaleDateString('en-CA');

    const isUrgent = (task) => {
      if (!task.dueDate) return false;
      return task.dueDate <= tomorrow;
    };

    const isImportant = (task) => {
      return task.priority === "high" || task.priority === "medium";
    };

    return {
      q1: activeTasks.filter(t => isImportant(t) && isUrgent(t)),
      q2: activeTasks.filter(t => isImportant(t) && !isUrgent(t)),
      q3: activeTasks.filter(t => !isImportant(t) && isUrgent(t)),
      q4: activeTasks.filter(t => !isImportant(t) && !isUrgent(t)),
    };
  }, [activeTasks]);

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in bg-black">
      {/* Header & Tabs */}
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Activities</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Manage your focused sessions</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-900/40 border border-slate-800 p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "kanban" ? "bg-white text-black font-black" : "text-slate-500 hover:text-slate-350"
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode("eisenhower")}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "eisenhower" ? "bg-white text-black font-black" : "text-slate-500 hover:text-slate-350"
                }`}
              >
                Eisenhower
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Find activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-all w-64 text-white"
              />
            </div>
            <button 
              onClick={() => openTaskModal({ status: activeTab })}
              className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              NEW TASK
            </button>
          </div>
        </div>

        {/* Tab Selector — Only shown in Kanban mode */}
        {viewMode === "kanban" && (
          <div className="flex gap-2 p-1 bg-slate-900/30 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => setActiveTab(col.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 border ${
                  activeTab === col.id
                    ? "bg-white text-black border-white shadow-xl"
                    : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.accent }} />
                {col.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === "kanban" ? (
        /* Kanban DND Board */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/50 rounded-3xl border border-slate-800/50 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: currentColumn.accent }} />
                <h2 className="text-xl font-black text-white tracking-tighter uppercase">{currentColumn.title}</h2>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                {columnTasks.length} {columnTasks.length === 1 ? 'Activity' : 'Activities'}
              </p>
            </div>

            <Droppable droppableId={currentColumn.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-8 overflow-y-auto no-scrollbar transition-colors ${
                    snapshot.isDraggingOver ? "bg-slate-900/20" : ""
                  }`}
                >
                  <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-700">
                        <Lock className="w-12 h-12 mb-4 opacity-10" />
                        <h3 className="text-lg font-bold text-slate-500">No active tasks in this section</h3>
                        <button 
                          onClick={() => openTaskModal({ status: activeTab })}
                          className="mt-4 text-brand-primary font-bold hover:underline uppercase text-xs tracking-widest cursor-pointer"
                        >
                          Create your first activity
                        </button>
                      </div>
                    )}
                    {columnTasks.map((task, index) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        index={index} 
                        columnAccent={currentColumn.accent} 
                        onDeleteClick={() => setTaskToDelete(task)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      ) : (
        /* Eisenhower Matrix Grid */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 overflow-y-auto no-scrollbar pb-6">
            <EisenhowerQuadrant
              id="q1"
              title="Quadrant I: Do First"
              subtitle="Urgent & Important"
              tasks={quadrants.q1}
              borderColor="border-red-500/20 bg-red-500/[0.01]"
              accentColor="#ef4444"
              setTaskToDelete={setTaskToDelete}
            />
            <EisenhowerQuadrant
              id="q2"
              title="Quadrant II: Plan / Schedule"
              subtitle="Important, Not Urgent"
              tasks={quadrants.q2}
              borderColor="border-blue-500/20 bg-blue-500/[0.01]"
              accentColor="#3b82f6"
              setTaskToDelete={setTaskToDelete}
            />
            <EisenhowerQuadrant
              id="q3"
              title="Quadrant III: Delegate / Batch"
              subtitle="Urgent, Less Important"
              tasks={quadrants.q3}
              borderColor="border-amber-500/20 bg-amber-500/[0.01]"
              accentColor="#f59e0b"
              setTaskToDelete={setTaskToDelete}
            />
            <EisenhowerQuadrant
              id="q4"
              title="Quadrant IV: Eliminate"
              subtitle="Neither Urgent nor Important"
              tasks={quadrants.q4}
              borderColor="border-slate-800 bg-slate-900/[0.01]"
              accentColor="#64748b"
              setTaskToDelete={setTaskToDelete}
            />
          </div>
        </DragDropContext>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-4xl p-10 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-brand-danger/10 rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <AlertCircle className="w-10 h-10 text-brand-danger" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter mb-3 text-center uppercase">Delete Task?</h3>
            <p className="text-slate-400 mb-10 text-center leading-relaxed">
              Are you sure you want to delete <span className="text-white font-bold">"{taskToDelete.title}"</span>? 
              This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-6 py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="px-6 py-5 rounded-2xl font-black uppercase text-xs tracking-widest bg-brand-danger text-white hover:scale-105 transition-all shadow-xl shadow-brand-danger/20 cursor-pointer"
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

function EisenhowerQuadrant({ id, title, subtitle, tasks, borderColor, accentColor, setTaskToDelete }) {
  return (
    <div className={`rounded-2xl border ${borderColor} p-5 flex flex-col min-h-[300px] overflow-hidden`}>
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-900/60">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white">{title}</h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-900">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto no-scrollbar rounded-xl transition-colors p-1 ${
              snapshot.isDraggingOver ? "bg-slate-900/10" : ""
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 py-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Quadrant Empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    index={index} 
                    columnAccent={accentColor} 
                    onDeleteClick={() => setTaskToDelete(task)}
                  />
                ))}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
