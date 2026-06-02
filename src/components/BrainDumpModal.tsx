import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Task } from '../types';

interface BrainDumpModalProps {
  onClose: () => void;
  onTasksGenerated: (tasks: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>[]) => void;
}

export function BrainDumpModal({ onClose, onTasksGenerated }: BrainDumpModalProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const res = await fetch('/api/parse-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process text');
      }
      
      if (data.tasks && data.tasks.length > 0) {
        const mappedTasks = data.tasks.map((t: any) => ({
          title: t.title,
          description: t.description || undefined,
          isUrgent: !!t.isUrgent,
          isImportant: !!t.isImportant,
          dueDate: t.dueDate ? new Date(t.dueDate).getTime() : undefined,
          estimatedTime: t.estimatedTime || undefined
        }));
        
        onTasksGenerated(mappedTasks);
      } else {
        setError("AI couldn't find any actionable tasks in that text.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles size={20} />
            <h2 className="text-lg font-bold text-slate-800">AI Brain Dump</h2>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Type out everything on your mind. The AI will extract tasks, categorize them into the Eisenhower Matrix, and estimate time required.
          </p>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing}
            placeholder="e.g., I need to pay the electricity bill by 5 PM today, and I really should start learning Python this weekend. Oh, and buy milk."
            className="w-full h-40 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none outline-none transition-all disabled:opacity-50"
          />

          {error && (
            <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleProcess}
              disabled={isProcessing || !text.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Extract Tasks
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
