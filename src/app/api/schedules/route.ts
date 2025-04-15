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
    
    // Add user_id to the schedule
    const schedule = {
      ...body,
      user_id: user.id,
    };
    
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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