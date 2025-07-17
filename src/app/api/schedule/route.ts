import { NextResponse } from 'next/server';
import { 
  fetchProcessedScheduleData, 
  fetchDefaultTimeSlots, 
  fetchClassScheduleData, 
  fetchAvailableClasses, 
  fetchSchedulePermissions 
} from '@/server/schedule/queries';
import { saveScheduleData } from '@/server/schedule/mutations';
import { z } from 'zod';
import { DayOfWeek } from '@/types';
// Removed Subject, ScheduleSlot imports as they were unused
// import { Subject, ScheduleSlot } from '@/types/schedule'; 
// TODO: Import actual validation logic if available
// import { validateSchedule } from '@/utils/validation'; 

// Schema for a single subject (can remain nullable if a slot can be empty)
const subjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().optional(),
    textColor: z.string().optional(),
    icon: z.string().optional(),
}).nullable();

// NEW: Schema for a single ScheduleSlot
const scheduleSlotSchema = z.object({
    slotIndex: z.number(),
    day: z.nativeEnum(DayOfWeek),
    subject: subjectSchema, // Use the existing subject schema
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time format (HH:MM)"), // Add validation
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time format (HH:MM)"),   // Add validation
});

// Update the main schema to expect an array of ScheduleSlot per day
const scheduleDaySchema = z.array(scheduleSlotSchema); 
const patchRequestBodySchema = z.record(z.nativeEnum(DayOfWeek), scheduleDaySchema);

// Define the type based on the schema
type SchedulePatchData = z.infer<typeof patchRequestBodySchema>;

// Placeholder for detailed validation
// Renamed scheduleData to _scheduleData and specified types
function serverSideValidate(_scheduleData: SchedulePatchData): { isValid: boolean; errors: unknown[] } {
  // TODO: Implement detailed validation using imported logic
  // e.g., iterate through _scheduleData, validate each entry
  console.warn('Server-side validation is using placeholder logic.');
  // For now, always return true until validation is implemented
  return { isValid: true, errors: [] }; 
}

/**
 * GET handler to fetch processed schedule data and default time slots.
 * Supports query parameters: ?classId=xxx to fetch class schedule
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    
    console.log('=== API GET /schedule called ===');
    console.log('URL:', url.toString());
    console.log('classId parameter:', classId);

    // If classId is provided, fetch class schedule
    if (classId) {
      console.log('Fetching class schedule for classId:', classId);
      const [classScheduleData, defaultTimeSlots, availableClasses, permissions] = await Promise.all([
        fetchClassScheduleData(classId),
        fetchDefaultTimeSlots(),
        fetchAvailableClasses(),
        fetchSchedulePermissions(classId)
      ]);

      return NextResponse.json({ 
        schedule: classScheduleData, 
        defaultTimeSlots,
        availableClasses,
        permissions,
        scheduleType: 'class',
        classId
      });
    }

    // Fetch personal schedule data and available classes
    console.log('Fetching personal schedule data (no classId)');
    const [scheduleData, defaultTimeSlots, availableClasses, permissions] = await Promise.all([
      fetchProcessedScheduleData(),
      fetchDefaultTimeSlots(),
      fetchAvailableClasses(),
      fetchSchedulePermissions()
    ]);

    // Return the schedule (now with specific times) and the default timeslots
    return NextResponse.json({ 
      schedule: scheduleData, 
      defaultTimeSlots, 
      availableClasses,
      permissions,
      scheduleType: 'personal'
    });

  } catch (error: unknown) { // Changed 'any' to 'unknown'
    console.error('[API /schedule GET] Error:', error);
    // Type guard or check error instance before accessing message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: `Failed to fetch schedule: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler to save updated schedule data.
 * Supports query parameters: ?classId=xxx to save class schedule
 */
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const requestBody = await request.json();

    // 1. Validate against the NEW schema
    const validationResult = patchRequestBodySchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('[API /schedule PATCH] Zod Validation Error:', validationResult.error.format()); // Use .format() for better errors
      return NextResponse.json(
        { message: 'Invalid schedule data structure', errors: validationResult.error.flatten().fieldErrors }, // Use flattened errors
        { status: 400 }
      );
    }
    const structuredScheduleData = validationResult.data;

    // 2. Detailed server-side business logic validation
    // TODO: Replace placeholder validation with actual logic from utils
    const detailedValidation = serverSideValidate(structuredScheduleData);
    if (!detailedValidation.isValid) {
        console.error('[API /schedule PATCH] Detailed Validation Error:', detailedValidation.errors);
        return NextResponse.json(
            { message: 'Invalid schedule data', errors: detailedValidation.errors },
            { status: 400 }
        );
    }

    // Call the server-side mutation function (needs to accept ScheduleData)
    const result = await saveScheduleData(structuredScheduleData, classId || undefined); // Pass the validated new structure

    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      // This part might not be reached if saveScheduleData throws on error
      // Throwing an error might be better practice here
      console.error('[API /schedule PATCH] Save failed:', result.message);
      return NextResponse.json({ message: result.message || 'Failed to save schedule' }, { status: 500 });
    }

  } catch (error: unknown) { // Changed 'any' to 'unknown'
    console.error('[API /schedule PATCH] Error:', error);
    // Type guard or check error instance before accessing message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: `Failed to save schedule: ${errorMessage}` },
      { status: 500 }
    );
  }
} 