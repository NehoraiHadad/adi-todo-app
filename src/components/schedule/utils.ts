import { DayOfWeek } from '@/types';
import { Subject, subjects } from './types';

/**
 * Get the current Hebrew day of the week
 */
export function getCurrentHebrewDay(): DayOfWeek {
  const today = new Date().getDay();
  // In JavaScript, Sunday is 0, Monday is 1, etc.
  switch (today) {
    case 0: return DayOfWeek.SUNDAY;
    case 1: return DayOfWeek.MONDAY;
    case 2: return DayOfWeek.TUESDAY;
    case 3: return DayOfWeek.WEDNESDAY;
    case 4: return DayOfWeek.THURSDAY;
    case 5: return DayOfWeek.FRIDAY;
    default: return DayOfWeek.SUNDAY; // Default to Sunday for Saturday
  }
}

/**
 * Get the Hebrew name for a day of the week
 */
export function getHebrewDayName(day: DayOfWeek): string {
  const dayMap = {
    [DayOfWeek.SUNDAY]: 'ראשון',
    [DayOfWeek.MONDAY]: 'שני',
    [DayOfWeek.TUESDAY]: 'שלישי',
    [DayOfWeek.WEDNESDAY]: 'רביעי',
    [DayOfWeek.THURSDAY]: 'חמישי',
    [DayOfWeek.FRIDAY]: 'שישי',
  };
  return dayMap[day];
}

/**
 * Get the color configuration for each day of the week
 */
export function getDayColors() {
  return {
    [DayOfWeek.SUNDAY]: { bg: 'bg-pink-500', hover: 'hover:bg-pink-400' },
    [DayOfWeek.MONDAY]: { bg: 'bg-blue-500', hover: 'hover:bg-blue-400' },
    [DayOfWeek.TUESDAY]: { bg: 'bg-green-500', hover: 'hover:bg-green-400' },
    [DayOfWeek.WEDNESDAY]: { bg: 'bg-purple-500', hover: 'hover:bg-purple-400' },
    [DayOfWeek.THURSDAY]: { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-400' },
    [DayOfWeek.FRIDAY]: { bg: 'bg-orange-500', hover: 'hover:bg-orange-400' },
  };
}

/**
 * Get a subject object by its name
 */
export function getSubjectByName(name: string): Subject | null {
  const subject = subjects.find(s => s.name === name);
  return subject || null;
}

/**
 * Get the day number corresponding to a DayOfWeek enum value
 */
export function getDayNumber(day: DayOfWeek): number {
  const dayMap: Record<DayOfWeek, number> = {
    [DayOfWeek.SUNDAY]: 0,
    [DayOfWeek.MONDAY]: 1,
    [DayOfWeek.TUESDAY]: 2,
    [DayOfWeek.WEDNESDAY]: 3,
    [DayOfWeek.THURSDAY]: 4,
    [DayOfWeek.FRIDAY]: 5,
  };
  
  return dayMap[day];
} 