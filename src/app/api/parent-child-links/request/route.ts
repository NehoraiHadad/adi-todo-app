// src/app/api/parent-child-links/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Server-side client

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Get authenticated parent's user ID
  const { data: { user: parentUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !parentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parentId = parentUser.id;

  // 2. Get child_username from request body
  let childUsername: string;
  try {
    const body = await request.json();
    childUsername = body.child_username;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 3. Validate input
  if (!childUsername) {
    return NextResponse.json({ error: 'Child username is required' }, { status: 400 });
  }

  // 4. Look up child_id from profiles table
  const { data: childProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username') // Assuming 'id' is the user_id and 'username' column exists
    .eq('username', childUsername)
    .single();

  if (profileError || !childProfile) {
    console.error('Child profile lookup error:', profileError);
    return NextResponse.json({ error: 'Child username not found' }, { status: 404 });
  }
  const childId = childProfile.id;

  // 5. Prevent self-linking
  if (parentId === childId) {
    return NextResponse.json({ error: 'Cannot link to yourself' }, { status: 400 });
  }

  // 6. Check for existing link
  const { data: existingLink, error: existingLinkError } = await supabase
    .from('parent_child_links')
    .select('id, status')
    .eq('parent_id', parentId)
    .eq('child_id', childId)
    .maybeSingle(); // Use maybeSingle as it might not exist

  if (existingLinkError) {
    console.error('Error checking for existing link:', existingLinkError.message);
    return NextResponse.json({ error: 'Failed to check for existing link' }, { status: 500 });
  }

  if (existingLink) {
    if (existingLink.status === 'pending') {
      return NextResponse.json({ message: 'Link request already pending', link: existingLink }, { status: 409 });
    } else if (existingLink.status === 'approved') {
      return NextResponse.json({ message: 'Already linked with this child', link: existingLink }, { status: 409 });
    }
    // If rejected, could allow a new request, or have a different flow. For now, treat as conflict.
    return NextResponse.json({ message: 'A link request already exists or was processed', link: existingLink }, { status: 409 });
  }

  // 7. Insert new link record
  const { data: newLink, error: insertError } = await supabase
    .from('parent_child_links')
    .insert({
      parent_id: parentId,
      child_id: childId,
      status: 'pending',
    })
    .select() // Return the inserted record
    .single();

  if (insertError) {
    console.error('Error creating link request:', insertError.message);
    return NextResponse.json({ error: 'Failed to create link request' }, { status: 500 });
  }

  // 8. Return success
  return NextResponse.json({ message: 'Link request sent successfully', link: newLink }, { status: 201 });
}
