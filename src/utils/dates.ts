import { Task } from '@/types';

/**
 * Formats a date for display
 * 
 * @param dateString - The date string to format
 * @returns Formatted date in Hebrew locale (day/month)
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Checks if a task's date is in the past (overdue)
 * 
 * @param task - The task to check
 * @returns True if the task is overdue
 */
export const isTaskOverdue = (task: Task): boolean => {
  const dateString = task.due_date || task.assigned_date;
  if (!dateString || task.is_completed || task.completed) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const taskDate = new Date(dateString);
  taskDate.setHours(0, 0, 0, 0);
  
  return taskDate < today;
};

/**
 * Formats a task's due date for display in a user-friendly way
 * 
 * This function converts dates into kid-friendly terms like "Today" or "Tomorrow"
 * or formats them in a standard way for Hebrew display
 * 
 * @param task - The task object containing a due_date
 * @returns A formatted string representing the due date
 */
export const formatDueDate = (task: Task): string => {
  const dateString = task.due_date || task.assigned_date;
  if (!dateString) return 'לא צוין תאריך';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const taskDate = new Date(dateString);
  taskDate.setHours(0, 0, 0, 0);
  
  // Check if the task is for today, tomorrow, or a specific date
  if (taskDate.getTime() === today.getTime()) {
    return 'היום';
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return 'מחר';
  } else if (isTaskOverdue(task)) {
    return `${formatDate(dateString)} (באיחור)`;
  } else {
    return formatDate(dateString);
  }
}; 