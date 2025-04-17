import { useState, useEffect, useRef, useCallback } from 'react';
import { DayOfWeek } from '@/types';
import { notifications, notificationMessages } from '@/components/ui/notifications';
import { 
  ScheduleData, 
  initialSchedule, 
  TimeSlot, 
  DEFAULT_TIME_SLOTS,
  getSubjectByName,
  getDayNumber
} from '../';
import { schedulesApi } from '@/services/api';

/**
 * Custom hook for loading and managing schedule data
 */
export function useScheduleData() {
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule);
  const [customTimeSlots, setCustomTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [timeChanges, setTimeChanges] = useState(false);
  const timeSlotsLoaded = useRef(false);
  
  // Define loadScheduleData as useCallback to avoid recreating it on every render
  const loadScheduleData = useCallback(async (showSuccessMessage = true) => {
    try {
      setIsLoading(true);
      // Dismiss any existing toasts before creating a new one
      notifications.dismiss();
      // Add a unique id to the toast so we can properly dismiss it
      const loadingToastId = notifications.loading(notificationMessages.loading.load("מערכת לימודים מהשרת"));
      
      // Create a new schedule data structure based on initialSchedule
      const loadedSchedule: ScheduleData = { ...initialSchedule };
      
      // Clear all slots first to ensure clean loading
      for (const day in DayOfWeek) {
        if (isNaN(Number(day))) {
          const dayEnum = DayOfWeek[day as keyof typeof DayOfWeek];
          loadedSchedule[dayEnum] = Array(customTimeSlots.length).fill(null);
        }
      }
      
      console.log('=== Starting schedule load ===');
      
      // Get all schedules for all days in a single API call with cache-busting
      const timestamp = new Date().getTime();
      const allSchedules = await schedulesApi.getAllSchedules(true, timestamp);
      console.log('Received all schedules in a single request:', allSchedules);
      
      // Process each day's schedules
      for (const day in DayOfWeek) {
        // Skip non-value properties of enum
        if (isNaN(Number(day))) {
          const dayEnum = DayOfWeek[day as keyof typeof DayOfWeek];
          // Convert day name to day number (Sunday=0, Monday=1, etc.)
          const dayNumber = getDayNumber(dayEnum);
          
          // Get schedules for this day from the response
          const schedules = allSchedules[dayNumber] || [];
          
          if (schedules && schedules.length > 0) {
            // Reset all slots for this day to null
            loadedSchedule[dayEnum] = Array(customTimeSlots.length).fill(null);
            
            // Log for debugging
            console.log(`Processing schedules for ${dayEnum} (day ${dayNumber}):`, schedules);
            console.log('Available time slots:', customTimeSlots.map(slot => slot.startTime));
            
            // Fill in the slots with the data from the API
            schedules.forEach(scheduleItem => {
              // Find the time slot index based on start time
              const timeString = scheduleItem.start_time.substring(0, 5); // Get HH:MM format
              console.log(`Looking for time slot matching ${timeString} for ${scheduleItem.subject}`);
              
              // Normalize time formats for comparison
              const normalizedTimeString = timeString.replace(/^0/, '');
              
              const slotIndex = customTimeSlots.findIndex(slot => {
                // Compare with and without leading zeros
                return slot.startTime.trim() === timeString.trim() || 
                       slot.startTime.trim() === normalizedTimeString.trim();
              });
              
              if (slotIndex !== -1) {
                // Get the subject object based on name
                const subject = getSubjectByName(scheduleItem.subject);
                
                if (subject) {
                  console.log(`Found match at slot ${slotIndex} for ${scheduleItem.subject}`);
                  loadedSchedule[dayEnum][slotIndex] = subject;
                } else {
                  console.warn(`Subject not found for name: ${scheduleItem.subject}`);
                }
              } else {
                console.warn(`No matching time slot found for ${timeString}`);
              }
            });
          } else {
            console.log(`No schedules found for day ${dayNumber} (${day})`);
          }
        }
      }
      
      console.log('Final loaded schedule:', loadedSchedule);
      setSchedule(loadedSchedule);
      // Dismiss the specific loading toast by ID
      notifications.dismiss(loadingToastId);
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      setTimeChanges(false);
      
      // Only show success message if requested
      if (showSuccessMessage) {
        notifications.success(notificationMessages.load.success("מערכת הלימודים"));
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      // Dismiss all toasts to ensure cleanup
      notifications.dismiss();
      notifications.error(notificationMessages.error.load("מערכת הלימודים"));
    } finally {
      setIsLoading(false);
    }
  }, [customTimeSlots]);
  
  // Load custom time slots from localStorage if available
  useEffect(() => {
    const storedTimeSlots = localStorage.getItem('customTimeSlots');
    if (storedTimeSlots) {
      try {
        const parsedTimeSlots = JSON.parse(storedTimeSlots);
        if (Array.isArray(parsedTimeSlots) && parsedTimeSlots.length === 8) {
          setCustomTimeSlots(parsedTimeSlots);
        }
      } catch (error) {
        console.error('Error parsing stored time slots:', error);
      }
    }
    
    // Mark time slots as loaded, so we can fetch schedule data
    timeSlotsLoaded.current = true;
  }, []);
  
  // Load schedule data after time slots are loaded
  useEffect(() => {
    if (timeSlotsLoaded.current) {
      // Initial load - only happens once, don't show success toast for initial load
      loadScheduleData(false);
    }
  }, [loadScheduleData, customTimeSlots]);
  
  return {
    schedule,
    setSchedule,
    customTimeSlots,
    setCustomTimeSlots,
    isLoading,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    timeChanges,
    setTimeChanges,
    loadScheduleData
  };
} 