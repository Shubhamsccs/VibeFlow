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
  const { tasks, openTaskModal, moveTask, deleteTask } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("college");
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    moveTask(result.draggableId, result.destination.droppableId, result.destination.index);
  };

  const normalizeStatus = (status) => {
    if (!status || status === "todo") return "college";
    if (status === "webdev") return "web-dev";
    if (status === "java") return "dsa-java";
    if (status === "practice") return "dsa-practice";
    return status;
  };

  const currentColumn = COLUMNS.find(c => c.id === activeTab);
  const columnTasks = tasks.filter((t) => normalizeStatus(t.status) === activeTab && 
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.description?.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in bg-black">
      {/* Header & Tabs */}
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Activities</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Manage your focused sessions</p>
          </div>
          
          <div className="flex items-center gap-3">
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
              className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-brand-primary/20"
            >
              <Plus className="w-4 h-4" />
              NEW TASK
            </button>
          </div>
        </div>

        {/* Tab Selector */}
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
      </div>

      {/* Single Column Content */}
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
                        className="mt-4 text-brand-primary font-bold hover:underline uppercase text-xs tracking-widest"
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

      {/* In-App Delete Confirmation Modal */}
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
