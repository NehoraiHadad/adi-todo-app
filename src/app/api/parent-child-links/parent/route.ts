// src/app/api/parent-child-links/parent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user: parentUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !parentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parentId = parentUser.id;

  // Fetch sent requests by this parent, joining with profiles to get child's username/display_name
  // Assuming the foreign key from parent_child_links.child_id to profiles.id is 'parent_child_links_child_id_fkey'
  // or Supabase can infer it.
  const { data: requests, error: fetchError } = await supabase
    .from('parent_child_links')
    .select(`
      id,
      child_id,
      status,
      created_at,
      updated_at,
      child_profile: profiles!parent_child_links_child_id_fkey (id, username, display_name)
    `)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching sent link requests for parent:', fetchError.message);
    // Fallback if join fails or relation name is incorrect
    const { data: fallbackRequests, error: fallbackError } = await supabase
        .from('parent_child_links')
        .select('id, child_id, status, created_at, updated_at')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });
    
    if (fallbackError) {
        console.error('Error fetching sent link requests for parent (fallback):', fallbackError.message);
        return NextResponse.json({ error: 'Failed to fetch sent link requests' }, { status: 500 });
    }
    // For fallback, client will only have child_id. 
    // The LinkChildForm already tries to access req.child_profile?.username.
    const formattedFallbackRequests = fallbackRequests.map(req => ({
        ...req,
        child_profile: { id: req.child_id, username: 'N/A', display_name: 'N/A' } 
    }));
    return NextResponse.json(formattedFallbackRequests || [], { status: 200 });
  }

  return NextResponse.json(requests || [], { status: 200 });
}
