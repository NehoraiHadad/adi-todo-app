'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCurrentHebrewDay, getHebrewDayName } from './utils';
import { ScheduleSlot, Subject } from '@/types/schedule';

interface DisplayScheduleItem {
  name: string;
  icon: string;
  color: string;
  startTime: string;
  endTime: string;
  slotIndex: number;
}

interface TodayScheduleProps {
  slotsForToday: ScheduleSlot[];
}

// Map of subject icons - can be expanded
const SUBJECT_ICONS: Record<string, string> = {
  'אנגלית': '🔤',
  'עברית': '📚',
  'חשבון': '📏',
  'הלכה': '📕',
  'תנ"ך': '📖',
  'מתמטיקה': '📐',
  'חנ"ג': '⚽',
  'תורה-עיון': '🕮',
  'כישורי-חיים': '🧠',
  'מדעים': '🌱',
  'אמנות': '🎨',
  'משנה': '📜',
  'פרשת-שבוע': '🕯️',
  'שישי-אישי': '🌟',
  'מחשבים': '💻',
  'default': '📝'
};

// Map of subject colors
const SUBJECT_COLORS: Record<string, string> = {
  'אנגלית': 'bg-purple-100 text-purple-800',
  'עברית': 'bg-yellow-100 text-yellow-800',
  'חשבון': 'bg-indigo-100 text-indigo-800',
  'הלכה': 'bg-blue-100 text-blue-800',
  'תנ"ך': 'bg-teal-100 text-teal-800',
  'מתמטיקה': 'bg-indigo-100 text-indigo-800',
  'חנ"ג': 'bg-orange-100 text-orange-800',
  'תורה-עיון': 'bg-green-100 text-green-800',
  'כישורי-חיים': 'bg-pink-100 text-pink-800',
  'מדעים': 'bg-green-100 text-green-800',
  'אמנות': 'bg-pink-100 text-pink-800',
  'משנה': 'bg-amber-100 text-amber-800',
  'פרשת-שבוע': 'bg-violet-100 text-violet-800',
  'שישי-אישי': 'bg-rose-100 text-rose-800',
  'מחשבים': 'bg-slate-100 text-slate-800',
  'default': 'bg-gray-100 text-gray-800'
};

/**
 * Component to display today's schedule - Refactored
 */
const TodaySchedule: React.FC<TodayScheduleProps> = ({ slotsForToday = [] }) => {
  const [currentHebrewDay] = useState<string>(getHebrewDayName(getCurrentHebrewDay()));

  // Calculate displaySchedule directly using useMemo from slotsForToday
  const displaySchedule = useMemo(() => {
    if (!slotsForToday || slotsForToday.length === 0) {
      return []; // Return empty array if no slots data
    }
    
    // Map ScheduleSlot to DisplayScheduleItem (filter out empty slots)
    const formattedSlots: DisplayScheduleItem[] = slotsForToday
      .filter(slot => slot.subject !== null) // Only display slots with subjects
      .map(slot => {
        const subject = slot.subject as Subject; // Type assertion since we filtered nulls
        return {
          name: subject.name,
          icon: subject.icon || SUBJECT_ICONS['default'],
          color: subject.color ? `${subject.color} ${subject.textColor || ''}` : SUBJECT_COLORS[subject.name] || SUBJECT_COLORS['default'], // Prefer direct color, fallback
          startTime: slot.startTime, // Use directly from slot
          endTime: slot.endTime,     // Use directly from slot
          slotIndex: slot.slotIndex
        };
      });
      
    // Sort schedule items by slotIndex (already sorted by query? maybe not needed)
    return formattedSlots.sort((a, b) => a.slotIndex - b.slotIndex);
    
  }, [slotsForToday]); // Recalculate only when slotsForToday changes

  // Loading state can be simplified or handled by the parent
  const isLoading = false; // Assume parent handles loading

  if (isLoading) { // Keep for now, might be removed if parent handles it
    return <div className="text-center p-4">טוען מערכת לימודים...</div>;
  }
  
  return (
    <Card className="shadow-md overflow-hidden border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-blue-700">מערכת לימודים - יום {currentHebrewDay}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {displaySchedule.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            אין שיעורים להיום
          </div>
        ) : (
          <ul className="space-y-2">
            {displaySchedule.map((subject, index) => (
              <li key={index} className={`p-2 rounded-md ${subject.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-600 font-bold text-right">
                    {subject.startTime?.substring(0, 5)} - {subject.endTime?.substring(0, 5)}
                  </span>
                  <div className="flex items-center">
                    <span className="font-medium ml-2">{subject.name}</span>
                    <span className="text-xl">{subject.icon}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export { TodaySchedule };
export default TodaySchedule; 