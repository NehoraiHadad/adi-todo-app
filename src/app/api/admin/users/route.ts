import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabase } from '@/utils/supabase/service-client';

/**
 * GET /api/admin/users
 * Retrieves all users in the system (admin only)
 * 
 * @param request - The incoming request
 * @returns JSON response with users data or error
 */
export async function GET(_request: NextRequest) {
  try {
    // First, authenticate the user using the normal client
    const cookieStore = await cookies();
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    );
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using the regular client
    const { data: userRole, error: roleError } = await userSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Now use service client to bypass RLS for admin operations
    const serviceSupabase = getServiceSupabase();
    
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, email, display_name, username, role, class_id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ 
        error: 'Error fetching profiles',
        details: profilesError.message 
      }, { status: 500 });
    }

    // Get roles for all users using service client
    const { data: roles, error: rolesError } = await serviceSupabase
      .from('user_roles')
      .select('user_id, role')
      .order('created_at', { ascending: false });

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return NextResponse.json({ 
        error: 'Error fetching roles',
        details: rolesError.message 
      }, { status: 500 });
    }

    // Combine profiles with roles
    const usersWithRoles = profiles?.map(profile => {
      const userRole = roles?.find(role => role.user_id === profile.id);
      return {
        ...profile,
        user_role: userRole?.role || 'unknown'
      };
    }) || [];

    // Calculate statistics
    const stats = {
      total: usersWithRoles.length,
      children: usersWithRoles.filter(u => u.user_role === 'child').length,
      parents: usersWithRoles.filter(u => u.user_role === 'parent').length,
      teachers: usersWithRoles.filter(u => u.user_role === 'teacher').length,
      admins: usersWithRoles.filter(u => u.user_role === 'admin').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithRoles,
        stats
      },
      message: 'רשימת המשתמשים נטענה בהצלחה'
    });

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בטעינת רשימת המשתמשים',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Deletes a user from the system (admin only)
 * 
 * @param request - The incoming request with user ID
 * @returns JSON response with success/error message
 */
export async function DELETE(request: NextRequest) {
  try {
    // First, authenticate the user using the normal client
    const cookieStore = await cookies();
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    );
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using the regular client
    const { data: userRole, error: roleError } = await userSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user ID to delete from request
    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get('userId');

    if (!userIdToDelete) {
      return NextResponse.json({ 
        error: 'מזהה משתמש נדרש' 
      }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userIdToDelete === user.id) {
      return NextResponse.json({ 
        error: 'לא ניתן למחוק את המשתמש הנוכחי' 
      }, { status: 400 });
    }

    // Use service client for deletion operations
    const serviceSupabase = getServiceSupabase();

    // Check if user to delete is admin
    const { data: targetUserRole } = await serviceSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userIdToDelete)
      .single();

    if (targetUserRole?.role === 'admin') {
      return NextResponse.json({ 
        error: 'לא ניתן למחוק מנהל מערכת' 
      }, { status: 403 });
    }

    // Delete from related tables first 
    await serviceSupabase
      .from('parent_child_relationships')
      .delete()
      .or(`parent_id.eq.${userIdToDelete},child_id.eq.${userIdToDelete}`);

    // Delete from class relationships
    await serviceSupabase
      .from('class_students')
      .delete()
      .eq('student_id', userIdToDelete);

    await serviceSupabase
      .from('teacher_class_relationships')
      .delete()
      .eq('teacher_id', userIdToDelete);

    // Delete from user_roles (foreign key constraint)
    const { error: roleDeleteError } = await serviceSupabase
      .from('user_roles')
      .delete()
      .eq('user_id', userIdToDelete);

    if (roleDeleteError) {
      console.error('Error deleting user role:', roleDeleteError);
      return NextResponse.json({ 
        error: 'שגיאה במחיקת תפקיד המשתמש',
        details: roleDeleteError.message 
      }, { status: 500 });
    }

    // Delete from profiles
    const { error: profileDeleteError } = await serviceSupabase
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete);

    if (profileDeleteError) {
      console.error('Error deleting user profile:', profileDeleteError);
      return NextResponse.json({ 
        error: 'שגיאה במחיקת פרופיל המשתמש',
        details: profileDeleteError.message 
      }, { status: 500 });
    }

    // Delete from auth.users using admin API
    const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(userIdToDelete);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // This is not a critical error as the user is already deleted from our tables
      console.warn('User deleted from tables but auth deletion failed:', authDeleteError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'המשתמש נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה במחיקת המשתמש',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}