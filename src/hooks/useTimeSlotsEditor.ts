import { useState, useCallback } from 'react';
import { DefaultTimeSlot } from '@/types/schedule';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook for managing time slots editing
 */
export function useTimeSlotsEditor(initialTimeSlots: DefaultTimeSlot[]) {
  const [timeSlots, setTimeSlots] = useState<DefaultTimeSlot[]>(initialTimeSlots);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Start editing mode
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setTimeSlots(initialTimeSlots);
    setIsEditing(false);
    setHasChanges(false);
  }, [initialTimeSlots]);

  // Update a time slot
  const updateTimeSlot = useCallback((index: number, updates: Partial<DefaultTimeSlot>) => {
    setTimeSlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = { ...newSlots[index], ...updates };
      return newSlots;
    });
    setHasChanges(true);
  }, []);

  // Add a new time slot
  const addTimeSlot = useCallback(() => {
    const newIndex = timeSlots.length;
    const lastSlot = timeSlots[newIndex - 1];
    
    // Calculate default times based on the last slot
    let newStartTime = '08:00';
    let newEndTime = '08:45';
    
    if (lastSlot) {
      // Add 10 minutes to the last end time for the new start time
      const [lastEndHour, lastEndMinute] = lastSlot.endTime.split(':').map(Number);
      let newStartHour = lastEndHour;
      let newStartMinute = lastEndMinute + 15;
      
      if (newStartMinute >= 60) {
        newStartHour += 1;
        newStartMinute -= 60;
      }
      
      // End time is 45 minutes after start time
      let newEndHour = newStartHour;
      let newEndMinute = newStartMinute + 45;
      
      if (newEndMinute >= 60) {
        newEndHour += 1;
        newEndMinute -= 60;
      }
      
      newStartTime = `${String(newStartHour).padStart(2, '0')}:${String(newStartMinute).padStart(2, '0')}`;
      newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;
    }
    
    setTimeSlots(prev => [
      ...prev,
      {
        startTime: newStartTime,
        endTime: newEndTime,
        slotIndex: newIndex,
      }
    ]);
    setHasChanges(true);
  }, [timeSlots]);

  // Remove a time slot
  const removeTimeSlot = useCallback((index: number) => {
    setTimeSlots(prev => {
      // Remove the slot
      const newSlots = prev.filter((_, i) => i !== index);
      
      // Update indices for the remaining slots
      return newSlots.map((slot, i) => ({
        ...slot,
        slotIndex: i
      }));
    });
    setHasChanges(true);
  }, []);

  // Save changes
  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/timeslots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeSlots),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בשמירת שעות הלימוד');
      }
      
      const result = await response.json();
      toast({
        title: 'שעות הלימוד נשמרו בהצלחה',
        description: 'המערכת עודכנה בהצלחה',
        variant: 'default',
      });
      
      setIsEditing(false);
      setHasChanges(false);
      return result;
    } catch (error) {
      console.error('Error saving time slots:', error);
      toast({
        title: 'שגיאה בשמירת שעות הלימוד',
        description: error instanceof Error ? error.message : 'נסה שוב מאוחר יותר',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [timeSlots]);

  return {
    timeSlots,
    isEditing,
    isSaving,
    hasChanges,
    startEditing,
    cancelEditing,
    updateTimeSlot,
    addTimeSlot,
    removeTimeSlot,
    saveChanges,
  };
} 