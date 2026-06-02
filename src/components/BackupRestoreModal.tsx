import React, { useRef } from 'react';
import { Task } from '../types';
import { X, Download, Upload, Database } from 'lucide-react';

interface BackupRestoreModalProps {
  tasks: Task[];
  onClose: () => void;
  onImport: (tasks: Task[]) => void;
}

export function BackupRestoreModal({ tasks, onClose, onImport }: BackupRestoreModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `taskcatalyst-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedTasks)) {
          // Additional validation can be added here
          onImport(importedTasks);
          onClose();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (error) {
        console.error('Failed to parse backup file', error);
        alert('Failed to parse backup file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-600">
            <Database size={20} />
            <h2 className="text-lg font-bold text-slate-800">Backup & Restore</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Export Data</h3>
              <p className="text-xs text-slate-500 mt-1">Download your current tasks as a JSON file to keep them safe.</p>
            </div>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Download size={18} />
              Export Backup
            </button>
          </div>

          <div className="border-t border-slate-100"></div>

          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Import Data</h3>
              <p className="text-xs text-slate-500 mt-1">Restore your tasks from a previous backup. This will replace all current tasks.</p>
            </div>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Upload size={18} />
              Import Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
