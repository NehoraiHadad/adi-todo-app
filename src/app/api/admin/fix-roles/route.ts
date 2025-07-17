import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types';
import { 
  checkRoleConsistency, 
  fixAllRoleInconsistencies
} from '@/utils/role-consistency-checker';

/**
 * API endpoint for checking and fixing role consistency issues
 * Only accessible by admin users
 */

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!userRole || userRole.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Check role consistency
    const report = await checkRoleConsistency();
    
    return NextResponse.json({
      success: true,
      report: report
    });
    
  } catch (error) {
    console.error('Error checking role consistency:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!userRole || userRole.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { action, use_user_roles_as_source = true } = body;
    
    if (action === 'fix_all') {
      // Fix all role inconsistencies
      const result = await fixAllRoleInconsistencies(use_user_roles_as_source);
      
      return NextResponse.json({
        success: result.success,
        message: `Fixed ${result.fixed_count} users, ${result.failed_count} failures`,
        details: {
          fixed_count: result.fixed_count,
          failed_count: result.failed_count,
          errors: result.errors
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use action: "fix_all"'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error fixing roles:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}