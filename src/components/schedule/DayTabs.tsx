import { DayOfWeek } from '@/types';
import { getHebrewDayName, getDayColors } from './utils';

interface DayTabsProps {
  selectedDay: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
}

/**
 * Day navigation tabs component for the schedule
 */
export default function DayTabs({ selectedDay, onDayChange }: DayTabsProps) {
  const dayColors = getDayColors();
  
  return (
    <div className="flex rounded-t-lg overflow-hidden mb-6 shadow-md">
      {Object.values(DayOfWeek).map((day) => {
        const isCurrentDay = day === selectedDay;
        
        return (
          <button
            key={day}
            className={`flex-1 py-3 font-bold text-center transition-all ${
              isCurrentDay
                ? `${dayColors[day].bg} text-white scale-105 shadow-md`
                : `bg-gray-100 text-gray-600 ${dayColors[day].hover}`
            }`}
            onClick={() => onDayChange(day)}
          >
            יום {getHebrewDayName(day)}
          </button>
        );
      })}
    </div>
  );
} 