// src/app/api/parent-child-links/child/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user: childUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !childUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const childId = childUser.id;

  // Fetch pending requests for this child, joining with profiles to get parent's username
  // Adjust 'profiles(username)' if the column name for display is different (e.g., 'display_name')
  // The select string below attempts a join to fetch parent's profile information.
  // The foreign key `parent_child_links_parent_id_fkey` is assumed to exist,
  // linking `parent_child_links.parent_id` to `profiles.id`.
  const { data: finalRequests, error: finalFetchError } = await supabase
    .from('parent_child_links')
    .select(`
      id,
      status,
      created_at,
      parent: profiles!parent_child_links_parent_id_fkey (id, username, display_name)
    `)
    .eq('child_id', childId)
    .eq('status', 'pending');
  
  if (finalFetchError) {
    console.error('Error fetching link requests for child (with join):', finalFetchError.message);
    // Fallback if join fails: fetch without join
    const { data: fallbackRequests, error: fallbackError } = await supabase
        .from('parent_child_links')
        .select('id, parent_id, status, created_at')
        .eq('child_id', childId)
        .eq('status', 'pending');

    if (fallbackError) {
        console.error('Error fetching link requests for child (fallback):', fallbackError.message);
        return NextResponse.json({ error: 'Failed to fetch link requests' }, { status: 500 });
    }
    // If fallback is used, the client might need to fetch parent profiles separately.
    return NextResponse.json({ data: fallbackRequests || [], usingFallback: true }, { status: 200 });
  }

  return NextResponse.json(finalRequests || [], { status: 200 });
}
