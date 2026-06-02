import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskGrid } from './components/TaskGrid';
import { CreateTaskForm } from './components/CreateTaskForm';
import { FocusMode } from './components/FocusMode';
import { Task } from './types';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask, toggleCompletion } = useTasks();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [focusTask, setFocusTask] = useState<Task | undefined>(undefined);

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

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm flex-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            TC
          </div>
          <h1 className="text-xl font-bold tracking-tight">TaskCatalyst</h1>
          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded">PRO</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button
            onClick={handleOpenNewTask}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + Add Task
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 min-h-0 flex flex-col">
        <TaskGrid 
          tasks={tasks}
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
    </div>
  );
}
