import { Task, Schedule, Mood, ParentMessage } from '@/types';

/**
 * Task Service - Task API
 * 
 * A group of functions that help us communicate with the server and manage our tasks!
 * Each function here does something specific like fetching tasks, creating a new task,
 * or marking a task as completed.
 */
export const tasksApi = {
  /**
   * Fetches all tasks from the server
   * 
   * Like asking the server: "Please give me all my tasks!"
   * 
   * @param includeCompleted - Should completed tasks be included?
   * @param isShared - Should only shared tasks be included?
   * @returns A list of all the tasks we requested
   */
  getTasks: async (includeCompleted: boolean = false, isShared?: boolean): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (includeCompleted) queryParams.append('includeCompleted', 'true');
    if (isShared !== undefined) queryParams.append('isShared', isShared.toString());
    
    const response = await fetch(`/api/tasks?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching tasks: ${response.statusText}`);
    }
    return await response.json();
  },
  
  /**
   * Fetches a specific task by its ID
   * 
   * Like asking: "Please give me the task with this ID"
   * 
   * @param id - The unique identifier of the task (like a serial number)
   * @returns The task we requested
   */
  getTask: async (id: string): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`);
    if (!response.ok) {
      throw new Error(`Error fetching task: ${response.statusText}`);
    }
    return await response.json();
  },
  
  /**
   * Creates a new task
   * 
   * Like asking: "Here's a new task, please add it to my list!"
   * 
   * @param task - Details of the new task (name, date, etc.)
   * @returns The new task after it's created on the server
   */
  createTask: async (task: Partial<Task>): Promise<Task> => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    });
    if (!response.ok) {
      throw new Error(`Error creating task: ${response.statusText}`);
    }
    return await response.json();
  },
  
  /**
   * Updates an existing task
   * 
   * Like asking: "Here are changes to a task, please update it!"
   * 
   * @param id - The ID of the task to update
   * @param updates - The changes to make to the task
   * @returns The updated task after the changes
   */
  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error(`Error updating task: ${response.statusText}`);
    }
    return await response.json();
  },
  
  /**
   * Deletes a task
   * 
   * Like asking: "Can you please delete this task?"
   * 
   * @param id - The ID of the task to delete
   */
  deleteTask: async (id: string): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Error deleting task: ${response.statusText}`);
    }
  },
  
  /**
   * Toggles a task's completion status
   * 
   * An easy way to mark a task as completed or not completed
   * 
   * @param id - The ID of the task
   * @param isCompleted - Is the task completed? (yes/no)
   * @returns The updated task
   */
  toggleTaskCompletion: async (id: string, isCompleted: boolean): Promise<Task> => {
    return await tasksApi.updateTask(id, { is_completed: isCompleted });
  }
};

// Schedules API
export const schedulesApi = {
  getSchedules: async (dayOfWeek?: number, isShared?: boolean): Promise<Schedule[]> => {
    const queryParams = new URLSearchParams();
    if (dayOfWeek !== undefined) queryParams.append('dayOfWeek', dayOfWeek.toString());
    if (isShared !== undefined) queryParams.append('isShared', isShared.toString());
    
    const response = await fetch(`/api/schedules?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching schedules: ${response.statusText}`);
    }
    return await response.json();
  },
  
  getAllSchedules: async (isShared?: boolean, timestamp?: number): Promise<Record<number, Schedule[]>> => {
    const queryParams = new URLSearchParams();
    if (isShared !== undefined) queryParams.append('isShared', isShared.toString());
    queryParams.append('allDays', 'true');
    if (timestamp) queryParams.append('t', timestamp.toString());
    
    const response = await fetch(`/api/schedules?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching all schedules: ${response.statusText}`);
    }
    return await response.json();
  },
  
  createSchedule: async (schedule: Partial<Schedule>): Promise<Schedule> => {
    try {
      // Always ensure proper time format with padding
      const formattedSchedule = {
        ...schedule,
        start_time: schedule.start_time ? schedule.start_time.padStart(5, '0') : undefined,
        end_time: schedule.end_time ? schedule.end_time.padStart(5, '0') : undefined
      };
      
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedSchedule)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating schedule:', errorText);
        throw new Error(`Error creating schedule: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      throw error;
    }
  },
  
  updateSchedule: async (id: string, updates: Partial<Schedule>): Promise<Schedule> => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error(`Error updating schedule ${id}:`, errorData);
        
        // Create a dummy result with the updates if we get an error but the update might have succeeded
        if (response.status === 500 && errorData.message === 'Update successful but could not fetch updated data') {
          console.info(`Schedule ${id} was likely updated successfully despite error`);
          return {
            id,
            ...updates,
            user_id: 'unknown', // We don't know the user_id
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Schedule;
        }
        
        throw new Error(`Error updating schedule: ${errorData.error || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to update schedule ${id}:`, error);
      throw error;
    }
  },
  
  deleteSchedule: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error deleting schedule item ${id}:`, errorText);
        throw new Error(`Error deleting schedule item: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to delete schedule item ${id}:`, error);
      throw error;
    }
  },
  
  deleteSchedulesForDay: async (dayOfWeek: number): Promise<void> => {
    const queryParams = new URLSearchParams();
    queryParams.append('dayOfWeek', dayOfWeek.toString());
    
    const response = await fetch(`/api/schedules?${queryParams.toString()}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting schedules: ${response.statusText}`);
    }
  },
  
  getToday: async (): Promise<Schedule[]> => {
    const today = new Date().getDay();
    // Convert from JS Sunday=0 to our day_of_week where Sunday=0
    const dayOfWeek = today;
    
    return await schedulesApi.getSchedules(dayOfWeek);
  }
};

// Moods API
export const moodsApi = {
  getMoods: async (limit?: number, today: boolean = false): Promise<Mood[]> => {
    const queryParams = new URLSearchParams();
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    if (today) queryParams.append('today', 'true');
    
    const response = await fetch(`/api/moods?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching moods: ${response.statusText}`);
    }
    return await response.json();
  },
  
  createMood: async (mood: Partial<Mood>): Promise<Mood> => {
    const response = await fetch('/api/moods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mood)
    });
    if (!response.ok) {
      throw new Error(`Error creating mood: ${response.statusText}`);
    }
    return await response.json();
  },
  
  getTodayMood: async (): Promise<Mood | null> => {
    const moods = await moodsApi.getMoods(1, true);
    return moods.length > 0 ? moods[0] : null;
  }
};

// Parent Messages API
export const parentMessagesApi = {
  getMessages: async (unreadOnly: boolean = false, limit?: number): Promise<ParentMessage[]> => {
    const queryParams = new URLSearchParams();
    if (unreadOnly) queryParams.append('unreadOnly', 'true');
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    
    const response = await fetch(`/api/parent-messages?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching parent messages: ${response.statusText}`);
    }
    return await response.json();
  },
  
  createMessage: async (message: Partial<ParentMessage>): Promise<ParentMessage> => {
    const response = await fetch('/api/parent-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    if (!response.ok) {
      throw new Error(`Error creating parent message: ${response.statusText}`);
    }
    return await response.json();
  },
  
  markAsRead: async (ids: string[]): Promise<ParentMessage[]> => {
    const response = await fetch('/api/parent-messages', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ids,
        is_read: true
      })
    });
    if (!response.ok) {
      throw new Error(`Error marking messages as read: ${response.statusText}`);
    }
    return await response.json();
  },
  
  getLatestMessages: async (limit: number = 1): Promise<ParentMessage[]> => {
    return await parentMessagesApi.getMessages(false, limit);
  }
}; 