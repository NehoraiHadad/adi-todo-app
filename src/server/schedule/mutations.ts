import { createClient } from '@/utils/supabase/server';
import { SupabaseScheduleRecord, Subject, ScheduleData, DefaultTimeSlot } from '@/types/schedule';
import { DayOfWeek } from '@/types';
import { fetchSubjects } from './queries';

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

  // Fetch valid subjects from the database
  const validSubjects = await fetchSubjects();
  const VALID_SUBJECT_NAMES = new Set(validSubjects.map((s: Subject) => s.name));

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

// Save time slots to the database
export async function saveTimeSlots(timeSlots: DefaultTimeSlot[]) {
  console.log('Saving time slots:', timeSlots);
  
  try {
    const supabase = await createClient();
    
    // Process each time slot
    const results = await Promise.all(timeSlots.map(async (slot) => {
      // If slot has an ID, update it, otherwise insert a new one
      if (slot.id) {
        const { error } = await supabase
          .from('time_slots')
          .update({
            start_time: slot.startTime,
            end_time: slot.endTime,
            slot_index: slot.slotIndex,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slot.id);
          
        if (error) throw error;
        return { success: true, id: slot.id, operation: 'update' };
      } else {
        // Insert new time slot
        const { data, error } = await supabase
          .from('time_slots')
          .insert({
            start_time: slot.startTime,
            end_time: slot.endTime,
            slot_index: slot.slotIndex,
            is_default: true,
          })
          .select('id')
          .single();
          
        if (error) throw error;
        return { success: true, id: data.id, operation: 'insert' };
      }
    }));
    
    return { success: true, results };
  } catch (error) {
    console.error('Error saving time slots:', error);
    return { success: false, error };
  }
} 

/**
 * Saves a subject to the database (update or insert)
 */
export async function saveSubject(subject: Subject) {
  console.log('Saving subject:', subject);
  
  try {
    const supabase = await createClient();
    
    // If subject has an ID, update it, otherwise insert a new one
    if (subject.id && subject.id.length > 10) { // Check if it's a valid UUID
      const { error } = await supabase
        .from('subjects')
        .update({
          name: subject.name,
          color: subject.color,
          text_color: subject.textColor,
          icon: subject.icon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subject.id);
        
      if (error) throw error;
      return { success: true, id: subject.id, operation: 'update' };
    } else {
      // Insert new subject
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          name: subject.name,
          color: subject.color,
          text_color: subject.textColor,
          icon: subject.icon,
        })
        .select('id')
        .single();
        
      if (error) throw error;
      return { success: true, id: data.id, operation: 'insert' };
    }
  } catch (error) {
    console.error('Error saving subject:', error);
    return { success: false, error };
  }
}

/**
 * Deletes a subject from the database
 */
export async function deleteSubject(id: string) {
  console.log('Deleting subject:', id);
  
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true, message: 'Subject deleted successfully.' };
  } catch (error) {
    console.error('Error deleting subject:', error);
    return { success: false, error };
  }
} 