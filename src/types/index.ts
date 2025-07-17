/**
 * Enum defining all possible user roles in the system
 * Must match the database constraint in user_roles table
 */
export enum UserRole {
  /** Child/Student role - for students accessing the educational platform */
  CHILD = 'child',
  /** Parent role - for parents monitoring their children's activities */
  PARENT = 'parent', 
  /** Teacher role - for educators managing classes and students */
  TEACHER = 'teacher',
  /** Admin role - for system administrators with full access */
  ADMIN = 'admin',
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
  slot_index?: number;
  class_id?: string;
  schedule_type: 'personal' | 'class';
  created_by?: string;
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

/**
 * User profile interface containing personal information
 */
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
  username?: string;
  date_of_birth?: string;
  grade?: string;
  parent_phone?: string;
  is_active?: boolean;
}

/**
 * Interface for parent-child relationships
 */
export interface ParentChildRelationship {
  id: string;
  /** Parent user ID */
  parent_id: string;
  /** Child user ID */
  child_id: string;
  /** Type of relationship (parent or guardian) */
  relationship_type: 'parent' | 'guardian';
  /** Whether the relationship is active */
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for class definition
 */
export interface Class {
  id: string;
  /** Class name (e.g., "כיתה א'1") */
  name: string;
  /** Grade level */
  grade?: string;
  /** School year */
  school_year?: string;
  /** Primary teacher ID */
  teacher_id?: string;
  /** Whether the class is active */
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for teacher-class relationships (many-to-many)
 */
export interface TeacherClassRelationship {
  id: string;
  /** Teacher user ID */
  teacher_id: string;
  /** Class ID */
  class_id: string;
  /** Whether this teacher is the primary teacher for the class */
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for class-student relationships
 */
export interface ClassStudent {
  id: string;
  /** Class ID */
  class_id: string;
  /** Student user ID */
  student_id: string;
  /** When the student was enrolled */
  enrolled_at: string;
  /** Whether the enrollment is active */
  is_active: boolean;
}

/**
 * Extended user interface with relationship information
 */
export interface UserWithRelationships extends User {
  /** For parents: their children */
  children?: Profile[];
  /** For children: their parents */
  parents?: Profile[];
  /** For teachers: their classes */
  classes?: Class[];
  /** For students: their class */
  class?: Class;
} 