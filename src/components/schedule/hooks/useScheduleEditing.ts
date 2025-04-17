import { useState } from 'react';
import { DayOfWeek } from '@/types';
import { notifications } from '@/components/ui/notifications';
import { Subject, ScheduleData, TimeSlot, DEFAULT_TIME_SLOTS } from '../';

/**
 * Custom hook for schedule editing functionality
 */
export function useScheduleEditing(
  schedule: ScheduleData,
  setSchedule: (schedule: ScheduleData) => void,
  customTimeSlots: TimeSlot[],
  setCustomTimeSlots: (timeSlots: TimeSlot[]) => void,
  setHasUnsavedChanges: (value: boolean) => void,
  setTimeChanges: (value: boolean) => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [isTimeEditing, setIsTimeEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  const handleEdit = (slotIndex: number) => {
    setIsEditing(true);
    setEditIndex(slotIndex);
  };
  
  const handleSubjectSelect = (subject: Subject | null, selectedDay: DayOfWeek) => {
    if (editIndex !== null) {
      // Create updated schedule
      const updatedSchedule = {
        ...schedule,
        [selectedDay]: schedule[selectedDay].map((slot, idx) => 
          idx === editIndex ? subject : slot
        ),
      };
      
      // Update state
      setSchedule(updatedSchedule);
      setEditIndex(null);
      
      // Show temporary change message - dismiss any existing toasts first
      notifications.dismiss();
      notifications.success(subject ? 'השיעור התעדכן' : 'השיעור הוסר', { duration: 1500 });
      
      // Set the unsaved changes flag
      setHasUnsavedChanges(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditIndex(null);
  };
  
  const handleTimeEdit = (slotIndex: number, changes: Partial<TimeSlot>) => {
    // Create a new timeSlots array with the updated changes
    const updatedTimeSlots = customTimeSlots.map((slot, idx) => 
      idx === slotIndex ? { ...slot, ...changes } : slot
    );
    
    // Update state
    setCustomTimeSlots(updatedTimeSlots);
    
    // Show short confirmation toast - dismiss any existing toasts first
    notifications.dismiss();
    notifications.success('זמני השיעורים עודכנו', { duration: 1500 });
    
    // Mark that we have time changes pending
    setTimeChanges(true);
  };

  const handleResetTimes = () => {
    // Update state
    setCustomTimeSlots(DEFAULT_TIME_SLOTS);
    localStorage.removeItem('customTimeSlots');
    
    // Show confirmation message - dismiss any existing toasts first
    notifications.dismiss();
    notifications.success('זמני השיעורים אופסו', { duration: 1500 });
    
    // Mark that we have time changes pending
    setTimeChanges(true);
  };

  return {
    isEditing,
    setIsEditing,
    isTimeEditing,
    setIsTimeEditing,
    editIndex,
    handleEdit,
    handleSubjectSelect,
    handleCancelEdit,
    handleTimeEdit,
    handleResetTimes
  };
} 