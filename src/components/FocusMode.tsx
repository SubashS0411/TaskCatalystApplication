import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { Pause, Play, Square, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onCompleteTask: (id: string) => void;
}

const DEFAULT_TIME = 25 * 60; // 25 minutes in seconds

export function FocusMode({ task, onClose, onCompleteTask }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    let interval: number;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      setIsFinished(true);
      setIsActive(false);
      playAlarm();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isFinished]);

  const playAlarm = () => {
    // Attempt standard browser notification if permitted
    if (Notification.permission === 'granted') {
      try {
        new Notification('Focus Time Complete!', {
          body: `You finished your focus session for: ${task.title}`
        });
      } catch (err) {
        console.warn('Notification failed', err);
      }
    }

    // Simple oscillator beep using Web Audio API so we don't need external sound files
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio alarm failed', e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DEFAULT_TIME);
  };

  const handleComplete = () => {
    onCompleteTask(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 sm:p-12 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl flex flex-col items-center justify-center space-y-12"
      >
        <div className="text-center space-y-4">
          <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">Focusing on</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-lg mx-auto leading-tight">
            {task.title}
          </h1>
        </div>

        <div className="relative flex items-center justify-center">
          <motion.div 
            animate={{ scale: isActive ? [1, 1.02, 1] : 1 }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-indigo-500/30 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.2)]"
          >
            <div className="text-6xl sm:text-7xl font-mono font-medium tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </div>
            {isFinished && (
               <span className="text-emerald-400 font-medium mt-4 tracking-widest uppercase text-sm">Time's Up!</span>
            )}
          </motion.div>
        </div>

        {isFinished ? (
          <div className="flex flex-col gap-4 items-center">
            <button 
              onClick={handleComplete}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium transition-all shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 size={20} />
              Mark Completed
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
            >
              Take a Break (Close)
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTimer}
              className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isActive ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
            </button>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-full border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all"
              title="Abort Focus Mode"
            >
              <Square size={18} className="fill-current" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
