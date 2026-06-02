export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  isUrgent: boolean;
  isImportant: boolean;
  dueDate?: number; // timestamp
  recurrence?: RecurrencePattern;
  estimatedTime?: number; // minutes
  actualTimeSpent?: number; // seconds
  isCompleted: boolean;
  createdAt: number;
}
