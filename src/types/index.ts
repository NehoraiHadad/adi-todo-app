export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
  PARENT = 'parent',
}

export enum DayOfWeek {
  SUNDAY = 'Sunday',
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
}

export enum TaskType {
  PERSONAL = 'personal',
  CLASS = 'class',
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  assigned_editor: boolean;
}

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  lesson_number: number;
  subject: string;
  icon: string;
  color: string;
}

export interface Task {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  is_completed?: boolean;
  priority?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  is_shared?: boolean;
  assigned_date?: string;
  subject?: string;
  type?: TaskType;
  completed?: boolean;
  
  // Internal fields for UI
  _originalTitle?: string;
  _displayTitle?: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  subject_icon?: string;
  room?: string;
  teacher?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
}

export interface Mood {
  id: string;
  user_id: string;
  mood_type: string;
  emoji: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyMessage {
  id: string;
  message_date: string;
  message: string;
  author: string;
}

export interface Reward {
  id: string;
  user_id: string;
  reward_name: string;
  reward_icon: string;
  received_at: string;
}

export interface EquipmentItem {
  id: string;
  date: string;
  item: string;
  packed: boolean;
}

export interface HouseChore {
  id: string;
  chore_date: string;
  task: string;
  completed: boolean;
  assigned_to?: string;
}

export interface ParentMessage {
  id: string;
  user_id: string;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  email_notifications?: boolean;
  created_at?: string;
  updated_at?: string;
  email?: string;
  avatar_url?: string;
  class_id?: string;
  role?: string;
} 