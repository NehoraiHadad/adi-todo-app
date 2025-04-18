import { ScheduleSlot } from '../../types/schedule';
import { motion } from 'framer-motion';
import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

interface ScheduleItemProps {
  slot: ScheduleSlot;
  isEditing: boolean;
  isTimeEditing: boolean;
  isCurrentTimeSlot?: boolean;
  onEdit: (slotIndex: number) => void;
  onTimeEdit: (slotIndex: number, changes: Partial<Pick<ScheduleSlot, 'startTime' | 'endTime'>>) => void;
}

/**
 * Individual schedule item component that displays a lesson or an empty slot
 * Enhanced for better mobile experience and kid-friendly UI
 * Memoized to prevent unnecessary re-renders.
 */
const ScheduleItemComponent = ({ 
  slot,
  isEditing, 
  isTimeEditing,
  isCurrentTimeSlot = false,
  onEdit,
  onTimeEdit,
}: ScheduleItemProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Animation variants for the items
  const itemVariants = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.01, transition: { duration: 0.2 } }
  };

  // Destructure needed values from the slot object
  const { slotIndex, subject, startTime, endTime } = slot;
  const lesson = subject; // Alias for clarity if needed
  const displayTime = `${startTime} - ${endTime}`;

  return (
    <motion.div 
      id={`time-slot-${slotIndex}`}
      className={`grid grid-cols-12 border-b border-gray-200 last:border-b-0 transition-colors
        hover:bg-gray-50
        ${expanded ? 'row-span-2' : ''}
        ${isCurrentTimeSlot ? 'bg-yellow-50' : ''}
      `}
      initial="initial"
      animate="animate"
      whileHover={isEditing ? {} : "hover"}
      variants={itemVariants}
      transition={{ delay: slotIndex * 0.05 }} // Staggered animation effect
    >
      {/* Time column */}
      <div className={`col-span-4 sm:col-span-3 lg:col-span-2 flex items-center justify-center p-2 sm:p-4 
        border-r border-gray-200 relative 
        ${isCurrentTimeSlot ? 'bg-yellow-100' : 'bg-gray-50'}`}
      >
        {isTimeEditing ? (
          <div className="flex flex-col w-full space-y-2">
            <div className="flex items-center">
              <label className="text-xs text-gray-500 ml-1">התחלה:</label>
              <input
                type="time"
                className="w-full px-2 py-1 text-sm border rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 focus:outline-none"
                value={startTime}
                onChange={(e) => onTimeEdit(slotIndex, { startTime: e.target.value })}
              />
            </div>
            <div className="flex items-center">
              <label className="text-xs text-gray-500 ml-1">סיום:</label>
              <input
                type="time"
                className="w-full px-2 py-1 text-sm border rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 focus:outline-none"
                value={endTime}
                onChange={(e) => onTimeEdit(slotIndex, { endTime: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center">
            <span className="font-bold text-indigo-600">
              {displayTime}
            </span>
            {isCurrentTimeSlot && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
                ⏱️
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Subject column */}
      <div className="col-span-8 sm:col-span-9 lg:col-span-10 p-2 sm:p-4">
        {lesson ? (
          <motion.div 
            className={`flex flex-wrap sm:flex-nowrap items-center p-2 sm:p-3 rounded-lg ${lesson.color} shadow-sm`}
            whileHover={!isEditing ? { scale: 1.01 } : {}}
            whileTap={!isEditing ? { scale: 0.98 } : {}}
            onClick={() => !isEditing && setExpanded(!expanded)}
          >
            <span className="text-xl sm:text-2xl ml-2 sm:ml-3">{lesson.icon}</span>
            <span className={`${lesson.textColor} font-bold text-sm sm:text-base break-words`}>{lesson.name}</span>
            
            {/* Details panel - only for tablet and desktop */}
            {expanded && (
              <div className="w-full mt-2 sm:ml-4 sm:mt-0 pt-2 border-t sm:border-t-0 sm:pt-0 sm:border-r sm:pr-3 text-xs text-gray-700">
                <div>שיעור מספר: {slotIndex + 1}</div>
                <div>שעות: {displayTime}</div>
              </div>
            )}
            
            {/* Toggle expand button - mobile only */}
            {!isEditing && (
              <Button 
                variant="ghost"
                size="icon"
                className="sm:hidden ml-auto p-1.5 -mr-1 text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                aria-label={expanded ? "הסתר פרטים" : "הצג פרטים"}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            
            {isEditing && (
              <motion.div
                className="ml-auto"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white bg-opacity-50 hover:bg-opacity-70 transition-colors rounded-full p-1.5 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(slotIndex);
                  }}
                  aria-label="ערוך שיעור"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[3rem]">
            {isEditing ? (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="secondary"
                  className="py-2 px-3 sm:px-4 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center shadow-sm"
                  onClick={() => onEdit(slotIndex)}
                >
                  <Plus className="ml-1 sm:ml-2 h-4 w-4" />
                  <span className="text-gray-600 text-sm sm:text-base">הוסף שיעור</span>
                </Button>
              </motion.div>
            ) : (
              <div className="text-center">
                <span className="text-gray-400 text-xs sm:text-sm py-2 block">אין שיעור</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Export the memoized component
export default memo(ScheduleItemComponent); 