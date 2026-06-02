import { useState, useEffect } from 'react';
import { Task } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('taskcatalyst-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse tasks', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('taskcatalyst-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      isCompleted: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks((prev) => {
      let newTaskToSpawn: Task | null = null;
      
      const newTasks = prev.map((t) => {
        if (t.id === id) {
          const updatedTask = { ...t, ...updates };
          
          // If task is being marked as completed for the first time and is recurring
          if (updates.isCompleted === true && !t.isCompleted && t.recurrence && t.recurrence !== 'none') {
            const nextDate = new Date(t.dueDate || Date.now());
            if (t.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            if (t.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            if (t.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            
            newTaskToSpawn = {
              ...t,
              id: crypto.randomUUID(),
              dueDate: nextDate.getTime(),
              createdAt: Date.now(),
              isCompleted: false,
            };
          }
          return updatedTask;
        }
        return t;
      });

      if (newTaskToSpawn) {
        newTasks.push(newTaskToSpawn);
      }
      return newTasks;
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleCompletion = (id: string) => {
    setTasks((prev) => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      
      let newTaskToSpawn: Task | null = null;
      
      // If task is being marked as completed and is recurring
      if (!task.isCompleted && task.recurrence && task.recurrence !== 'none') {
        const nextDate = new Date(task.dueDate || Date.now());
        if (task.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        if (task.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (task.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        
        newTaskToSpawn = {
          ...task,
          id: crypto.randomUUID(),
          dueDate: nextDate.getTime(),
          createdAt: Date.now(),
          isCompleted: false,
        };
      }

      const newTasks = prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
      
      if (newTaskToSpawn) {
        newTasks.push(newTaskToSpawn);
      }
      
      return newTasks;
    });
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleCompletion,
  };
}
