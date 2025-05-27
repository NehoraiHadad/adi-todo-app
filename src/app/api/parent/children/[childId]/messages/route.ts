// src/app/api/parent/children/[childId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  const supabase = await createClient();
  const childId = (context.params as { childId: string }).childId;

  if (!childId) {
    return NextResponse.json({ error: 'Child ID is required.' }, { status: 400 });
  }

  // 1. Get authenticated parent user
  const { data: { user: parentUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !parentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parentId = parentUser.id;

  // 2. Verify user role is PARENT
  const { data: userRoleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', parentId)
    .eq('role', UserRole.PARENT)
    .single();

  if (roleError || !userRoleData) {
    return NextResponse.json({ error: 'Forbidden: Only parents can perform this action.' }, { status: 403 });
  }

  // 3. Verify Link Status with the specified childId
  const { data: linkData, error: linkError } = await supabase
    .from('parent_child_links')
    .select('status')
    .eq('parent_id', parentId)
    .eq('child_id', childId)
    .eq('status', 'approved')
    .single();

  if (linkError || !linkData) {
    console.error('Link verification error or no approved link for messages:', linkError?.message);
    return NextResponse.json({ error: 'Forbidden: No approved link with this child or failed to verify link.' }, { status: 403 });
  }

  // 4. Fetch messages for the conversation
  const { data: messages, error: messagesFetchError } = await supabase
    .from('parent_messages')
    .select('*') // Select all message fields
    .or(`and(sender_id.eq.${parentId},user_id.eq.${childId}),and(sender_id.eq.${childId},user_id.eq.${parentId})`)
    .order('created_at', { ascending: true });

  if (messagesFetchError) {
    console.error('Error fetching conversation messages:', messagesFetchError.message);
    return NextResponse.json({ error: 'Failed to fetch messages.' }, { status: 500 });
  }

  return NextResponse.json(messages || [], { status: 200 });
}
