import { tasksApi } from '@/services/api';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocks
fetchMock.enableMocks();

describe('שירות המשימות - TasksApi 🧪', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('מביא את כל המשימות בהצלחה 📋', async () => {
    // Arrange - מכין נתונים לדוגמה
    const mockTasks = [
      { id: '1', title: 'משימה 1', is_completed: false },
      { id: '2', title: 'משימה 2', is_completed: true }
    ];
    fetchMock.mockResponseOnce(JSON.stringify(mockTasks));

    // Act - מפעיל את הפונקציה
    const result = await tasksApi.getTasks();

    // Assert - בודק שהתוצאה נכונה
    expect(result).toEqual(mockTasks);
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks?');
  });

  test('מעדכן משימה כהושלמה בהצלחה 🎯', async () => {
    // Arrange - מכין נתונים לדוגמה
    const taskId = '123';
    const updatedTask = { id: taskId, title: 'משימה לבדיקה', is_completed: true };
    fetchMock.mockResponseOnce(JSON.stringify(updatedTask));

    // Act - מפעיל את הפונקציה
    const result = await tasksApi.toggleTaskCompletion(taskId, true);

    // Assert - בודק שהתוצאה נכונה
    expect(result).toEqual(updatedTask);
    expect(fetchMock).toHaveBeenCalledWith(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_completed: true })
    });
  });

  test('מטפל בשגיאות בצורה נכונה כשיש בעיה בשרת 🚨', async () => {
    // Arrange - מכין תשובת שגיאה
    fetchMock.mockRejectOnce(new Error('שגיאת שרת'));

    // Act & Assert - בודק שהשגיאה מטופלת נכון
    await expect(tasksApi.getTasks()).rejects.toThrow();
  });
}); 