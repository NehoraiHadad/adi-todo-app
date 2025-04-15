import { formatDueDate } from '@/utils/dates';
import { Task } from '@/types';

describe('תאריכים שמחים! - Date Utils', () => {
  test('מחזיר מחרוזת ריקה אם אין תאריך יעד 🤷‍♀️', () => {
    // Create a task without a due date
    const task: Task = {
      id: '1',
      title: 'משימה בלי תאריך יעד',
      is_completed: false,
      user_id: 'user123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_shared: false
    };
    
    expect(formatDueDate(task)).toBe('');
  });
  
  test('מחזיר "היום" עבור משימות שמועד היעד שלהן הוא היום 📅', () => {
    // Create a task with today's date
    const today = new Date();
    const task: Task = {
      id: '1',
      title: 'משימה להיום',
      is_completed: false,
      user_id: 'user123',
      due_date: today.toISOString(),
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      is_shared: false
    };
    
    expect(formatDueDate(task)).toBe('היום');
  });
  
  test('מחזיר "מחר" עבור משימות שמועד היעד שלהן הוא מחר 🔜', () => {
    // Create a task with tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const task: Task = {
      id: '1',
      title: 'משימה למחר',
      is_completed: false,
      user_id: 'user123',
      due_date: tomorrow.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_shared: false
    };
    
    expect(formatDueDate(task)).toBe('מחר');
  });
  
  test('מחזיר תאריך מפורמט עבור משימות עם תאריך יעד אחר 📆', () => {
    // Create a task with a future date (3 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    
    const task: Task = {
      id: '1',
      title: 'משימה לעתיד',
      is_completed: false,
      user_id: 'user123',
      due_date: futureDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_shared: false
    };
    
    // We can't easily test the exact formatted string as it depends on the locale,
    // but we can check that it's not 'היום' or 'מחר'
    const formatted = formatDueDate(task);
    expect(formatted).not.toBe('היום');
    expect(formatted).not.toBe('מחר');
    expect(formatted).toBeTruthy();
  });
}); 