import { NextResponse } from 'next/server';
import { fetchDefaultTimeSlots } from '@/server/schedule/queries';
import { saveTimeSlots } from '@/server/schedule/mutations';
import { z } from 'zod';

// Schema for a time slot
const timeSlotSchema = z.object({
  id: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "זמן התחלה לא תקין (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "זמן סיום לא תקין (HH:MM)"),
  slotIndex: z.number().int().nonnegative(),
  is_default: z.boolean().optional(),
});

const putRequestBodySchema = z.array(timeSlotSchema);

/**
 * GET handler to fetch time slots
 */
export async function GET() {
  try {
    const timeSlots = await fetchDefaultTimeSlots();
    return NextResponse.json({ timeSlots });
  } catch (error: unknown) {
    console.error('[API /timeslots GET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    return NextResponse.json(
      { message: `שגיאה בטעינת שעות הלימוד: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update time slots
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = putRequestBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Save time slots
    const result = await saveTimeSlots(validationResult.data);
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'שגיאה בשמירת שעות הלימוד' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'שעות הלימוד נשמרו בהצלחה', ...result });
  } catch (error: unknown) {
    console.error('[API /timeslots PUT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    return NextResponse.json(
      { message: `שגיאה בשמירת שעות הלימוד: ${errorMessage}` },
      { status: 500 }
    );
  }
} 