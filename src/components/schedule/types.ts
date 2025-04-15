import { DayOfWeek } from '@/types';

// Types
export interface Subject {
  name: string;
  color: string;
  textColor: string;
  icon: string;
}

export type ScheduleData = {
  [key in DayOfWeek]: (Subject | null)[];
};

export type TimeSlot = {
  id: number;
  startTime: string;
  endTime: string;
};

// Constants
export const subjects: Subject[] = [
  { name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
  { name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
  { name: 'מדעים', color: 'bg-green-100', textColor: 'text-green-700', icon: '🌱' },
  { name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
  { name: 'אמנות', color: 'bg-pink-100', textColor: 'text-pink-700', icon: '🎨' },
  { name: 'ספורט', color: 'bg-orange-100', textColor: 'text-orange-700', icon: '⚽' },
  { name: 'מוזיקה', color: 'bg-blue-100', textColor: 'text-blue-700', icon: '🎵' },
  { name: 'תנ"ך', color: 'bg-teal-100', textColor: 'text-teal-700', icon: '📖' },
  { name: 'היסטוריה', color: 'bg-red-100', textColor: 'text-red-700', icon: '🏛️' },
  { name: 'גיאוגרפיה', color: 'bg-cyan-100', textColor: 'text-cyan-700', icon: '🌍' },
];

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 0, startTime: '8:00', endTime: '8:45' },
  { id: 1, startTime: '8:50', endTime: '9:35' },
  { id: 2, startTime: '9:50', endTime: '10:35' },
  { id: 3, startTime: '10:40', endTime: '11:25' },
  { id: 4, startTime: '11:40', endTime: '12:25' },
  { id: 5, startTime: '12:30', endTime: '13:15' },
  { id: 6, startTime: '13:30', endTime: '14:15' },
  { id: 7, startTime: '14:20', endTime: '15:05' },
];

// For backwards compatibility
export const timeSlots = DEFAULT_TIME_SLOTS.map(
  slot => `${slot.startTime} - ${slot.endTime}`
);

// Dummy schedule data
export const initialSchedule: ScheduleData = {
  [DayOfWeek.SUNDAY]: [
    { name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
    { name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
    { name: 'מדעים', color: 'bg-green-100', textColor: 'text-green-700', icon: '🌱' },
    { name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
    { name: 'אמנות', color: 'bg-pink-100', textColor: 'text-pink-700', icon: '🎨' },
    { name: 'ספורט', color: 'bg-orange-100', textColor: 'text-orange-700', icon: '⚽' },
    null,
    null,
  ],
  [DayOfWeek.MONDAY]: [
    { name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
    { name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
    { name: 'תנ"ך', color: 'bg-teal-100', textColor: 'text-teal-700', icon: '📖' },
    { name: 'מדעים', color: 'bg-green-100', textColor: 'text-green-700', icon: '🌱' },
    { name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
    null,
    null,
    null,
  ],
  [DayOfWeek.TUESDAY]: [
    { name: 'מדעים', color: 'bg-green-100', textColor: 'text-green-700', icon: '🌱' },
    { name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
    { name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
    { name: 'היסטוריה', color: 'bg-red-100', textColor: 'text-red-700', icon: '🏛️' },
    { name: 'ספורט', color: 'bg-orange-100', textColor: 'text-orange-700', icon: '⚽' },
    { name: 'מוזיקה', color: 'bg-blue-100', textColor: 'text-blue-700', icon: '🎵' },
    null,
    null,
  ],
  [DayOfWeek.WEDNESDAY]: [
    { name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
    { name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
    { name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
    { name: 'גיאוגרפיה', color: 'bg-cyan-100', textColor: 'text-cyan-700', icon: '🌍' },
    { name: 'תנ"ך', color: 'bg-teal-100', textColor: 'text-teal-700', icon: '📖' },
    { name: 'אמנות', color: 'bg-pink-100', textColor: 'text-pink-700', icon: '🎨' },
    null,
    null,
  ],
  [DayOfWeek.THURSDAY]: [
    { name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
    { name: 'מדעים', color: 'bg-green-100', textColor: 'text-green-700', icon: '🌱' },
    { name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
    { name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
    { name: 'היסטוריה', color: 'bg-red-100', textColor: 'text-red-700', icon: '🏛️' },
    null,
    null,
    null,
  ],
  [DayOfWeek.FRIDAY]: [
    { name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
    { name: 'מוזיקה', color: 'bg-blue-100', textColor: 'text-blue-700', icon: '🎵' },
    { name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
    { name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
    null,
    null,
    null,
    null,
  ],
}; 