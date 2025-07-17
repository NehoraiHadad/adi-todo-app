import { createClient } from '@/utils/supabase/server';
import { 
    SupabaseScheduleRecord, 
    Subject, 
    ScheduleData,
    DefaultTimeSlot,
    SchedulePermissions,
    ClassScheduleOptions
} from '@/types/schedule';
import { DayOfWeek, UserRole } from '@/types';
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

/**
 * Fetches subjects from the database
 */
export async function fetchSubjects(): Promise<Subject[]> {
  noStore();
  console.log('Fetching subjects from database...');
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching subjects:', error);
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('No subjects found in database, returning default subjects');
      // Fallback to hardcoded defaults if no data in database
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
    // Return hardcoded defaults as fallback
    return MOCK_SUBJECTS;
  }
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

  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user is authenticated, return empty schedule structure
  if (!user) {
    console.log('No user authenticated - returning default empty schedule');
    const defaultTimeSlots = await fetchDefaultTimeSlots();
    const emptySchedule: ScheduleData = {};
    Object.values(DayOfWeek).forEach(day => {
      emptySchedule[day] = defaultTimeSlots.map((defaultSlot, index) => ({
        slotIndex: index,
        day: day,
        subject: null,
        startTime: defaultSlot.startTime,
        endTime: defaultSlot.endTime,
      }));
    });
    return emptySchedule;
  }

  console.log('Fetching schedule for user:', user.id);

  // Note: checking user role for potential future use
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  // profile is available but currently unused - may be needed for admin logic later
  console.log('User profile fetched for potential admin logic:', profile?.role);

  // Build query based on user role
  let query = supabase
    .from('schedules')
    .select('*');

  // Always look for personal schedules first - this is the default behavior
  console.log('Fetching personal schedules for user:', user.id);
  query = query.eq('user_id', user.id)
               .eq('schedule_type', 'personal')
               .order('day_of_week', { ascending: true })
               .order('slot_index', { ascending: true });

  // Fetch raw schedule records, default time slots, and subjects concurrently
  const [scheduleResponse, defaultTimeSlots, subjects] = await Promise.all([
    query,
    fetchDefaultTimeSlots(), // Fetch the defaults
    fetchSubjects() // Fetch subjects from database
  ]);

  const { data: rawData, error } = scheduleResponse;

  if (error) {
    console.error('Supabase fetch error:', error);
    throw new Error(`Failed to fetch schedule data: ${error.message}`);
  }

  console.log('Raw data received:', rawData);
  console.log('Default time slots:', defaultTimeSlots);
  console.log('Fetched subjects:', subjects);

  // Create a map of subjects by name for easy lookup
  const subjectsMapByName = new Map(subjects.map(s => [s.name, s]));
  console.log('Subjects map by name:', subjectsMapByName);

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

  // If no data was found (e.g., user has no personal schedule), return empty schedule
  if (!rawData || rawData.length === 0) {
    console.log('No schedule data found - returning empty schedule structure');
    return processedData;
  }

  // Merge actual data from Supabase into the default structure
  (rawData as SupabaseScheduleRecord[]).forEach(record => {
    const day = dayNumberToDayOfWeek(record.day_of_week);
    console.log(`Processing record: day=${record.day_of_week}, subject=${record.subject}, slot=${record.slot_index}`);
    
    if (day && processedData[day]) {
      // Extend the array if necessary to accommodate the slot index
      while (processedData[day]!.length <= record.slot_index) {
        const slotIndex = processedData[day]!.length;
        processedData[day]!.push({
          slotIndex: slotIndex,
          day: day,
          subject: null,
          startTime: defaultTimeSlots[slotIndex]?.startTime || '00:00',
          endTime: defaultTimeSlots[slotIndex]?.endTime || '00:00',
        });
      }
      
      const subject = record.subject ? subjectsMapByName.get(record.subject) : null;
      console.log(`Subject lookup for "${record.subject}":`, subject);
      
      // Always update the slot with data from the database, whether there's a subject or not
      processedData[day]![record.slot_index] = {
          slotIndex: record.slot_index,
          day: day,
          subject: subject || null,
          startTime: record.start_time.substring(0, 5), // Use specific time from DB
          endTime: record.end_time.substring(0, 5),     // Use specific time from DB
      };
    }
  });

  console.log('Processed schedule data (with specific times):', processedData);
  return processedData;
}

/**
 * Fetches schedule permissions for the current user
 */
export async function fetchSchedulePermissions(classId?: string): Promise<SchedulePermissions> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { canView: false, canEdit: false, canCreate: false, canDelete: false };
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.role as UserRole;

  // Define permissions based on role
  switch (userRole) {
    case UserRole.ADMIN:
      return { canView: true, canEdit: true, canCreate: true, canDelete: true };
    
    case UserRole.TEACHER:
      if (!classId) {
        return { canView: true, canEdit: true, canCreate: true, canDelete: false };
      }
      // Check if teacher is assigned to this class
      const { data: teacherClass } = await supabase
        .from('teacher_class_relationships')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('class_id', classId)
        .single();
      
      return {
        canView: true,
        canEdit: !!teacherClass,
        canCreate: !!teacherClass,
        canDelete: false
      };
    
    case UserRole.PARENT:
      if (!classId) {
        return { canView: false, canEdit: false, canCreate: false, canDelete: false };
      }
      // Check if parent has children in this class - simplified
      console.log('Checking parent permissions for class:', classId);
      const { data: parentRelations } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id)
        .eq('is_active', true);
      
      console.log('Parent relations found:', parentRelations);
      
      if (parentRelations && parentRelations.length > 0) {
        const childIds = parentRelations.map(pr => pr.child_id);
        const { data: childrenInClass } = await supabase
          .from('profiles')
          .select('id')
          .in('id', childIds)
          .eq('class_id', classId);
          
        console.log('Children in target class:', childrenInClass);
        const hasChildInClass = !!childrenInClass && childrenInClass.length > 0;
        console.log('Parent has child in class:', hasChildInClass);
        
        return {
          canView: hasChildInClass,
          canEdit: false,
          canCreate: false,
          canDelete: false
        };
      }
      
      return { canView: false, canEdit: false, canCreate: false, canDelete: false };
    
    case UserRole.CHILD:
      if (!classId) {
        return { canView: true, canEdit: false, canCreate: false, canDelete: false };
      }
      // Check if child is in this class
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', user.id)
        .single();
      
      return {
        canView: studentProfile?.class_id === classId,
        canEdit: false,
        canCreate: false,
        canDelete: false
      };
    
    default:
      return { canView: false, canEdit: false, canCreate: false, canDelete: false };
  }
}

/**
 * Fetches available classes for the current user
 */
export async function fetchAvailableClasses(): Promise<ClassScheduleOptions[]> {
  console.log('=== fetchAvailableClasses called ===');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('No user found');
    return [];
  }

  console.log('User ID:', user.id);

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, class_id')
    .eq('id', user.id)
    .single();

  console.log('User profile:', profile);
  const userRole = profile?.role as UserRole;
  console.log('User role:', userRole);
  let classIds: string[] = [];

  switch (userRole) {
    case UserRole.ADMIN:
      // Admin can see all classes
      console.log('Admin detected - fetching all classes');
      const { data: allClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('is_active', true);
      console.log('All classes from DB:', allClasses);
      classIds = allClasses?.map(c => c.id) || [];
      console.log('Class IDs for admin:', classIds);
      break;

    case UserRole.TEACHER:
      // Teacher can see their assigned classes
      const { data: teacherClasses } = await supabase
        .from('teacher_class_relationships')
        .select('class_id')
        .eq('teacher_id', user.id);
      classIds = teacherClasses?.map(tc => tc.class_id) || [];
      break;

    case UserRole.PARENT:
      // Parent can see classes of their children - simplified query
      console.log('Parent detected - fetching children classes');
      const { data: parentChildren } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id)
        .eq('is_active', true);
      
      console.log('Parent children relationships:', parentChildren);
      
      if (parentChildren && parentChildren.length > 0) {
        const childIds = parentChildren.map(pc => pc.child_id);
        console.log('Child IDs:', childIds);
        
        const { data: childrenProfiles } = await supabase
          .from('profiles')
          .select('class_id')
          .in('id', childIds)
          .not('class_id', 'is', null);
          
        console.log('Children profiles with classes:', childrenProfiles);
        classIds = childrenProfiles?.map(cp => cp.class_id).filter((id): id is string => !!id) || [];
        console.log('Class IDs for parent:', classIds);
      }
      break;

    case UserRole.CHILD:
      // Child can see their own class
      if (profile?.class_id) {
        classIds = [profile.class_id];
      }
      break;
  }

  if (classIds.length === 0) {
    console.log('No class IDs found for user');
    return [];
  }

  // Get class details and permissions
  console.log('Fetching class details for IDs:', classIds);
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .in('id', classIds)
    .eq('is_active', true);

  console.log('Classes details from DB:', classes);
  if (!classes) {
    console.log('No classes found in database');
    return [];
  }

  // Add permission info
  const classOptions: ClassScheduleOptions[] = [];
  for (const cls of classes) {
    console.log(`Getting permissions for class: ${cls.name} (${cls.id})`);
    const permissions = await fetchSchedulePermissions(cls.id);
    console.log(`Permissions for ${cls.name}:`, permissions);
    classOptions.push({
      classId: cls.id,
      className: cls.name,
      canEdit: permissions.canEdit
    });
  }

  console.log('Final class options:', classOptions);
  return classOptions;
}

/**
 * Fetches class schedule data
 */
export async function fetchClassScheduleData(classId: string): Promise<ScheduleData> {
  noStore();
  const supabase = await createClient();

  // Check permissions first
  const permissions = await fetchSchedulePermissions(classId);
  if (!permissions.canView) {
    throw new Error('אין לך הרשאה לצפות במערכת השעות של כיתה זו');
  }

  console.log('Fetching class schedule for class:', classId);

  // Debug: let's check what the query is actually returning
  console.log('Building query with filters:');
  console.log('- class_id:', classId);
  console.log('- schedule_type: class');
  
  // Fetch raw schedule records for the class, default time slots, and subjects concurrently
  const [scheduleResponse, defaultTimeSlots, subjects] = await Promise.all([
    supabase
      .from('schedules')
      .select('*')
      .eq('class_id', classId)
      .eq('schedule_type', 'class')
      .order('day_of_week', { ascending: true })
      .order('slot_index', { ascending: true }),
    fetchDefaultTimeSlots(),
    fetchSubjects()
  ]);
  
  console.log('Query response error:', scheduleResponse.error);
  console.log('Query response count:', scheduleResponse.count);

  const { data: rawData, error } = scheduleResponse;

  if (error) {
    console.error('Supabase fetch error:', error);
    throw new Error(`Failed to fetch class schedule data: ${error.message}`);
  }

  console.log('Raw class schedule data received:', rawData);
  console.log('Number of raw records:', rawData?.length || 0);
  
  // Debug: check data distribution by day
  if (rawData && rawData.length > 0) {
    const dayDistribution = rawData.reduce((acc, record) => {
      acc[record.day_of_week] = (acc[record.day_of_week] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    console.log('Day distribution:', dayDistribution);
  }

  // Create a map of subjects by name for easy lookup
  const subjectsMapByName = new Map(subjects.map(s => [s.name, s]));

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

  // Merge actual data from Supabase into the default structure
  (rawData as SupabaseScheduleRecord[]).forEach((record, index) => {
    const day = dayNumberToDayOfWeek(record.day_of_week);
    console.log(`Processing record ${index}: day=${record.day_of_week} (${day}), slot=${record.slot_index}, subject=${record.subject}`);
    
    if (day && processedData[day]) {
      // Extend the array if necessary to accommodate the slot index
      while (processedData[day]!.length <= record.slot_index) {
        const slotIndex = processedData[day]!.length;
        processedData[day]!.push({
          slotIndex: slotIndex,
          day: day,
          subject: null,
          startTime: defaultTimeSlots[slotIndex]?.startTime || '00:00',
          endTime: defaultTimeSlots[slotIndex]?.endTime || '00:00',
        });
      }
      
      const subject = record.subject ? subjectsMapByName.get(record.subject) : null;
      console.log(`Subject lookup for "${record.subject}":`, subject ? `found: ${subject.name}` : 'not found');
      
      processedData[day]![record.slot_index] = {
        slotIndex: record.slot_index,
        day: day,
        subject: subject || null,
        startTime: record.start_time.substring(0, 5),
        endTime: record.end_time.substring(0, 5),
      };
    } else {
      console.log(`Failed to process record: day=${record.day_of_week}, dayEnum=${day}`);
    }
  });

  console.log('Processed class schedule data:', processedData);
  
  // Debug: check final result structure
  Object.keys(processedData).forEach(dayKey => {
    const dayData = processedData[dayKey as keyof typeof processedData];
    const filledSlots = dayData?.filter(slot => slot.subject !== null).length || 0;
    console.log(`Final result - ${dayKey}: ${filledSlots} filled slots out of ${dayData?.length || 0} total`);
  });
  
  return processedData;
}

// Export the default times function as well, might be useful separately
export { fetchDefaultTimeSlots }; 