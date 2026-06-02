import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, Mic, MicOff, Cpu } from 'lucide-react';
import { Task } from '../types';

interface BrainDumpModalProps {
  onClose: () => void;
  onTasksGenerated: (tasks: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>[]) => void;
}

export function BrainDumpModal({ onClose, onTasksGenerated }: BrainDumpModalProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiCoreAvailable, setIsAiCoreAvailable] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for Chrome's local window.ai / Prompt API
    if (window && 'ai' in window && (window as any).ai) {
      setIsAiCoreAvailable(true);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: any) => {
      let currentTranscription = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscription += event.results[i][0].transcript;
      }
      if (currentTranscription) {
        setText(prev => prev + ' ' + currentTranscription.trim());
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const processLocallyWithAiCore = async () => {
    try {
      const session = await (window as any).ai.createTextSession();
      // Craft prompt for local small model
      const prompt = `Extract tasks from this text and return ONLY a valid JSON array where each object has: title (string), description (string), isUrgent (boolean), isImportant (boolean), estimatedTime (number in minutes). TEXT: ${text}`;
      const response = await session.prompt(prompt);
      
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse JSON from local AI response.");
    } catch (err) {
      console.error("Local AI processing failed", err);
      throw err;
    }
  };

  const handleProcess = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    if (isRecording && recognitionRef.current) {
       recognitionRef.current.stop();
       setIsRecording(false);
    }
    
    let rawTasks = null;
    
    try {
      if (!navigator.onLine && isAiCoreAvailable) {
        // Fallback to local processing if offline
        rawTasks = await processLocallyWithAiCore();
      } else {
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
        rawTasks = data.tasks;
      }
      
      if (rawTasks && rawTasks.length > 0) {
        const mappedTasks = rawTasks.map((t: any) => ({
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
      // Attempt fallback if cloud failed
      if (navigator.onLine && isAiCoreAvailable && !rawTasks) {
        try {
           rawTasks = await processLocallyWithAiCore();
           if (rawTasks && rawTasks.length > 0) {
             const mappedTasks = rawTasks.map((t: any) => ({
              title: t.title,
              description: t.description || undefined,
              isUrgent: !!t.isUrgent,
              isImportant: !!t.isImportant,
              estimatedTime: t.estimatedTime || undefined
            }));
            onTasksGenerated(mappedTasks);
            return;
           }
        } catch (localErr) {
           console.error('Local fallback also failed', localErr);
        }
      }
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
          <div className="flex items-center gap-3">
            {isAiCoreAvailable && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-violet-100 text-violet-700 rounded-full" title="On-Device AI Available via Chrome Prompt API">
                <Cpu size={12} />
                Local AI Ready
              </span>
            )}
            <button onClick={onClose} disabled={isProcessing} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Type out everything on your mind. The AI will extract tasks, categorize them into the Eisenhower Matrix, and estimate time required.
          </p>
          
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isProcessing}
              placeholder="e.g., I need to pay the electricity bill by 5 PM today, and I really should start learning Python this weekend. Oh, and buy milk."
              className="w-full h-40 p-4 pb-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`absolute bottom-3 left-3 p-2 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'
              }`}
              title={isRecording ? "Stop Recording" : "Start Voice Interaction"}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {isRecording && (
              <span className="absolute bottom-5 left-12 text-xs font-semibold text-red-500 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Listening...
              </span>
            )}
          </div>

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
