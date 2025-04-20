import { DayOfWeek } from '@/types'; // Import the string enum

// Represents a single subject in the schedule
export interface Subject {
  id: string; // Unique identifier for the subject
  name: string; // Name of the subject (e.g., "Math", "Art")
  color?: string; // Optional color associated with the subject (e.g., 'bg-purple-100')
  textColor?: string; // Optional text color (e.g., 'text-purple-700')
  icon?: string; // Optional icon (e.g., '🔤')
}

// Represents a single slot entry in the schedule grid for a specific day
export interface ScheduleSlot {
  // id: string; // Maybe not needed if keying by slotIndex
  slotIndex: number; // The index of the slot within the day (e.g., 0, 1, 2...)
  day: DayOfWeek; // The day this slot belongs to
  subject: Subject | null; // The subject assigned to this slot, or null if empty
  startTime: string; // Specific start time for this slot (e.g., "08:00")
  endTime: string; // Specific end time for this slot (e.g., "08:45")
}

// Represents the entire schedule data structure
// Maps DayOfWeek string to an array of ScheduleSlot objects for that day
export interface ScheduleData {
  [day: string]: ScheduleSlot[]; 
}

// Represents the structure for default time definitions (without subject/day)
export interface DefaultTimeSlot {
    id?: string; // UUID from database
    startTime: string;
    endTime: string;
    slotIndex?: number; // Position in the schedule
    is_default?: boolean;
}

// Helper type for editing state
export interface ScheduleEditState {
  selectedSlots: string[]; // IDs of the time slots currently selected
  unsavedChanges: boolean;
  // Add other relevant editing states as needed
}

// Type for raw Supabase schedule row (reflects DB schema)
export interface SupabaseScheduleRecord {
  id: string; // Primary key
  user_id?: string;
  day_of_week: number; // Assumes 0 for Sunday, 1 for Monday, etc. in DB
  slot_index: number;
  start_time: string; // e.g., "08:00:00"
  end_time: string; // e.g., "08:45:00"
  subject: string | null; // Use the subject name directly as in DB logs
  // Add other fields like created_at, updated_at if needed
}

// Static list of Subjects (used for validation and UI selection)
export const subjects: Subject[] = [
  { id: 'english', name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
  { id: 'hebrew', name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
  { id: 'math', name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
  { id: 'halacha', name: 'הלכה', color: 'bg-blue-100', textColor: 'text-blue-700', icon: '📕' },
  { id: 'tanach', name: 'תנ"ך', color: 'bg-teal-100', textColor: 'text-teal-700', icon: '📖' },
  { id: 'mathematics', name: 'מתמטיקה', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📐' },
  { id: 'gym', name: 'חנ"ג', color: 'bg-orange-100', textColor: 'text-orange-700', icon: '⚽' },
  { id: 'torah-iyun', name: 'תורה-עיון', color: 'bg-green-100', textColor: 'text-green-700', icon: '🕮' },
  { id: 'life-skills', name: 'כישורי-חיים', color: 'bg-pink-100', textColor: 'text-pink-700', icon: '🧠' },
  { id: 'science', name: 'מדעים', color: 'bg-green-100', textColor: 'text-green-700', icon: '🌱' },
  { id: 'art', name: 'אמנות', color: 'bg-pink-100', textColor: 'text-pink-700', icon: '🎨' },
  { id: 'mishna', name: 'משנה', color: 'bg-amber-100', textColor: 'text-amber-700', icon: '📜' },
  { id: 'parasha', name: 'פרשת-שבוע', color: 'bg-violet-100', textColor: 'text-violet-700', icon: '🕯️' },
  { id: 'friday-personal', name: 'שישי-אישי', color: 'bg-rose-100', textColor: 'text-rose-700', icon: '🌟' },
  { id: 'computers', name: 'מחשבים', color: 'bg-slate-100', textColor: 'text-slate-700', icon: '💻' },
]; 