import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/user/role - Check if the current user has admin role
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin role
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGSQL_NO_ROWS_RETURNED') {
      console.error('Error fetching user role:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // If no role found or not admin, return 'student' as default role
    const role = data?.role || 'student';
    
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 