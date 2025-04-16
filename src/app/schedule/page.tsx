'use client';

import { useState, useEffect } from 'react';
import { DayOfWeek } from '@/types';
import { toast } from 'react-hot-toast';

// Import components, types, and utilities
import {
  DayTabs,
  ScheduleGrid,
  SubjectModal,
  Subject,
  ScheduleData,
  initialSchedule,
  getCurrentHebrewDay,
  DEFAULT_TIME_SLOTS,
  TimeSlot,
  getSubjectByName,
  getDayNumber
} from '@/components/schedule';
import { schedulesApi } from '@/services/api';
import { Schedule } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Main Schedule page component
 */
export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentHebrewDay());
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule);
  const [customTimeSlots, setCustomTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [isEditing, setIsEditing] = useState(false);
  const [isTimeEditing, setIsTimeEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Load schedule data from API on initial render
  useEffect(() => {
    // Initial load - only happens once, don't show success toast for initial load
    loadScheduleData(false);
    
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, []);
  
  // Load schedule data from the database
  const loadScheduleData = async (showSuccessMessage = true) => {
    try {
      setIsLoading(true);
      // Dismiss any existing toasts before creating a new one
      toast.dismiss();
      // Add a unique id to the toast so we can properly dismiss it
      const loadingToastId = toast.loading('טוען מערכת שעות מהשרת...');
      
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
      
      // Get all schedules for all days in a single API call
      const allSchedules = await schedulesApi.getAllSchedules(true);
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
      toast.dismiss(loadingToastId);
      
      // Only show success message if requested
      if (showSuccessMessage) {
        toast.success('מערכת השעות נטענה בהצלחה');
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      // Dismiss all toasts to ensure cleanup
      toast.dismiss();
      toast.error('שגיאה בטעינת מערכת השעות');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modified save function that takes schedule data directly
  const saveScheduleWithData = async (scheduleData = schedule) => {
    try {
      // More verbose logging for debugging
      console.log('=== Starting schedule save ===');
      console.log('Current selected day:', selectedDay);
      console.log('Schedule data to save:', scheduleData);
      console.log('Current time slots:', customTimeSlots);
      
      // Dismiss any existing toasts to prevent stacking
      toast.dismiss();
      const savingToastId = toast.loading('שומר מערכת שעות...');
      
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
        toast.error('שגיאה בקבלת נתונים קיימים');
        throw fetchError;
      }
      
      // Create new schedule items or update existing ones for the selected day
      const daySchedule = scheduleData[selectedDay];
      
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
              is_shared: true // Changed to true to make schedules shared by default (class-wide)
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
                toast.error(`שגיאה בעדכון שיעור בשעה ${timeSlot.startTime}`);
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
                toast.error(`שגיאה ביצירת שיעור בשעה ${timeSlot.startTime}`);
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
              toast.error(`שגיאה במחיקת שיעור בשעה ${timeSlot.startTime}`);
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
      toast.dismiss(savingToastId);
      toast.success('מערכת השעות נשמרה בהצלחה', { duration: 2000 });
    } catch (error) {
      console.error('Error saving schedule:', error);
      // Dismiss any existing toasts
      toast.dismiss();
      toast.error('שגיאה בשמירת מערכת השעות');
    }
  };

  // Event handlers
  const handleDayChange = (day: DayOfWeek) => {
    // Just update the selected day state - no data reloading needed
    setSelectedDay(day);
    console.log(`Switched view to ${day} day without reloading data`);
  };
  
  const handleEdit = (slotIndex: number) => {
    setIsEditing(true);
    setEditIndex(slotIndex);
  };
  
  const handleSubjectSelect = (subject: Subject | null) => {
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
      toast.dismiss();
      toast.success(subject ? 'השיעור נוסף/עודכן' : 'השיעור הוסר', { duration: 1500 });
      
      // Wait for a tick to ensure React has processed the state update
      setTimeout(() => {
        // Automatically save with the updated schedule data
        setIsSaving(true);
        saveScheduleWithData(updatedSchedule).finally(() => {
          setIsSaving(false);
        });
      }, 0);
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
    toast.dismiss();
    toast.success('זמני השיעורים עודכנו', { duration: 1500 });
    
    // Wait for a tick to ensure React has processed the state update
    setTimeout(() => {
      // Automatically save with the current schedule data but updated time slots
      setIsSaving(true);
      saveScheduleWithData(schedule).finally(() => {
        setIsSaving(false);
      });
    }, 0);
  };

  const handleResetTimes = () => {
    // Update state
    setCustomTimeSlots(DEFAULT_TIME_SLOTS);
    localStorage.removeItem('customTimeSlots');
    
    // Show confirmation message - dismiss any existing toasts first
    toast.dismiss();
    toast.success('זמני השיעורים אופסו', { duration: 1500 });
    
    // Wait for a tick to ensure React has processed the state update
    setTimeout(() => {
      // Automatically save changes with the updated time slots
      setIsSaving(true);
      saveScheduleWithData(schedule).finally(() => {
        setIsSaving(false);
      });
    }, 0);
  };
  
  if (isLoading) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">טוען מערכת שעות...</p>
      </div>
    );
  }
  
  return (
    <div className="container-app py-6">
      {/* Header with editing button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-600">מערכת שעות שבועית</h1>
        <div className="flex gap-2">
          {isEditing || isTimeEditing ? (
            <>
              {isSaving && (
                <div className="flex items-center text-gray-600 mr-2">
                  <Spinner className="mr-2" size="sm" />
                  <span>שומר שינויים...</span>
                </div>
              )}
              <button
                className="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 flex items-center"
                onClick={() => {
                  setIsEditing(false);
                  setIsTimeEditing(false);
                }}
              >
                <span className="text-xl mr-2">🔒</span>
                סיום עריכה
              </button>
            </>
          ) : (
            <>
              <button
                className="btn bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 flex items-center"
                onClick={() => loadScheduleData(true)}
                title="רענן את המערכת רק כאשר יש שינויים בשרת או אם המערכת לא נטענה כראוי"
              >
                <span className="text-xl mr-2">🔄</span>
                רענון נתונים
              </button>
              {isAdmin ? (
                <>
                  <button
                    className="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 flex items-center"
                    onClick={() => setIsEditing(true)}
                  >
                    <span className="text-xl mr-2">🔓</span>
                    ערוך מערכת
                  </button>
                  <button
                    className="btn bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 flex items-center"
                    onClick={() => setIsTimeEditing(true)}
                  >
                    <span className="text-xl mr-2">⏱️</span>
                    ערוך זמנים
                  </button>
                </>
              ) : (
                <div className="text-gray-500 italic px-2">
                  רק למורים או להורים יש הרשאות עריכה
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Time editing controls */}
      {isTimeEditing && (
        <div className="mb-4 flex justify-end">
          <button
            className="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
            onClick={handleResetTimes}
          >
            <span className="text-xl mr-2">🔄</span>
            אפס זמנים לברירת מחדל
          </button>
        </div>
      )}
      
      {/* Day tabs */}
      <DayTabs 
        selectedDay={selectedDay} 
        onDayChange={handleDayChange} 
      />
      
      {/* Schedule grid */}
      <ScheduleGrid
        selectedDay={selectedDay}
        schedule={schedule}
        timeSlots={customTimeSlots}
        isEditing={isEditing}
        isTimeEditing={isTimeEditing}
        onEdit={handleEdit}
        onTimeEdit={handleTimeEdit}
      />
      
      {/* Subject selection modal */}
      {isEditing && editIndex !== null && (
        <SubjectModal
          onSelect={handleSubjectSelect}
          onCancel={handleCancelEdit}
        />
      )}
      
      {/* Add extra padding for mobile bottom nav */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
} 