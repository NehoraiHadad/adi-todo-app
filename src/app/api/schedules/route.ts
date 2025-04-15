import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/schedules - Get schedules for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dayOfWeek = searchParams.get('dayOfWeek');
    const isShared = searchParams.get('isShared') === 'true';
    const allDays = searchParams.get('allDays') === 'true';
    
    // Handle request for all days at once
    if (allDays) {
      // Create a map to store schedules by day
      const schedulesByDay: Record<number, any[]> = {
        0: [], 1: [], 2: [], 3: [], 4: [], 5: []
      };
      
      // Build the base query
      let query = supabase
        .from('schedules')
        .select('*')
        .order('start_time', { ascending: true });
      
      // Filter by shared class schedules if specified
      if (isShared !== null) {
        query = query.eq('is_shared', isShared);
      } else {
        // If not specified, get both personal and shared
        query = query.or(`user_id.eq.${user.id},is_shared.eq.true`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching all schedules:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      // Group schedules by day of week
      if (data) {
        data.forEach(schedule => {
          const day = schedule.day_of_week;
          if (day >= 0 && day <= 5) { // Only process valid days (0-5)
            schedulesByDay[day].push(schedule);
          }
        });
      }
      
      return NextResponse.json(schedulesByDay);
    }
    
    // Original code for single day query
    // Build the query
    let query = supabase
      .from('schedules')
      .select('*')
      .order('start_time', { ascending: true });
    
    // Filter by day of week if specified
    if (dayOfWeek !== null) {
      query = query.eq('day_of_week', parseInt(dayOfWeek));
    }
    
    // Filter by personal schedules or shared class schedules
    if (isShared !== null) {
      query = query.eq('is_shared', isShared);
    } else {
      // If not specified, get both personal and shared
      query = query.or(`user_id.eq.${user.id},is_shared.eq.true`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/schedules - Create a new schedule item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Add user_id to the schedule and ensure time formats are consistent
    const schedule = {
      ...body,
      user_id: user.id,
      start_time: body.start_time ? body.start_time.padStart(5, '0') : null,
      end_time: body.end_time ? body.end_time.padStart(5, '0') : null
    };
    
    // Make sure we have all required fields
    if (!schedule.day_of_week || !schedule.start_time || !schedule.end_time || !schedule.subject) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { schedule }
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// DELETE /api/schedules - Delete schedules for a specific day
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dayOfWeek = searchParams.get('dayOfWeek');
    
    if (dayOfWeek === null) {
      return NextResponse.json(
        { error: 'Day of week parameter is required' },
        { status: 400 }
      );
    }
    
    // Delete all schedules for this day and user
    const { data, error } = await supabase
      .from('schedules')
      .delete()
      .eq('user_id', user.id)
      .eq('day_of_week', parseInt(dayOfWeek))
      .is('is_shared', false);  // Only delete personal schedules, not shared ones
    
    if (error) {
      console.error('Error deleting schedules:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Schedules deleted successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/schedules - Update a schedule item
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updates = await request.json();
    const { id, ...updateData } = updates;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required for updates' },
        { status: 400 }
      );
    }
    
    // Check if the schedule item belongs to the user
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching schedule for update:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule item not found' }, { status: 404 });
    }
    
    if (existingSchedule.user_id !== user.id && !updates.is_shared) {
      return NextResponse.json(
        { error: 'Unauthorized to update this schedule item' },
        { status: 403 }
      );
    }
    
    // Remove user_id from updates if it exists to prevent changing ownership
    delete updateData.user_id;
    
    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating schedule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 