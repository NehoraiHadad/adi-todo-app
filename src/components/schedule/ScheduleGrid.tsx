// Removed unused DayOfWeek import
// import { DayOfWeek } from '@/types';
// import { ScheduleData, TimeSlot } from './types'; // Use centralized types
// Removed unused Subject import
import { ScheduleSlot } from '../../types/schedule'; 
import ScheduleItem from './ScheduleItem';
import { motion } from 'framer-motion';
import { Dispatch, SetStateAction } from 'react';

// Removed unused local ScheduleData type definition
/*
type ScheduleData = { 
  [key in DayOfWeek]?: (Subject | null)[] 
};
*/

interface ScheduleGridProps {
  scheduleSlots: ScheduleSlot[]; // Expect an array of slots for the specific day
  isEditing: boolean;
  isTimeEditing: boolean;
  onEdit: (slotIndex: number) => void;
  // Update onTimeEdit to expect partial ScheduleSlot changes
  onTimeEdit: (slotIndex: number, changes: Partial<Pick<ScheduleSlot, 'startTime' | 'endTime'>>) => void; 
  _isAdmin?: boolean;
  _setIsEditing?: Dispatch<SetStateAction<boolean>>; 
  // Remove props that are now contained within scheduleSlots
  // selectedDay?: DayOfWeek;
  // schedule?: ScheduleData;
  // timeSlots?: TimeSlot[]; 
  // schedulesData?: any[]; // Maybe remove? Data should be in scheduleSlots
  // getSpecificTime?: ... // Maybe remove?
}

/**
 * Grid component that displays the schedule for a selected day
 * Enhanced for better mobile experience and kid-friendly UI
 */
export default function ScheduleGrid({ 
  scheduleSlots, // Use the new prop
  isEditing,
  isTimeEditing,
  onEdit,
  onTimeEdit,
  _isAdmin,
  _setIsEditing,
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

  // Check if there are any slots to display
  if (!scheduleSlots || scheduleSlots.length === 0) {
    return <div className="p-4 text-center text-gray-500">אין משבצות זמן מוגדרות עבור יום זה.</div>;
  }

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
        // key={selectedDay} // Key might need adjustment if grid re-renders differently
      >
        <div className="sticky top-0 z-10 md:hidden bg-indigo-50 py-2 px-4 border-b border-indigo-100 text-center font-bold">
        </div>

        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-100 scroll-smooth print:max-h-full print:overflow-visible">
          {/* Iterate over the scheduleSlots directly */} 
          {scheduleSlots.map((slot) => (
              <ScheduleItem
                key={slot.slotIndex} // Use slotIndex as key
                slot={slot} // Pass the entire ScheduleSlot object
                isEditing={isEditing}
                isTimeEditing={isTimeEditing}
                onEdit={onEdit} // Pass down handlers
                onTimeEdit={onTimeEdit} // Pass down handlers
                // Remove props now contained within slot object:
                // timeSlot={...}
                // lesson={...}
                // slotIndex={...}
                // lessonStartTime={...}
                // lessonEndTime={...}
              />
            ))}
        </div>
      </motion.div>

      {/* Grid Header */}
    </div>
  );
} 