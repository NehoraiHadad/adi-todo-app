import { createClient } from '@/utils/supabase/server';
import { 
    SupabaseScheduleRecord, 
    Subject, 
    ScheduleData,
    DefaultTimeSlot
} from '@/types/schedule';
import { DayOfWeek } from '@/types';
import { unstable_noStore as noStore } from 'next/cache';

// Function to convert numeric day from DB (0=Sun) to DayOfWeek string enum
function dayNumberToDayOfWeek(dayNumber: number): DayOfWeek | null {
  const mapping: { [key: number]: DayOfWeek } = {
    0: DayOfWeek.SUNDAY,
    1: DayOfWeek.MONDAY,
    2: DayOfWeek.TUESDAY,
    3: DayOfWeek.WEDNESDAY,
    4: DayOfWeek.THURSDAY,
    5: DayOfWeek.FRIDAY,
    // 6: DayOfWeek.SATURDAY, // Assuming Saturday is not used
  };
  return mapping[dayNumber] || null;
}

// TODO: Fetch actual subjects from a 'subjects' table if it exists
// For now, using the hardcoded list (similar to component types)
const MOCK_SUBJECTS: Subject[] = [
    { id: 'english', name: 'אנגלית', color: 'bg-purple-100', textColor: 'text-purple-700', icon: '🔤' },
    { id: 'hebrew', name: 'עברית', color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '📚' },
    { id: 'math', name: 'חשבון', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📏' },
    { id: 'halacha', name: 'הלכה', color: 'bg-blue-100', textColor: 'text-blue-700', icon: '📕' },
    { id: 'tanach', name: 'תנ"ך', color: 'bg-teal-100', textColor: 'text-teal-700', icon: '📖' },
    { id: 'mathematics', name: 'מתמטיקה', color: 'bg-indigo-100', textColor: 'text-indigo-700', icon: '📐' },
    { id: 'gym', name: 'חנ"ג', color: 'bg-orange-100', textColor: 'text-orange-700', icon: '⚽' },
    { id: 'torah-iyun', name: 'תורה-עיון', color: 'bg-green-100', textColor: 'text-green-700', icon: '🕮' },
    { id: 'life-skills', name: 'כישורי-חיים', color: 'bg-pink-100', textColor: 'text-pink-700', icon: '🧠' },
    { id: 'science', name: 'מדעים', color: 'bg-green-100', textColor: 'text-green-700', icon: '🌱' },
    { id: 'art', name: 'אמנות', color: 'bg-pink-100', textColor: 'text-pink-700', icon: '🎨' },
    { id: 'mishna', name: 'משנה', color: 'bg-amber-100', textColor: 'text-amber-700', icon: '📜' },
    { id: 'parasha', name: 'פרשת-שבוע', color: 'bg-violet-100', textColor: 'text-violet-700', icon: '🕯️' },
    { id: 'friday-personal', name: 'שישי-אישי', color: 'bg-rose-100', textColor: 'text-rose-700', icon: '🌟' },
    { id: 'computers', name: 'מחשבים', color: 'bg-slate-100', textColor: 'text-slate-700', icon: '💻' },
];

// Key the map by SUBJECT NAME for easier lookup from DB record
const subjectsMapByName = new Map(MOCK_SUBJECTS.map(s => [s.name, s]));

/**
 * Fetches the default time slots from Supabase.
 */
async function fetchDefaultTimeSlots(): Promise<DefaultTimeSlot[]> {
  noStore();
  console.log('Fetching default time slots from database...');
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('slot_index', { ascending: true });
      
    if (error) {
      console.error('Error fetching time slots:', error);
      throw new Error(`Failed to fetch time slots: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('No time slots found in database, returning hardcoded defaults');
      // Fallback to hardcoded defaults if no data in database
      return [
        { startTime: '08:00', endTime: '08:45' },
        { startTime: '08:50', endTime: '09:35' },
        { startTime: '09:50', endTime: '10:35' },
        { startTime: '10:40', endTime: '11:25' },
        { startTime: '11:40', endTime: '12:25' },
        { startTime: '12:30', endTime: '13:15' },
        { startTime: '13:30', endTime: '14:15' },
        { startTime: '14:20', endTime: '15:05' },
      ];
    }
    
    // Transform database records to DefaultTimeSlot format
    return data.map(slot => ({
      id: slot.id,
      startTime: slot.start_time.substring(0, 5), // Format as HH:MM
      endTime: slot.end_time.substring(0, 5),     // Format as HH:MM
      slotIndex: slot.slot_index
    }));
  } catch (error) {
    console.error('Failed to fetch time slots:', error);
    // Return hardcoded defaults as fallback
    return [
      { startTime: '08:00', endTime: '08:45' },
      { startTime: '08:50', endTime: '09:35' },
      { startTime: '09:50', endTime: '10:35' },
      { startTime: '10:40', endTime: '11:25' },
      { startTime: '11:40', endTime: '12:25' },
      { startTime: '12:30', endTime: '13:15' },
      { startTime: '13:30', endTime: '14:15' },
      { startTime: '14:20', endTime: '15:05' },
    ];
  }
}

/**
 * Fetches the complete schedule data from Supabase, processed into ScheduleSlot objects.
 */
export async function fetchProcessedScheduleData(): Promise<ScheduleData> {
  noStore(); 
  const supabase = await createClient(); 

  // Fetch raw schedule records and default time slots concurrently
  const [scheduleResponse, defaultTimeSlots] = await Promise.all([
    supabase
      .from('schedules') 
      .select('*')       
      .order('day_of_week', { ascending: true })
      .order('slot_index', { ascending: true }),
    fetchDefaultTimeSlots() // Fetch the defaults
  ]);

  const { data: rawData, error } = scheduleResponse;

  if (error) {
    console.error('Supabase fetch error:', error);
    throw new Error(`Failed to fetch schedule data: ${error.message}`);
  }

  console.log('Raw data received:', rawData);
  console.log('Default time slots:', defaultTimeSlots);

  // Initialize the final structure with default slots for all days
  const processedData: ScheduleData = {};
  Object.values(DayOfWeek).forEach(day => {
      processedData[day] = defaultTimeSlots.map((defaultSlot, index) => ({
          slotIndex: index,
          day: day,
          subject: null, // Default to no subject
          startTime: defaultSlot.startTime, // Use default time
          endTime: defaultSlot.endTime,     // Use default time
      }));
  });

  // Merge actual data from Supabase into the default structure
  (rawData as SupabaseScheduleRecord[]).forEach(record => {
    const day = dayNumberToDayOfWeek(record.day_of_week);
    if (day && processedData[day] && record.slot_index < processedData[day]!.length) {
      const subject = record.subject ? subjectsMapByName.get(record.subject) : null;
      
      // Fixed: If there's a subject assigned, use specific times from the DB
      // If no subject is assigned, keep the default times already in this time slot
      if (subject || record.subject) {
        processedData[day]![record.slot_index] = {
            slotIndex: record.slot_index,
            day: day,
            subject: subject || null,
            startTime: record.start_time.substring(0, 5), // Use specific time from DB
            endTime: record.end_time.substring(0, 5),     // Use specific time from DB
        };
      } else {
        // Only store the subject information (null), but keep default times
        processedData[day]![record.slot_index].subject = null;
      }
    }
  });

  console.log('Processed schedule data (with specific times):', processedData);
  return processedData;
}

// Export the default times function as well, might be useful separately
export { fetchDefaultTimeSlots }; 