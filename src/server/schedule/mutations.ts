import { createClient } from '@/utils/supabase/server';
import { SupabaseScheduleRecord, Subject, ScheduleData, DefaultTimeSlot } from '@/types/schedule';
import { DayOfWeek } from '@/types';

// TODO: Fetch actual subjects from a 'subjects' table if it exists
// For now, use the mock list for validation/sanitization
import { subjects as VALID_SUBJECTS_LIST } from '@/types/schedule';

// Mock subject list for validation (consistency check)
// Specify type for 's' to resolve implicit any
const VALID_SUBJECT_NAMES = new Set(VALID_SUBJECTS_LIST.map((s: Subject) => s.name));

// Function to convert DayOfWeek string enum back to numeric day for DB (0=Sun)
function dayOfWeekToDayNumber(day: DayOfWeek): number | null {
  const mapping: { [key in DayOfWeek]?: number } = {
    [DayOfWeek.SUNDAY]: 0,
    [DayOfWeek.MONDAY]: 1,
    [DayOfWeek.TUESDAY]: 2,
    [DayOfWeek.WEDNESDAY]: 3,
    [DayOfWeek.THURSDAY]: 4,
    [DayOfWeek.FRIDAY]: 5,
    // Assuming Saturday is not used
  };
  return mapping[day] ?? null;
}

/**
 * Saves the complete schedule data (structured as ScheduleData) to Supabase.
 */
export async function saveScheduleData(scheduleData: ScheduleData) {
  const supabase = await createClient();
  
  // --- Get current user ID --- 
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { 
      console.error('User not authenticated for saving schedule');
      throw new Error('User not authenticated'); 
  }
  const userId = user.id;
  // --- End Get user ID --- 

  console.log(`Preparing schedule data for saving (user: ${userId}):`, scheduleData);

  const recordsToUpsert: Omit<SupabaseScheduleRecord, 'id'>[] = [];
  const validationErrors: string[] = [];

  // Iterate through each day in the ScheduleData object
  for (const dayKey in scheduleData) {
    const day = dayKey as DayOfWeek;
    const daySlots = scheduleData[day]; // This is now ScheduleSlot[]
    const dayNumber = dayOfWeekToDayNumber(day);

    if (dayNumber !== null && daySlots && Array.isArray(daySlots)) {
      // Iterate through each ScheduleSlot for the day
      daySlots.forEach((slot) => {
        const subjectName = slot.subject ? slot.subject.name : null;
        const slotIndex = slot.slotIndex;

        // --- Validation/Sanitization (using Name) --- 
        if (subjectName && !VALID_SUBJECT_NAMES.has(subjectName)) {
          validationErrors.push(`Invalid subject name '${subjectName}' provided for day ${day}, slot ${slotIndex}.`);
          return; // Skip this slot if subject name is invalid
        }
        // TODO: Add validation for startTime and endTime format if needed (Zod handles basic format)

        recordsToUpsert.push({
          user_id: userId, // Include the user ID
          day_of_week: dayNumber,
          slot_index: slotIndex, 
          subject: subjectName, 
          start_time: `${slot.startTime}:00`, 
          end_time: `${slot.endTime}:00`,     
        });
      });
    }
  }

  // If validation errors occurred during processing
  if (validationErrors.length > 0) {
    console.error('Schedule validation errors:', validationErrors);
    throw new Error(`Invalid schedule data provided: ${validationErrors.join('; ')}`);
  }

  if (recordsToUpsert.length === 0) {
    console.log('No schedule data to save.');
    // Maybe clear existing data if needed?
    return { success: true, message: 'No changes detected.' };
  }

  // Perform the upsert operation
  console.log('Upserting schedule records:', recordsToUpsert);
  const { error } = await supabase
    .from('schedules')
    .upsert(recordsToUpsert, {
      onConflict: 'user_id, day_of_week, slot_index', 
      ignoreDuplicates: false, 
    });

  if (error) {
    console.error('Supabase upsert error:', error);
    // Check if it's an RLS error specifically
    if (error.message.includes('violates row-level security policy')) {
        throw new Error('Permission denied. You might not have the rights to modify this schedule.');
    } else {
        throw new Error(`Failed to save schedule data: ${error.message}`);
    }
  }

  console.log('Schedule data saved successfully.');
  return { success: true, message: 'Schedule saved successfully.' };
}

// TODO: Add function to save TimeSlots if they are editable
export async function saveTimeSlots(timeSlots: DefaultTimeSlot[]) {
  // Placeholder: In a real app, save this to Supabase
  console.log('Saving time slots:', timeSlots);
  // ... Supabase client call to update/insert time slots ...
  return { success: true };
} 