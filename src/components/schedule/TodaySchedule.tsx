'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Schedule } from '@/types';

interface TodayScheduleProps {
  schedules: Schedule[];
}

// Map of subject icons - can be expanded
const SUBJECT_ICONS: Record<string, string> = {
  'חשבון': '📏',
  'מתמטיקה': '📏',
  'אנגלית': '🔤',
  'מדעים': '🌱',
  'עברית': '📚',
  'ספורט': '⚽',
  'אמנות': '🎨',
  'מוזיקה': '🎵',
  'היסטוריה': '📜',
  'תנ"ך': '📖',
  'default': '📝'
};

// Map of subject colors
const SUBJECT_COLORS: Record<string, string> = {
  'חשבון': 'indigo',
  'מתמטיקה': 'indigo',
  'אנגלית': 'purple',
  'מדעים': 'green',
  'עברית': 'yellow',
  'ספורט': 'red',
  'אמנות': 'pink',
  'מוזיקה': 'blue',
  'היסטוריה': 'orange',
  'תנ"ך': 'teal',
  'default': 'gray'
};

export const TodaySchedule: React.FC<TodayScheduleProps> = ({ schedules }) => {
  // Format time for display (24-hour to 12-hour format)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Just take HH:MM part
  };
  
  // Get the day of week in Hebrew
  const getDayOfWeekHebrew = () => {
    const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const today = new Date().getDay();
    return daysOfWeek[today];
  };
  
  // Get subject icon
  const getSubjectIcon = (subject: string) => {
    return SUBJECT_ICONS[subject] || SUBJECT_ICONS.default;
  };
  
  // Get subject color
  const getSubjectColor = (subject: string) => {
    return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
  };
  
  // Sort the schedules by start time
  const sortedSchedules = [...schedules].sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );
  
  return (
    <Card className="shadow-md overflow-hidden border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-blue-700">מערכת לימודים - יום {getDayOfWeekHebrew()}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {sortedSchedules.length > 0 ? (
          <ul className="space-y-2">
            {sortedSchedules.map((schedule) => {
              const color = getSubjectColor(schedule.subject);
              return (
                <li key={schedule.id} className={`p-2 bg-white rounded-md flex items-center border border-${color}-200`}>
                  <Badge variant="outline" className={`mr-2 bg-${color}-100 text-${color}-700 p-1 h-8 w-8 flex items-center justify-center`}>
                    <span className="text-xl">{schedule.subject_icon || getSubjectIcon(schedule.subject)}</span>
                  </Badge>
                  <span className="font-bold">{formatTime(schedule.start_time)}</span>
                  <span className="mx-2">-</span>
                  <span>{schedule.subject}</span>
                  {schedule.room && (
                    <span className="text-xs text-gray-600 ms-auto">חדר {schedule.room}</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-6 text-gray-500">
            אין לימודים היום
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 