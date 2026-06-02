import React, { useState, useEffect } from 'react';
import { Task, RecurrencePattern } from '../types';
import { X, Repeat } from 'lucide-react';

interface CreateTaskFormProps {
  onConfirm: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => void;
  onCancel: () => void;
  initialData?: Task;
}

export function CreateTaskForm({ onConfirm, onCancel, initialData }: CreateTaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState<string>(
    initialData?.dueDate ? new Date(initialData.dueDate).getTime() - new Date(initialData.dueDate).getTimezoneOffset() * 60000 
      ? new Date(initialData.dueDate - new Date(initialData.dueDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '' : '' 
  );
  const [recurrence, setRecurrence] = useState<RecurrencePattern>(initialData?.recurrence || 'none');
  const [isUrgent, setIsUrgent] = useState(initialData?.isUrgent ?? false);
  const [isImportant, setIsImportant] = useState(initialData?.isImportant ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm({
      title: title.trim(),
      description: description.trim(),
      ...(dueDate ? { dueDate: new Date(dueDate).getTime() } : {}),
      recurrence,
      isUrgent,
      isImportant,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              id="title"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-none"
              placeholder="Add some details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date & Time</label>
              <input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              />
            </div>
            <div>
              <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Repeat size={14} /> Recurrence
              </label>
              <select
                id="recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrencePattern)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-gray-700">Categorization (Eisenhower Matrix)</p>
            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Urgent</span>
                <span className="text-xs text-gray-500">Requires immediate attention</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Important</span>
                <span className="text-xs text-gray-500">Contributes to long-term goals</span>
              </div>
            </label>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              disabled={!title.trim()}
            >
              {initialData ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
