import { DayOfWeek } from '@/types';
import { ScheduleData, TimeSlot } from './types';
import ScheduleItem from './ScheduleItem';
import { motion } from 'framer-motion';
import { Dispatch, SetStateAction } from 'react';

interface ScheduleGridProps {
  selectedDay: DayOfWeek;
  schedule: ScheduleData;
  timeSlots: TimeSlot[];
  isEditing: boolean;
  isTimeEditing: boolean;
  onEdit: (slotIndex: number) => void;
  onTimeEdit: (slotIndex: number, changes: Partial<TimeSlot>) => void;
  _isAdmin?: boolean;
  _setIsEditing?: Dispatch<SetStateAction<boolean>>;
}

/**
 * Grid component that displays the schedule for a selected day
 * Enhanced for better mobile experience and kid-friendly UI
 */
export default function ScheduleGrid({ 
  selectedDay, 
  schedule, 
  timeSlots,
  isEditing,
  isTimeEditing,
  onEdit,
  onTimeEdit,
  _isAdmin,
  _setIsEditing
}: ScheduleGridProps) {
  // Container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      } 
    }
  };

  return (
    <div className="relative">
      {/* Print button for desktop */}
      <button 
        className="absolute -top-12 right-0 hidden md:flex items-center text-indigo-600 hover:text-indigo-800 text-sm" 
        onClick={() => window.print()}
        aria-label="הדפס מערכת לימודים"
      >
        <span className="mr-1">🖨️</span>
        הדפס מערכת
      </button>

      <motion.div 
        className="bg-white rounded-lg shadow-lg border-2 border-indigo-100 mb-6 overflow-hidden print:shadow-none print:border-0"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        key={selectedDay} // Re-animate when day changes
      >
        <div className="sticky top-0 z-10 md:hidden bg-indigo-50 py-2 px-4 border-b border-indigo-100 text-center font-bold">
        </div>

        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-100 scroll-smooth print:max-h-full print:overflow-visible">
          {timeSlots.map((timeSlot, slotIndex) => (
            <ScheduleItem
              key={slotIndex}
              time={`${timeSlot.startTime} - ${timeSlot.endTime}`}
              timeSlot={timeSlot}
              lesson={schedule[selectedDay][slotIndex]}
              slotIndex={slotIndex}
              isEditing={isEditing}
              isTimeEditing={isTimeEditing}
              onEdit={onEdit}
              onTimeEdit={onTimeEdit}
              isCurrentTimeSlot={false}
            />
          ))}
        </div>
      </motion.div>

      {/* Help tooltip for keyboard shortcuts (desktop only) */}
      <div className="hidden md:block text-xs text-gray-500 mb-2">
        <span className="font-bold">טיפ:</span> ניתן להשתמש במקשי החיצים ←→ כדי לעבור בין ימים, ומקשי החיצים ↑↓ לגלילה בין השיעורים
      </div>
    </div>
  );
} 