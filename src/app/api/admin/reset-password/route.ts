import { createClient } from '@/utils/supabase/server'
import { getServiceSupabase } from '@/utils/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Resets a user's password - admin only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get request data
    const { user_id, new_password } = await request.json()
    
    if (!user_id || !new_password) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 })
    }

    // Use service client to reset password
    const serviceSupabase = getServiceSupabase()
    
    const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json({ 
        error: `Failed to update password: ${updateError.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully' 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}