import { useState } from 'react';
import { DayOfWeek } from '@/types';
import { notifications, notificationMessages } from '@/components/ui/notifications';
import { ScheduleData, TimeSlot, getDayNumber } from '../';
import { schedulesApi } from '@/services/api';
import { Schedule } from '@/types';

/**
 * Custom hook for saving schedule data
 */
export function useSaveSchedule(
  schedule: ScheduleData,
  customTimeSlots: TimeSlot[],
  setHasUnsavedChanges: (value: boolean) => void,
  setTimeChanges: (value: boolean) => void
) {
  const [isSaving, setIsSaving] = useState(false);

  // Save schedule data to the database
  const saveScheduleWithData = async (selectedDay: DayOfWeek) => {
    try {
      setIsSaving(true);
      
      // More verbose logging for debugging
      console.log('=== Starting schedule save ===');
      console.log('Current selected day:', selectedDay);
      console.log('Schedule data to save:', schedule);
      console.log('Current time slots:', customTimeSlots);
      
      // Dismiss any existing toasts to prevent stacking
      notifications.dismiss();
      const savingToastId = notifications.loading(notificationMessages.loading.save("מערכת לימודים"));
      
      // Get the day number for the selected day
      const dayNumber = getDayNumber(selectedDay);
      console.log(`Saving schedule for day ${dayNumber} (${selectedDay})`);
      
      // Get current schedules for this day
      let existingSchedules = [];
      try {
        // Use the cached data we already have if possible
        const allSchedules = await schedulesApi.getSchedules(dayNumber, true);
        existingSchedules = allSchedules;
        console.log('Existing schedules from DB:', existingSchedules);
      } catch (fetchError) {
        console.error('Error fetching existing schedules:', fetchError);
        notifications.error(notificationMessages.error.load("מערכת הלימודים"));
        throw fetchError;
      }
      
      // Create new schedule items or update existing ones for the selected day
      const daySchedule = schedule[selectedDay];
      
      console.log('Current day schedule to save:', daySchedule);
      
      // Track which existing items were handled
      const handledIds = new Set<string>();
      const results = [];
      
      // Process each time slot one by one
      for (let index = 0; index < daySchedule.length; index++) {
        const subject = daySchedule[index];
        // Get time from the customTimeSlots array
        const timeSlot = customTimeSlots[index];
        
        // Find if there's an existing schedule item for this time slot
        const existingItem = existingSchedules.find(item => {
          const dbTimeString = item.start_time.substring(0, 5).trim();
          const uiTimeString = timeSlot.startTime.trim();
          console.log(`Comparing times: "${dbTimeString}" vs "${uiTimeString}"`);
          return dbTimeString === uiTimeString;
        });
        
        console.log(`Processing slot ${index} (${timeSlot.startTime}-${timeSlot.endTime}):`);
        console.log('- Subject:', subject?.name || 'None');
        console.log('- Existing item:', existingItem?.id || 'None');
        
        try {
          if (subject) {
            // Create a schedule object for the API
            const scheduleItem: Partial<Schedule> = {
              day_of_week: dayNumber,
              start_time: timeSlot.startTime.padStart(5, '0'),
              end_time: timeSlot.endTime.padStart(5, '0'),
              subject: subject.name,
              subject_icon: subject.icon,
              is_shared: true
            };
            
            console.log('Schedule item to save:', scheduleItem);
            
            if (existingItem) {
              // Mark as handled
              handledIds.add(existingItem.id);
              // Update existing item
              console.log(`Updating schedule item ${existingItem.id} with:`, scheduleItem);
              try {
                const result = await schedulesApi.updateSchedule(existingItem.id, scheduleItem);
                console.log('Update result:', result);
                results.push(result);
              } catch (updateError) {
                console.error(`Error updating schedule at slot ${index}:`, updateError);
                // Don't throw the error, just log it and continue
                notifications.error(notificationMessages.error.update(`שיעור בשעה ${timeSlot.startTime}`));
              }
            } else {
              // Create new item - Double check time format
              console.log('Creating new schedule item with exact times:', {
                start: scheduleItem.start_time || '',
                end: scheduleItem.end_time || '',
                formatted_start: (scheduleItem.start_time || '').padStart(5, '0'),
                formatted_end: (scheduleItem.end_time || '').padStart(5, '0')
              });
              
              // Ensure proper time format with padding
              scheduleItem.start_time = (scheduleItem.start_time || '').padStart(5, '0');
              scheduleItem.end_time = (scheduleItem.end_time || '').padStart(5, '0');
              
              try {
                const result = await schedulesApi.createSchedule(scheduleItem);
                console.log('Create result:', result);
                results.push(result);
              } catch (createError) {
                console.error(`Error creating schedule at ${scheduleItem.start_time}:`, createError);
                // Don't throw the error, just log it and continue
                notifications.error(notificationMessages.error.create(`שיעור בשעה ${timeSlot.startTime}`));
              }
            }
          } else if (existingItem) {
            // Mark as handled
            handledIds.add(existingItem.id);
            // If slot is now empty but an item exists, delete it
            try {
              console.log(`Deleting schedule item ${existingItem.id}`);
              await schedulesApi.deleteSchedule(existingItem.id);
              console.log('Delete successful');
            } catch (deleteError) {
              console.error(`Error deleting schedule item ${existingItem.id}:`, deleteError);
              // Don't throw the error, just log it and continue
              notifications.error(notificationMessages.error.delete(`שיעור בשעה ${timeSlot.startTime}`));
            }
          }
        } catch (slotError) {
          console.error(`Error processing time slot ${index}:`, slotError);
          // Continue processing other slots even if one fails
          continue;
        }
      }
      
      // Delete any existing items that weren't handled (they're no longer in the schedule)
      const unusedItems = existingSchedules.filter(item => !handledIds.has(item.id));
      console.log('Unused items to delete:', unusedItems);
      
      if (unusedItems.length > 0) {
        for (const item of unusedItems) {
          try {
            console.log(`Deleting unused item ${item.id}`);
            await schedulesApi.deleteSchedule(item.id);
            console.log(`Successfully deleted item ${item.id}`);
          } catch (error) {
            console.error(`Error deleting unused item ${item.id}:`, error);
            throw error;
          }
        }
      }
      
      // Save customTimeSlots to localStorage
      localStorage.setItem('customTimeSlots', JSON.stringify(customTimeSlots));
      
      console.log('Schedule saved successfully:', results);
      
      // Dismiss the saving toast and show success message
      notifications.dismiss(savingToastId);
      notifications.success(notificationMessages.save.success("מערכת הלימודים"));
      
      // Reset unsaved changes flags
      setHasUnsavedChanges(false);
      setTimeChanges(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      notifications.error(notificationMessages.error.save("מערכת הלימודים"));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveScheduleWithData
  };
} 