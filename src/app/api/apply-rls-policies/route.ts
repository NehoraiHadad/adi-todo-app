import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Apply profile policies
    const { error } = await supabase.rpc('apply_rls_policies');
    
    if (error) {
      console.error('Error applying RLS policies:', error);
      return NextResponse.json(
        { error: 'Failed to apply RLS policies' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'RLS policies applied successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in apply-rls-policies API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 