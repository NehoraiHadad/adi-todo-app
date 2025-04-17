'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TimeSlot } from './types';
import { getCurrentHebrewDay, getHebrewDayName } from './utils';

interface ApiScheduleItem {
  subject: string;
  start_time: string;
  end_time: string;
  // Add other potential fields if they exist
}

interface DisplayScheduleItem {
  name: string;
  icon: string;
  color: string;
  startTime: string;
  endTime: string;
}

interface TodayScheduleProps {
  schedules?: ApiScheduleItem[];
  _timeSlots?: TimeSlot[]; // Renamed from timeSlots
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
 * Component to display today's schedule
 */
const TodaySchedule: React.FC<TodayScheduleProps> = ({ schedules = [], _timeSlots }) => {
  const [currentHebrewDay] = useState<string>(getHebrewDayName(getCurrentHebrewDay()));
  const [localSchedule, setLocalSchedule] = useState<DisplayScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (schedules && schedules.length > 0) {
      const formattedSchedules: DisplayScheduleItem[] = schedules.map(item => ({
        name: item.subject,
        icon: SUBJECT_ICONS[item.subject] || SUBJECT_ICONS['default'],
        color: SUBJECT_COLORS[item.subject] || SUBJECT_COLORS['default'],
        startTime: item.start_time,
        endTime: item.end_time
      }));

      setLocalSchedule(formattedSchedules);
      setLoading(false);
      return;
    }
    
    setLoading(false);
  }, [schedules]);
  
  if (loading) {
    return <div className="text-center p-4">טוען מערכת לימודים...</div>;
  }
  
  return (
    <Card className="shadow-md overflow-hidden border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-blue-700">מערכת לימודים - יום {currentHebrewDay}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {localSchedule.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            אין שיעורים להיום
          </div>
        ) : (
          <ul className="space-y-2">
            {localSchedule.map((subject, index) => (
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