import React from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskGridProps {
  tasks: Task[];
  onToggleCompletion: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onStartFocus: (task: Task) => void;
  onDropTask?: (taskId: string, overId: string | null, isUrgent: boolean, isImportant: boolean) => void;
}

export function TaskGrid({ tasks, onToggleCompletion, onDelete, onEdit, onStartFocus, onDropTask }: TaskGridProps) {
  const getTasks = (isUrgent: boolean, isImportant: boolean) => 
    tasks.filter(t => t.isUrgent === isUrgent && t.isImportant === isImportant);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, isUrgent: boolean, isImportant: boolean) => {
    e.preventDefault();
    if (e.defaultPrevented) return;
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onDropTask) {
      onDropTask(taskId, null, isUrgent, isImportant);
    }
  };

  const quadrants = [
    {
      id: 'q1',
      title: 'Q1: Do First',
      colorClass: 'border-t-rose-500',
      headerBg: 'bg-rose-50/30 border-slate-100',
      titleColor: 'text-rose-700',
      dotColor: 'bg-rose-500',
      badgeColor: 'text-rose-600 bg-rose-100',
      containerClass: 'bg-white rounded-xl shadow-md overflow-hidden',
      tasks: getTasks(true, true),
      isUrgent: true,
      isImportant: true,
      canFocus: true,
      emptyTitle: 'Nothing urgent right now.'
    },
    {
      id: 'q2',
      title: 'Q2: Schedule',
      colorClass: 'border-t-indigo-500',
      headerBg: 'bg-indigo-50/30 border-slate-100',
      titleColor: 'text-indigo-700',
      dotColor: 'bg-indigo-500',
      badgeColor: 'text-indigo-600 bg-indigo-100',
      containerClass: 'bg-white rounded-xl shadow-md overflow-hidden',
      tasks: getTasks(false, true),
      isUrgent: false,
      isImportant: true,
      canFocus: true,
      emptyTitle: 'No tasks scheduled.'
    },
    {
      id: 'q3',
      title: 'Q3: Delegate',
      colorClass: 'border-t-amber-500',
      headerBg: 'bg-amber-50/30 border-slate-100',
      titleColor: 'text-amber-700',
      dotColor: 'bg-amber-500',
      badgeColor: 'text-amber-600 bg-amber-100',
      containerClass: 'bg-white rounded-xl shadow-md overflow-hidden',
      tasks: getTasks(true, false),
      isUrgent: true,
      isImportant: false,
      canFocus: false,
      emptyTitle: 'Nothing to delegate.'
    },
    {
      id: 'q4',
      title: 'Q4: Eliminate',
      colorClass: 'border-t-slate-400',
      headerBg: 'bg-slate-50 border-slate-100',
      titleColor: 'text-slate-600',
      dotColor: 'bg-slate-400',
      badgeColor: 'text-slate-500 bg-slate-200',
      containerClass: 'bg-white rounded-xl shadow-md overflow-hidden opacity-80',
      tasks: getTasks(false, false),
      isUrgent: false,
      isImportant: false,
      canFocus: false,
      emptyTitle: 'Clean quadrant!'
    }
  ];

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto] md:grid-rows-2 gap-4 h-full min-h-0">
      {quadrants.map(q => (
        <section 
          key={q.id} 
          className={`flex flex-col border-t-4 ${q.colorClass} ${q.containerClass} min-h-[300px] md:min-h-0 relative transition-transform duration-200 ease-out`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, q.isUrgent, q.isImportant)}
        >
          <header className={`flex flex-none items-center justify-between p-4 border-b ${q.headerBg}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${q.dotColor}`}></span>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${q.titleColor}`}>{q.title}</h2>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${q.badgeColor}`}>
              {q.tasks.length} {q.tasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </header>
          
          <div className="flex-1 p-3 overflow-y-auto min-h-0 flex flex-col gap-2">
             {q.tasks.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 select-none">
                 <p className="text-xs font-medium text-slate-400">{q.emptyTitle}</p>
               </div>
             ) : (
               <div className="space-y-2 pb-2">
                 {q.tasks.map(task => (
                   <TaskCard 
                     key={task.id} 
                     task={task} 
                     onToggleCompletion={onToggleCompletion}
                     onDelete={onDelete}
                     onEdit={onEdit}
                     onStartFocus={q.canFocus ? onStartFocus : undefined}
                     onDropTask={(taskId) => {
                        if (onDropTask) onDropTask(taskId, task.id, q.isUrgent, q.isImportant);
                     }}
                   />
                 ))}
               </div>
             )}
          </div>
        </section>
      ))}
    </div>
  );
}
