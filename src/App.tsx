import React, { useState, useMemo } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskGrid } from './components/TaskGrid';
import { CreateTaskForm } from './components/CreateTaskForm';
import { FocusMode } from './components/FocusMode';
import { IntegrationsModal } from './components/IntegrationsModal';
import { Task } from './types';
import { Search, Cloud } from 'lucide-react';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask, toggleCompletion } = useTasks();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [focusTask, setFocusTask] = useState<Task | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleCompleteFromFocus = (id: string) => {
    updateTask(id, { isCompleted: true });
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
          
          <button
            onClick={handleOpenNewTask}
            className="whitespace-nowrap px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + Add Task
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 min-h-0 flex flex-col">
        <TaskGrid 
          tasks={filteredTasks}
          onToggleCompletion={toggleCompletion}
          onDelete={deleteTask}
          onEdit={handleEditTask}
          onStartFocus={setFocusTask}
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
    </div>
  );
}
