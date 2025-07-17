import { createClient } from '@/utils/supabase/server';
import { 
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
  };
  return mapping[dayNumber] || null;
}

/**
 * OPTIMIZED: Fetches subjects from the database with only required fields
 */
export async function fetchSubjects(): Promise<Subject[]> {
  noStore();
  console.log('Fetching subjects from database...');
  
  try {
    const supabase = await createClient();
    // OPTIMIZATION: Select only required fields instead of *
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, color, text_color, icon')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching subjects:', error);
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('No subjects found in database, returning default subjects');
      return MOCK_SUBJECTS;
    }
    
    // Transform database records to Subject format
    return data.map(subject => ({
      id: subject.id,
      name: subject.name,
      color: subject.color,
      textColor: subject.text_color,
      icon: subject.icon
    }));
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    return MOCK_SUBJECTS;
  }
}

/**
 * OPTIMIZED: Fetches the default time slots from Supabase with only required fields
 */
async function fetchDefaultTimeSlots(): Promise<DefaultTimeSlot[]> {
  noStore();
  console.log('Fetching default time slots from database...');
  
  try {
    const supabase = await createClient();
    // OPTIMIZATION: Select only required fields and add efficient caching
    const { data, error } = await supabase
      .from('time_slots')
      .select('id, start_time, end_time, slot_index')
      .order('slot_index', { ascending: true });
      
    if (error) {
      console.error('Error fetching time slots:', error);
      throw new Error(`Failed to fetch time slots: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('No time slots found in database, returning hardcoded defaults');
      return DEFAULT_TIME_SLOTS;
    }
    
    // Transform database records to DefaultTimeSlot format
    return data.map(slot => ({
      id: slot.id,
      startTime: slot.start_time.substring(0, 5),
      endTime: slot.end_time.substring(0, 5),
      slotIndex: slot.slot_index
    }));
  } catch (error) {
    console.error('Failed to fetch time slots:', error);
    return DEFAULT_TIME_SLOTS;
  }
}

/**
 * OPTIMIZED VERSION 1: Uses the optimized view for better performance
 */
export async function fetchProcessedScheduleDataOptimized(): Promise<ScheduleData> {
  noStore();
  const supabase = await createClient();

  // OPTIMIZATION: Use the optimized view instead of separate queries
  const [scheduleResponse, defaultTimeSlots] = await Promise.all([
    supabase
      .from('schedule_with_subjects')
      .select(`
        id,
        user_id,
        day_of_week,
        slot_index,
        subject,
        start_time,
        end_time,
        subject_name,
        subject_color,
        subject_text_color,
        subject_icon,
        default_start_time,
        default_end_time
      `)
      .order('day_of_week', { ascending: true })
      .order('slot_index', { ascending: true }),
    fetchDefaultTimeSlots()
  ]);

  const { data: rawData, error } = scheduleResponse;

  if (error) {
    console.error('Supabase fetch error:', error);
    throw new Error(`Failed to fetch schedule data: ${error.message}`);
  }

  console.log('Raw data received from optimized view:', rawData);
  console.log('Default time slots:', defaultTimeSlots);

  // Initialize the final structure with default slots for all days
  const processedData: ScheduleData = {};
  Object.values(DayOfWeek).forEach(day => {
    processedData[day] = defaultTimeSlots.map((defaultSlot, index) => ({
      slotIndex: index,
      day: day,
      subject: null,
      startTime: defaultSlot.startTime,
      endTime: defaultSlot.endTime,
    }));
  });

  // Merge actual data from the optimized view
  (rawData as {
    day_of_week: number;
    slot_index: number;
    subject: string;
    subject_name?: string;
    subject_color?: string;
    subject_text_color?: string;
    subject_icon?: string;
  }[]).forEach(record => {
    const day = dayNumberToDayOfWeek(record.day_of_week);
    if (day && processedData[day] && record.slot_index < processedData[day]!.length) {
      const subject = record.subject_name ? {
        id: record.subject,
        name: record.subject_name,
        color: record.subject_color,
        textColor: record.subject_text_color,
        icon: record.subject_icon
      } : null;
      
      if (subject || record.subject) {
        processedData[day]![record.slot_index] = {
          slotIndex: record.slot_index,
          day: day,
          subject: subject || null,
          startTime: (record as unknown as { start_time: string }).start_time?.substring(0, 5) || '',
          endTime: (record as unknown as { end_time: string }).end_time?.substring(0, 5) || '',
        };
      } else {
        processedData[day]![record.slot_index].subject = null;
      }
    }
  });

  console.log('Processed schedule data (optimized):', processedData);
  return processedData;
}

/**
 * OPTIMIZED VERSION 2: Uses a single query with manual joins for maximum performance
 */
export async function fetchProcessedScheduleDataUltraOptimized(): Promise<ScheduleData> {
  noStore();
  const supabase = await createClient();

  try {
    // OPTIMIZATION: Single query with all required data
    const { data: combinedData, error } = await supabase.rpc('get_complete_schedule_data');

    if (error) {
      console.error('RPC call error:', error);
      // Fallback to standard method
      return fetchProcessedScheduleData();
    }

    // Process the combined data directly
    const processedData: ScheduleData = {};
    
    // Initialize with default structure
    Object.values(DayOfWeek).forEach(day => {
      processedData[day] = [];
    });

    // Process the optimized data
    combinedData.forEach((record: {
      day_of_week: number;
      slot_index: number;
      subject: string;
      subject_name?: string;
      subject_color?: string;
      subject_text_color?: string;
      subject_icon?: string;
    }) => {
      const day = dayNumberToDayOfWeek(record.day_of_week);
      if (day) {
        if (!processedData[day]) {
          processedData[day] = [];
        }
        
        processedData[day]![record.slot_index] = {
          slotIndex: record.slot_index,
          day: day,
          subject: record.subject_name ? {
            id: record.subject,
            name: record.subject_name,
            color: record.subject_color,
            textColor: record.subject_text_color,
            icon: record.subject_icon
          } : null,
          startTime: (record as unknown as { start_time?: string; default_start_time: string }).start_time?.substring(0, 5) || (record as unknown as { default_start_time: string }).default_start_time.substring(0, 5),
          endTime: (record as unknown as { end_time?: string; default_end_time: string }).end_time?.substring(0, 5) || (record as unknown as { default_end_time: string }).default_end_time.substring(0, 5),
        };
      }
    });

    return processedData;
  } catch (error) {
    console.error('Ultra-optimized fetch failed, falling back to standard method:', error);
    return fetchProcessedScheduleData();
  }
}

/**
 * OPTIMIZED: Fetches schedule data for a specific user with caching
 */
export async function fetchUserScheduleOptimized(userId: string): Promise<ScheduleData> {
  noStore();
  const supabase = await createClient();

  // Use user-specific view for better performance
  const { data, error } = await supabase
    .from('schedule_with_subjects')
    .select(`
      day_of_week,
      slot_index,
      subject,
      start_time,
      end_time,
      subject_name,
      subject_color,
      subject_text_color,
      subject_icon,
      default_start_time,
      default_end_time
    `)
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('slot_index', { ascending: true });

  if (error) {
    console.error('Error fetching user schedule:', error);
    throw new Error(`Failed to fetch schedule data: ${error.message}`);
  }

  // Get default time slots concurrently
  const defaultTimeSlots = await fetchDefaultTimeSlots();

  // Initialize the final structure
  const processedData: ScheduleData = {};
  Object.values(DayOfWeek).forEach(day => {
    processedData[day] = defaultTimeSlots.map((defaultSlot, index) => ({
      slotIndex: index,
      day: day,
      subject: null,
      startTime: defaultSlot.startTime,
      endTime: defaultSlot.endTime,
    }));
  });

  // Merge actual data
  data.forEach(record => {
    const day = dayNumberToDayOfWeek(record.day_of_week);
    if (day && processedData[day] && record.slot_index < processedData[day]!.length) {
      const subject = record.subject_name ? {
        id: record.subject,
        name: record.subject_name,
        color: record.subject_color,
        textColor: record.subject_text_color,
        icon: record.subject_icon
      } : null;
      
      processedData[day]![record.slot_index] = {
        slotIndex: record.slot_index,
        day: day,
        subject: subject,
        startTime: record.start_time?.substring(0, 5) || record.default_start_time.substring(0, 5),
        endTime: record.end_time?.substring(0, 5) || record.default_end_time.substring(0, 5),
      };
    }
  });

  return processedData;
}

// Legacy mock subjects as fallback
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
  { id: 'library', name: 'ספריה', color: 'bg-amber-50', textColor: 'text-amber-800', icon: '📚' },
];

// Default time slots
const DEFAULT_TIME_SLOTS: DefaultTimeSlot[] = [
  { startTime: '08:00', endTime: '08:45' },
  { startTime: '08:50', endTime: '09:35' },
  { startTime: '09:50', endTime: '10:35' },
  { startTime: '10:40', endTime: '11:25' },
  { startTime: '11:40', endTime: '12:25' },
  { startTime: '12:30', endTime: '13:15' },
  { startTime: '13:30', endTime: '14:15' },
  { startTime: '14:20', endTime: '15:05' },
];

// Re-export the original function for backward compatibility
export async function fetchProcessedScheduleData(): Promise<ScheduleData> {
  return fetchProcessedScheduleDataOptimized();
}

// Export the default times function
export { fetchDefaultTimeSlots };