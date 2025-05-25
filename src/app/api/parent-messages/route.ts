// src/app/api/parent-messages/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types'; // Ensure UserRole is imported

// GET /api/parent-messages - Get parent messages for the current user (recipient)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;
    
    let query = supabase
      .from('parent_messages')
      .select('*')
      .eq('user_id', user.id) // user_id here is the recipient
      .order('created_at', { ascending: false });
    
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching parent messages:', error.message);
      return NextResponse.json({ error: 'Failed to fetch messages.' }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error processing GET /api/parent-messages:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/parent-messages - Create a new parent message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: senderUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !senderUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: senderRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', senderUser.id)
      .in('role', [UserRole.PARENT, UserRole.TEACHER])
      .maybeSingle();

    if (roleError || !senderRoleData) {
      console.error('Role check error or invalid role for sending message:', roleError?.message);
      return NextResponse.json({ error: 'Forbidden: Only parents or teachers can send these messages.' }, { status: 403 });
    }
    const senderRole = senderRoleData.role as UserRole;

    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', senderUser.id)
      .single();

    if (profileError || !senderProfile) {
      console.error('Failed to fetch sender profile:', profileError?.message);
      return NextResponse.json({ error: 'Failed to fetch sender profile.' }, { status: 500 });
    }
    const senderName = senderProfile.display_name || senderProfile.username || 'Anonymous';

    const body = await request.json();
    const { recipient_id, content } = body;

    if (!recipient_id) {
      return NextResponse.json({ error: 'Recipient ID (recipient_id) is required.' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    if (senderRole === UserRole.PARENT) {
      const { data: linkData, error: linkFetchError } = await supabase
        .from('parent_child_links')
        .select('status')
        .eq('parent_id', senderUser.id)
        .eq('child_id', recipient_id)
        .eq('status', 'approved')
        .single();

      if (linkFetchError || !linkData) {
        return NextResponse.json({ error: 'Forbidden: Parent not linked or link not approved with this recipient.' }, { status: 403 });
      }
    }
    // TODO: Add similar link verification if TEACHERs are sending messages to students in their class.

    const messageToInsert = {
      user_id: recipient_id, // user_id in table is the recipient
      sender_id: senderUser.id, // This is the new crucial field
      sender_name: senderName,
      content: content.trim(),
      is_read: false,
    };

    const { data: newMessage, error: insertError } = await supabase
      .from('parent_messages')
      .insert(messageToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating parent message:', insertError.message);
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error('Error processing POST /api/parent-messages:', error.message);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/parent-messages - Mark messages as read (batch update for recipient)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // This is the recipient marking their messages as read
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Message IDs array is required.' }, { status: 400 });
    }
    
    const updates = {
      is_read: body.is_read !== undefined ? body.is_read : true,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('parent_messages')
      .update(updates)
      .in('id', body.ids)
      .eq('user_id', user.id) // Ensures recipient can only mark their own messages as read
      .select();
    
    if (error) {
      console.error('Error updating parent messages:', error.message);
      return NextResponse.json({ error: 'Failed to update messages.' }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error processing PATCH /api/parent-messages:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
