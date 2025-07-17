import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabase } from '@/utils/supabase/service-client';

/**
 * GET /api/admin/users
 * Retrieves all users in the system (admin only) - OPTIMIZED VERSION
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
    
    // OPTIMIZED: Single query with JOIN instead of two separate queries
    const { data: usersWithRoles, error: usersError } = await serviceSupabase
      .from('profiles')
      .select(`
        id, 
        email, 
        display_name, 
        username, 
        role, 
        created_at, 
        updated_at,
        user_roles!inner(role)
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ 
        error: 'Error fetching users',
        details: usersError.message 
      }, { status: 500 });
    }

    // Transform the data to match the expected format
    const formattedUsers = usersWithRoles?.map(user => ({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      user_role: user.role || 'unknown'
    })) || [];

    // Calculate statistics
    const stats = {
      total: formattedUsers.length,
      children: formattedUsers.filter(u => u.user_role === 'child').length,
      parents: formattedUsers.filter(u => u.user_role === 'parent').length,
      teachers: formattedUsers.filter(u => u.user_role === 'teacher').length,
      admins: formattedUsers.filter(u => u.user_role === 'admin').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
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
 * Alternative optimized version using a database view for better performance
 * This would be ideal if we create a view in the database
 */
export async function GET_WITH_VIEW(_request: NextRequest) {
  try {
    // Authentication logic remains the same...
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
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole, error: roleError } = await userSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceSupabase = getServiceSupabase();
    
    // Use the optimized view (would need to be created first)
    const { data: usersWithRoles, error: usersError } = await serviceSupabase
      .from('admin_users_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ 
        error: 'Error fetching users',
        details: usersError.message 
      }, { status: 500 });
    }

    // Calculate statistics directly from the view data
    const stats = {
      total: usersWithRoles?.length || 0,
      children: usersWithRoles?.filter(u => u.user_role === 'child').length || 0,
      parents: usersWithRoles?.filter(u => u.user_role === 'parent').length || 0,
      teachers: usersWithRoles?.filter(u => u.user_role === 'teacher').length || 0,
      admins: usersWithRoles?.filter(u => u.user_role === 'admin').length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithRoles || [],
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
 * Deletes a user from the system (admin only) - Same as original
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication logic remains the same...
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
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole, error: roleError } = await userSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get('userId');

    if (!userIdToDelete) {
      return NextResponse.json({ 
        error: 'מזהה משתמש נדרש' 
      }, { status: 400 });
    }

    if (userIdToDelete === user.id) {
      return NextResponse.json({ 
        error: 'לא ניתן למחוק את המשתמש הנוכחי' 
      }, { status: 400 });
    }

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

    // Delete from related tables first (parent_child_relationships)
    await serviceSupabase
      .from('parent_child_relationships')
      .delete()
      .or(`parent_id.eq.${userIdToDelete},child_id.eq.${userIdToDelete}`);

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