import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/utils/supabase/service-client'

/**
 * GET /api/admin/check-setup
 * Checks if there are admin users in the system
 * This is used to determine if the admin setup link should be shown
 */
export async function GET(_request: NextRequest) {
  try {
    const serviceSupabase = getServiceSupabase()
    
    // Count admin users
    const { data: adminUsers, error } = await serviceSupabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)

    if (error) {
      console.error('Error checking admin users:', error)
      // On error, assume admin users exist (safer default)
      return NextResponse.json({ hasAdminUsers: true })
    }

    const hasAdminUsers = adminUsers && adminUsers.length > 0

    return NextResponse.json({ 
      hasAdminUsers,
      adminCount: adminUsers?.length || 0
    })

  } catch (error) {
    console.error('Error in check-setup:', error)
    // On error, assume admin users exist (safer default)
    return NextResponse.json({ hasAdminUsers: true })
  }
}