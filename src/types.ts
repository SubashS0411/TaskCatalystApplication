export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  isUrgent: boolean;
  isImportant: boolean;
  dueDate?: number; // timestamp
  recurrence?: RecurrencePattern;
  isCompleted: boolean;
  createdAt: number;
}
