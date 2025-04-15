import { Task } from '@/types';

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
  if (!task.due_date) return '';
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  const dueDate = new Date(task.due_date);
  
  if (dueDate.toDateString() === today.toDateString()) {
    return 'היום';
  } else if (dueDate.toDateString() === tomorrow.toDateString()) {
    return 'מחר';
  } else {
    // Format the date in Hebrew style
    return dueDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  }
}; 