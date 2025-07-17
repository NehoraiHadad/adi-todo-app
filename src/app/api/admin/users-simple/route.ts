import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

/**
 * GET /api/admin/users-simple
 * Simple endpoint to get all users for admin panel
 */
export async function GET(_request: NextRequest) {
  try {
    // Create client-side supabase instance
    const supabase = createClient();
    
    // Get all profiles using direct query
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Profiles error:', profilesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching profiles',
        details: profilesError.message 
      }, { status: 500 });
    }

    // Get all user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (rolesError) {
      console.error('Roles error:', rolesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching roles',
        details: rolesError.message 
      }, { status: 500 });
    }

    // Combine profiles with roles
    const usersWithRoles = (profiles || []).map(profile => {
      const userRole = (roles || []).find(role => role.user_id === profile.id);
      return {
        ...profile,
        user_role: userRole?.role || 'unknown'
      };
    });

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
      debug: {
        profilesCount: profiles?.length || 0,
        rolesCount: roles?.length || 0,
        usersCount: usersWithRoles.length
      }
    });

  } catch (error) {
    console.error('Error in users-simple API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}