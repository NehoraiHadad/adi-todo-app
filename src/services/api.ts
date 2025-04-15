import { Task, Schedule, Mood, ParentMessage } from '@/types';

// Tasks API
export const tasksApi = {
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
  
  getTask: async (id: string): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`);
    if (!response.ok) {
      throw new Error(`Error fetching task: ${response.statusText}`);
    }
    return await response.json();
  },
  
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
  
  deleteTask: async (id: string): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Error deleting task: ${response.statusText}`);
    }
  },
  
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
  
  createSchedule: async (schedule: Partial<Schedule>): Promise<Schedule> => {
    const response = await fetch('/api/schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(schedule)
    });
    if (!response.ok) {
      throw new Error(`Error creating schedule: ${response.statusText}`);
    }
    return await response.json();
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