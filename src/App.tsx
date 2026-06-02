import React, { useState, useMemo } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskGrid } from './components/TaskGrid';
import { CreateTaskForm } from './components/CreateTaskForm';
import { FocusMode } from './components/FocusMode';
import { IntegrationsModal } from './components/IntegrationsModal';
import { BrainDumpModal } from './components/BrainDumpModal';
import { Task } from './types';
import { Search, Cloud, Sparkles } from 'lucide-react';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask, toggleCompletion, reorderTask } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [focusTask, setFocusTask] = useState<Task | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [consecutiveQ1, setConsecutiveQ1] = useState(0);
  const [suggestedBreakTask, setSuggestedBreakTask] = useState<Task | undefined>(undefined);

  const handleOpenNewTask = () => {
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormConfirm = (taskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const handleToggleCompletion = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // If completing a Q1 task
    if (!task.isCompleted && task.isUrgent && task.isImportant) {
      const newStreak = consecutiveQ1 + 1;
      setConsecutiveQ1(newStreak);
      
      if (newStreak >= 3) {
        // Suggest a Q3 task
        const q3Tasks = tasks.filter(t => t.isUrgent && !t.isImportant && !t.isCompleted);
        if (q3Tasks.length > 0) {
          // Select a random or shortest Q3 task
          const suggestion = q3Tasks.sort((a, b) => (a.estimatedTime || 0) - (b.estimatedTime || 0))[0];
          setSuggestedBreakTask(suggestion);
        } else {
          // Or just a general break message if no Q3 tasks
          setSuggestedBreakTask({
            id: 'break',
            title: 'Take a break!',
            description: 'You have worked hard. Time to rest your brain.',
            isUrgent: false,
            isImportant: false,
            isCompleted: false,
            createdAt: Date.now()
          } as Task);
        }
        setConsecutiveQ1(0); // reset streak
      }
    } else if (!task.isCompleted) {
      // Completing a non-Q1 task breaks the "high intensity" streak
      setConsecutiveQ1(0);
    }

    toggleCompletion(id);
  };

  const handleCompleteFromFocus = (id: string) => {
    handleToggleCompletion(id);
  };

  const handleDropTask = (taskId: string, overId: string | null, isUrgent: boolean, isImportant: boolean) => {
    reorderTask(taskId, overId, isUrgent, isImportant);
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) || 
      (task.description && task.description.toLowerCase().includes(query))
    );
  }, [tasks, searchQuery]);

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm flex-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            TC
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">TaskCatalyst</h1>
          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded hidden sm:block">PRO</span>
        </div>
        
        <div className="flex-1 max-w-md mx-4 sm:mx-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setIsIntegrationsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-semibold transition-colors"
          >
            <Cloud size={18} />
            <span className="hidden sm:inline">Integrations</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBrainDumpOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
            >
              <Sparkles size={16} />
              Brain Dump
            </button>
            <button
              onClick={handleOpenNewTask}
              className="whitespace-nowrap px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Add Task
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 min-h-0 flex flex-col">
        <TaskGrid 
          tasks={filteredTasks}
          onToggleCompletion={handleToggleCompletion}
          onDelete={deleteTask}
          onEdit={handleEditTask}
          onStartFocus={setFocusTask}
          onDropTask={handleDropTask}
        />
      </main>

      {/* Overlays */}
      {isFormOpen && (
        <CreateTaskForm 
          onConfirm={handleFormConfirm}
          onCancel={handleFormCancel}
          initialData={editingTask}
        />
      )}

      {focusTask && (
        <FocusMode 
          task={focusTask}
          onClose={() => setFocusTask(undefined)}
          onCompleteTask={handleCompleteFromFocus}
        />
      )}

      {isIntegrationsOpen && (
        <IntegrationsModal
          onClose={() => setIsIntegrationsOpen(false)}
          tasks={tasks}
          onImportTask={addTask}
        />
      )}

      {isBrainDumpOpen && (
        <BrainDumpModal
          onClose={() => setIsBrainDumpOpen(false)}
          onTasksGenerated={(generatedTasks) => {
            generatedTasks.forEach(t => addTask(t));
            setIsBrainDumpOpen(false);
          }}
        />
      )}

      {suggestedBreakTask && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Prevent Burnout</h2>
              <p className="text-sm text-slate-500 mt-2">
                You've completed 3 high-intensity tasks back-to-back! To prevent cognitive fatigue, we suggest tackling a lower-effort task next.
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Suggested Task</p>
              <p className="font-semibold text-slate-800 text-sm truncate">{suggestedBreakTask.title}</p>
              {suggestedBreakTask.estimatedTime && (
                 <p className="text-xs text-slate-500 mt-1">Est. time: {suggestedBreakTask.estimatedTime}m</p>
              )}
            </div>

            <button
              onClick={() => {
                const bTask = suggestedBreakTask;
                setSuggestedBreakTask(undefined);
                if (bTask.id !== 'break' && !bTask.isCompleted) {
                  setFocusTask(bTask);
                }
              }}
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              {suggestedBreakTask.id === 'break' ? 'Got it' : 'Focus on this task'}
            </button>
            <button
              onClick={() => setSuggestedBreakTask(undefined)}
              className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              No thanks, I'll choose my own
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
