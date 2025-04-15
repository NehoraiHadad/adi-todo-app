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
  
  // Load schedule data from API on initial render
  useEffect(() => {
    loadScheduleData();
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
  const loadScheduleData = async () => {
    try {
      setIsLoading(true);
      
      // Create a new schedule data structure based on initialSchedule
      const loadedSchedule: ScheduleData = { ...initialSchedule };
      
      // Loop through each day of the week
      for (const day in DayOfWeek) {
        // Skip non-value properties of enum
        if (isNaN(Number(day))) {
          const dayEnum = DayOfWeek[day as keyof typeof DayOfWeek];
          // Convert day name to day number (Sunday=0, Monday=1, etc.)
          const dayNumber = getDayNumber(dayEnum);
          
          // Fetch schedules for this day from the database
          const schedules = await schedulesApi.getSchedules(dayNumber);
          
          if (schedules && schedules.length > 0) {
            // Reset all slots for this day to null
            loadedSchedule[dayEnum] = Array(customTimeSlots.length).fill(null);
            
            // Fill in the slots with the data from the API
            schedules.forEach(scheduleItem => {
              // Find the time slot index based on start time
              const timeString = scheduleItem.start_time.substring(0, 5); // Get HH:MM format
              const slotIndex = customTimeSlots.findIndex(slot => slot.startTime === timeString);
              
              if (slotIndex !== -1) {
                // Get the subject object based on name
                const subject = getSubjectByName(scheduleItem.subject);
                
                if (subject) {
                  loadedSchedule[dayEnum][slotIndex] = subject;
                }
              }
            });
          }
        }
      }
      
      setSchedule(loadedSchedule);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error('שגיאה בטעינת מערכת השעות');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save schedule to database
  const saveSchedule = async () => {
    try {
      setIsSaving(true);
      
      // Get the day number for the selected day
      const dayNumber = getDayNumber(selectedDay);
      
      // First, delete existing schedules for this day
      await schedulesApi.deleteSchedulesForDay(dayNumber);
      
      // Create new schedule items for each subject in the selected day
      const daySchedule = schedule[selectedDay];
      
      const savePromises = daySchedule.map(async (subject, index) => {
        if (subject) {
          // Get time from the customTimeSlots array
          const timeSlot = customTimeSlots[index];
          
          // Create a schedule object for the API
          const scheduleItem: Partial<Schedule> = {
            day_of_week: dayNumber,
            start_time: timeSlot.startTime,
            end_time: timeSlot.endTime,
            subject: subject.name,
            subject_icon: subject.icon,
            is_shared: false // Set to true if this is a shared class schedule
          };
          
          // Save to the database
          return await schedulesApi.createSchedule(scheduleItem);
        }
        return null;
      });
      
      // Wait for all saves to complete
      await Promise.all(savePromises.filter(p => p !== null));
      
      // Save customTimeSlots to localStorage
      localStorage.setItem('customTimeSlots', JSON.stringify(customTimeSlots));
      
      toast.success('מערכת השעות נשמרה בהצלחה');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('שגיאה בשמירת מערכת השעות');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Event handlers
  const handleDayChange = (day: DayOfWeek) => {
    setSelectedDay(day);
  };
  
  const handleEdit = (slotIndex: number) => {
    setIsEditing(true);
    setEditIndex(slotIndex);
  };
  
  const handleSubjectSelect = (subject: Subject | null) => {
    if (editIndex !== null) {
      const updatedSchedule = {
        ...schedule,
        [selectedDay]: schedule[selectedDay].map((slot, idx) => 
          idx === editIndex ? subject : slot
        ),
      };
      setSchedule(updatedSchedule);
      setEditIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditIndex(null);
  };
  
  const handleSaveSchedule = async () => {
    await saveSchedule();
    setIsEditing(false);
    setIsTimeEditing(false);
  };

  const handleTimeEdit = (slotIndex: number, changes: Partial<TimeSlot>) => {
    setCustomTimeSlots(prevTimeSlots => 
      prevTimeSlots.map((slot, idx) => 
        idx === slotIndex ? { ...slot, ...changes } : slot
      )
    );
  };

  const handleResetTimes = () => {
    setCustomTimeSlots(DEFAULT_TIME_SLOTS);
    localStorage.removeItem('customTimeSlots');
    toast.success('זמני השיעורים אופסו');
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
              <button
                className="btn bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 flex items-center"
                onClick={handleSaveSchedule}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    שומר...
                  </>
                ) : (
                  <>
                    <span className="text-xl mr-2">💾</span>
                    שמור שינויים
                  </>
                )}
              </button>
              <button
                className="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 flex items-center"
                onClick={() => {
                  setIsEditing(false);
                  setIsTimeEditing(false);
                }}
                disabled={isSaving}
              >
                <span className="text-xl mr-2">🔒</span>
                ביטול
              </button>
            </>
          ) : (
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