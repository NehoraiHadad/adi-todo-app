import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/parent-messages - Get parent messages for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    
    // Build the query
    let query = supabase
      .from('parent_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    // Filter by read status if requested
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching parent messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/parent-messages - Create a new parent message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Message must have a recipient user_id
    if (!body.user_id) {
      return NextResponse.json({ error: 'Recipient user_id is required' }, { status: 400 });
    }
    
    // Create the message
    const message = {
      ...body,
      is_read: false // Always start as unread
    };
    
    const { data, error } = await supabase
      .from('parent_messages')
      .insert(message)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating parent message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/parent-messages - Mark messages as read (batch update)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Message IDs must be provided
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Message IDs array is required' }, { status: 400 });
    }
    
    // Only allow updating is_read status
    const updates = {
      is_read: body.is_read !== undefined ? body.is_read : true,
      updated_at: new Date().toISOString()
    };
    
    // Update messages that belong to the user
    const { data, error } = await supabase
      .from('parent_messages')
      .update(updates)
      .in('id', body.ids)
      .eq('user_id', user.id)
      .select();
    
    if (error) {
      console.error('Error updating parent messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 