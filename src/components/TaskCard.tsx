import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Edit2, Play, Trash2, Clock, Repeat } from 'lucide-react';

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onToggleCompletion: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onStartFocus?: (task: Task) => void; // Optional because only Q1 and Q2 can have Focus Mode
  onDropTask?: (taskId: string) => void;
}

export function TaskCard({ task, onToggleCompletion, onDelete, onEdit, onStartFocus, onDropTask }: TaskCardProps) {
  const getRelativeTimeText = (timestamp: number) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 0) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return rtf.format(daysDifference, 'day');
  };

  const isOverdue = task.dueDate && task.dueDate < Date.now() && !task.isCompleted;
  const isUrgentQ1 = task.isUrgent && task.isImportant;

  const baseClass = isUrgentQ1
    ? 'p-3 bg-rose-50 border border-rose-100 rounded-lg shadow-sm flex flex-col gap-2 ring-2 ring-rose-500/20'
    : 'p-3 bg-white border border-slate-100 rounded-lg flex flex-col gap-2 transition-all hover:shadow-md';

  const completedClass = task.isCompleted ? 'opacity-60 grayscale' : '';
  const overdueClass = isOverdue && !task.isCompleted ? 'border-red-300 ring-1 ring-red-200' : '';

  const titleClass = isUrgentQ1 
    ? 'text-sm font-bold text-slate-800' 
    : 'text-sm font-semibold text-slate-700';

  const strikeClass = task.isCompleted ? 'line-through text-slate-500 font-medium' : '';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && taskId !== task.id && onDropTask) {
      onDropTask(taskId);
    }
  };

  return (
    <div 
      className={`${baseClass} ${completedClass} ${overdueClass} cursor-grab active:cursor-grabbing`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-start justify-between gap-3">
        <button 
          onClick={() => onToggleCompletion(task.id)}
          className="mt-0.5 shrink-0 flex-none focus:outline-none transition-transform hover:scale-110"
        >
          {task.isCompleted ? (
            <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center ${isUrgentQ1 ? 'bg-rose-500' : 'bg-slate-500'}`}>
              <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className={`mt-0.5 w-4 h-4 rounded border-2 ${isUrgentQ1 ? 'border-rose-400' : 'border-slate-300'}`} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`${titleClass} truncate ${strikeClass}`}>
              {task.title}
            </p>
            {isUrgentQ1 && !task.isCompleted && (
              <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                URGENT
              </span>
            )}
          </div>
          
          {task.description && (
            <p className={`text-xs mt-0.5 line-clamp-2 ${isUrgentQ1 ? 'text-slate-600' : 'text-slate-500'}`}>
              {task.description}
            </p>
          )}

          {(task.dueDate || (task.recurrence && task.recurrence !== 'none') || task.estimatedTime) && (
            <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
              {task.estimatedTime && (
                <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                  <span>~{task.estimatedTime}m</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{isOverdue ? 'Overdue' : 'Due'} {getRelativeTimeText(task.dueDate)}</span>
                </div>
              )}
              {task.recurrence && task.recurrence !== 'none' && (
                <div className="flex items-center gap-0.5 text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded">
                  <Repeat size={10} />
                  <span className="capitalize">{task.recurrence}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(task)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors focus:outline-none" title="Edit Task">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-colors focus:outline-none" title="Delete Task">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {!task.isCompleted && onStartFocus && (
        <div className="flex justify-end mt-1">
          <button 
            onClick={() => onStartFocus(task)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors focus:outline-none uppercase tracking-wider"
          >
            <Play size={10} className="fill-current" />
            Focus
          </button>
        </div>
      )}
    </div>
  );
}
