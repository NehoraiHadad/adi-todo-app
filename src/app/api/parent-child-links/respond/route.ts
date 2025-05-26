// src/app/api/parent-child-links/respond/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user: childUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !childUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = childUser.id;

  let linkId: number | string; // Assuming link_id could be int or uuid
  let action: string;

  try {
    const body = await request.json();
    linkId = body.link_id;
    action = body.action;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!linkId || !action) {
    return NextResponse.json({ error: 'link_id and action are required' }, { status: 400 });
  }

  if (action !== 'approved' && action !== 'rejected') {
    return NextResponse.json({ error: "Invalid action value. Must be 'approved' or 'rejected'." }, { status: 400 });
  }

  // Fetch the link record
  const { data: linkRecord, error: fetchError } = await supabase
    .from('parent_child_links')
    .select('id, child_id, status')
    .eq('id', linkId)
    .single();

  if (fetchError || !linkRecord) {
    return NextResponse.json({ error: 'Link request not found' }, { status: 404 });
  }

  // Security Check: Ensure the logged-in user is the child in the link request
  if (linkRecord.child_id !== currentUserId) {
    return NextResponse.json({ error: 'Forbidden: You can only respond to your own link requests.' }, { status: 403 });
  }

  // Check if the request is still pending
  if (linkRecord.status !== 'pending') {
    return NextResponse.json({ error: 'This link request has already been processed.' }, { status: 409 }); // 409 Conflict
  }

  // Update the status
  const { data: updatedRecord, error: updateError } = await supabase
    .from('parent_child_links')
    .update({ status: action, updated_at: new Date().toISOString() }) // Also update updated_at
    .eq('id', linkId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating link request:', updateError.message);
    return NextResponse.json({ error: 'Failed to update link request' }, { status: 500 });
  }

  return NextResponse.json({ message: `Link request ${action} successfully.`, record: updatedRecord }, { status: 200 });
}
