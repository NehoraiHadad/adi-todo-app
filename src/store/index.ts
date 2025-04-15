import { create } from 'zustand';
import { Task, User, DailyMessage, Mood } from '../types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  
  dailyMessages: DailyMessage[];
  setDailyMessages: (messages: DailyMessage[]) => void;
  
  mood: Mood | null;
  setMood: (mood: Mood) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, data) => set((state) => ({
    tasks: state.tasks.map((task) => 
      task.id === id ? { ...task, ...data } : task
    ),
  })),
  
  dailyMessages: [],
  setDailyMessages: (dailyMessages) => set({ dailyMessages }),
  
  mood: null,
  setMood: (mood) => set({ mood }),
})); 