import React, { useState } from 'react';
import { X, Calendar, FileSpreadsheet, Mail, Loader2, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Task } from '../types';
import { getAccessToken } from '../lib/auth';

interface IntegrationsModalProps {
  onClose: () => void;
  tasks: Task[];
  onImportTask: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => void;
}

export function IntegrationsModal({ onClose, tasks, onImportTask }: IntegrationsModalProps) {
  const { needsAuth, user, isLoggingIn, handleLogin, handleLogout } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const exportToSheets = async () => {
    try {
      setIsExporting(true);
      setStatus('Creating spreadsheet...');
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // Create a spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `TaskCatalyst Export - ${new Date().toLocaleDateString()}`
          }
        })
      });
      const sheetData = await createRes.json();
      const spreadsheetId = sheetData.spreadsheetId;

      setStatus('Writing tasks...');
      // Write data
      const values = [
        ['ID', 'Title', 'Description', 'Quadrant', 'Status', 'Due Date', 'Recurrence'],
        ...tasks.map(t => {
          const q = (t.isUrgent && t.isImportant) ? 'Q1' :
                    (!t.isUrgent && t.isImportant) ? 'Q2' :
                    (t.isUrgent && !t.isImportant) ? 'Q3' : 'Q4';
          
          return [
            t.id,
            t.title,
            t.description || '',
            q,
            t.isCompleted ? 'Completed' : 'Pending',
            t.dueDate ? new Date(t.dueDate).toLocaleString() : '',
            t.recurrence || 'none'
          ];
        })
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      setStatus('Export complete, check your Google Drive!');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('Failed to export tasks: ' + (err.message || 'Unknown error'));
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const syncFromGmail = async () => {
    try {
      setIsSyncing(true);
      setStatus('Fetching starred emails...');
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // Fetch starred emails
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:starred', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      const messages = data.messages || [];
      if (messages.length === 0) {
        setStatus('No starred emails found.');
        setTimeout(() => setStatus(null), 3000);
        return;
      }

      setStatus(`Found ${messages.length} starred emails. Converting to tasks...`);
      let added = 0;
      
      for (const msg of messages.slice(0, 5)) { // process up to 5 so we don't bombard
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const msgData = await msgRes.json();
        
        let subject = 'Starred Email';
        const headers = msgData.payload.headers;
        const subjectHeader = headers.find((h: any) => h.name === 'Subject');
        if (subjectHeader) subject = subjectHeader.value;

        // Check if we already have a task with this ID in description or title
        // Just adding as a simple Task for now
        const isAlreadyAdded = tasks.some(t => t.title === `[Email] ${subject}`);
        if (!isAlreadyAdded) {
          onImportTask({
            title: `[Email] ${subject}`,
            description: `Imported from Gmail message ID: ${msg.id}`,
            isUrgent: false,
            isImportant: true
          });
          added++;
        }
      }

      setStatus(`Imported ${added} new starred emails as tasks.`);
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('Failed to fetch from Gmail: ' + (err.message || 'Unknown error'));
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToCalendar = async () => {
    const confirmed = window.confirm(
      `This will sync ${tasks.filter(t => t.dueDate && !t.isCompleted).length} tasks with due dates to your primary calendar. Proceed?`
    );
    if (!confirmed) return;
    
    try {
      setIsSyncing(true);
      setStatus('Syncing to Calendar...');
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const tasksToSync = tasks.filter(t => t.dueDate && !t.isCompleted);
      
      for (const task of tasksToSync) {
        if (!task.dueDate) continue;
        
        const startTime = new Date(task.dueDate);
        const endTime = new Date(task.dueDate + 60 * 60 * 1000); // 1 hour duration
        
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: `[TaskCatalyst] ${task.title}`,
            description: task.description || '',
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
          })
        });
      }

      setStatus('Successfully synced tasks to Calendar!');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('Failed to sync to Calendar: ' + (err.message || 'Unknown error'));
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Workspace Integrations</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {needsAuth ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-2">
                <FileSpreadsheet size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Connect Google Workspace</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">Sign in with your Google account to export tasks to Sheets, sync with Calendar, and more.</p>
              </div>
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="mt-4 flex items-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : (
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                )}
                Sign in with Google
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Check size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">Connected</h3>
                    <p className="text-xs text-emerald-700">{user?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline">Sign out</button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Available Actions</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={exportToSheets}
                    disabled={isExporting || isSyncing}
                    className="flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet className="text-green-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                    <span className="text-sm font-bold text-slate-800">Export to Sheets</span>
                    <span className="text-xs text-slate-500 mt-1">Backup all tasks into a new Google Spreadsheet</span>
                  </button>

                  <button 
                    onClick={syncToCalendar}
                    disabled={isExporting || isSyncing}
                    className="flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                    <span className="text-sm font-bold text-slate-800">Sync Calendar</span>
                    <span className="text-xs text-slate-500 mt-1">Export pending tasks with due dates to Calendar</span>
                  </button>
                  
                  <button 
                    onClick={syncFromGmail}
                    disabled={isExporting || isSyncing}
                    className="flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="text-red-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                    <span className="text-sm font-bold text-slate-800">Gmail Tasks</span>
                    <span className="text-xs text-slate-500 mt-1">Convert starred emails into tasks in Q2</span>
                  </button>
                </div>
              </div>

              {status && (
                <div className="p-3 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg text-center animate-in fade-in">
                  {status}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
