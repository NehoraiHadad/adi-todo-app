import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tasks - Get tasks for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const isShared = searchParams.get('isShared') === 'true';
    
    // Build the query
    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false });
    
    // Filter by completion status if requested
    if (!includeCompleted) {
      query = query.eq('is_completed', false);
    }
    
    // Filter by personal tasks or shared class tasks
    if (isShared !== null) {
      query = query.eq('is_shared', isShared);
    }
    
    // Filter by user
    query = query.eq('user_id', user.id);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Add user_id to the task
    const task = {
      ...body,
      user_id: user.id,
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 