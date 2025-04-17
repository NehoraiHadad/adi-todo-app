import { DayOfWeek } from '@/types';
import { getHebrewDayName, getDayColors } from './utils';

interface DayTabsProps {
  selectedDay: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
}

/**
 * Day navigation tabs component for the schedule
 * Enhanced for mobile devices and kid-friendly interface
 */
export default function DayTabs({ selectedDay, onDayChange }: DayTabsProps) {
  const dayColors = getDayColors();
  
  // Day emoji icons to make it more visual for kids
  const dayEmojis = {
    [DayOfWeek.SUNDAY]: '🌞',
    [DayOfWeek.MONDAY]: '🌈',
    [DayOfWeek.TUESDAY]: '⭐',
    [DayOfWeek.WEDNESDAY]: '🌟',
    [DayOfWeek.THURSDAY]: '🌻',
    [DayOfWeek.FRIDAY]: '🎉',
  };
  
  return (
    <div className="overflow-x-auto mb-4 md:mb-6 hide-scrollbar">
      <div className="flex flex-nowrap md:flex-wrap rounded-t-lg shadow-md">
        {Object.values(DayOfWeek).map((day) => {
          const isCurrentDay = day === selectedDay;
          
          return (
            <button
              key={day}
              className={`
                day-tab
                ${isCurrentDay ? 'day-tab-selected' : ''}
                flex-none sm:flex-1 
                w-[4.5rem] sm:w-auto 
                py-3 px-2 
                font-bold text-center 
                transition-all 
                ${
                  isCurrentDay
                    ? `${dayColors[day].bg} text-white scale-[1.03] shadow-md z-10`
                    : `bg-gray-100 text-gray-600 ${dayColors[day].hover}`
                } 
                focus:outline-none focus:ring-2 focus:ring-indigo-300 
                active:scale-95 touch-manipulation
              `}
              onClick={() => onDayChange(day)}
              aria-label={`יום ${getHebrewDayName(day)}`}
              aria-pressed={isCurrentDay}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-2">
                <span className="text-lg sm:text-xl">{dayEmojis[day]}</span>
                <span className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">יום </span>
                  {getHebrewDayName(day)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 