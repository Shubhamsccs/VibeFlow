import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import TaskModal from '../components/TaskModal';
import { useTaskStore } from '../store/useTaskStore';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function MainLayout() {
  const { 
    isTaskModalOpen, 
    closeTaskModal, 
    taskToEdit, 
    isResetModalOpen, 
    closeResetModal, 
    resetStore 
  } = useTaskStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.contentEditable === 'true') {
        return;
      }

      const shortcuts = {
        '1': '/dashboard',
        '2': '/tasks',
        '3': '/tracker',
        '4': '/timeline',
        '5': '/calendar',
        '6': '/analytics',
      };

      if (shortcuts[e.key]) {
        navigate(shortcuts[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 relative">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 transition-all duration-300 bg-black">
          <div className="h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      
      <TaskModal isOpen={isTaskModalOpen} onClose={closeTaskModal} taskToEdit={taskToEdit} />

      {/* Global Reset Modal - Full Screen Blur */}
      {isResetModalOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen z-9999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-4xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden my-auto animate-slide-in p-8 text-center">
            <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase">Wipe Data?</h2>
            <p className="text-slate-500 text-sm font-medium mb-8">This will permanently delete all tasks, moods, and history. You cannot undo this action.</p>

            <div className="flex gap-3">
              <button 
                onClick={closeResetModal}
                className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  resetStore();
                  closeResetModal();
                }}
                className="flex-2 py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/40"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
