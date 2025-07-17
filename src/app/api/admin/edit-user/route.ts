import { createClient } from '@/utils/supabase/server'
import { getServiceSupabase } from '@/utils/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Updates an existing user's information
 * Only admins can edit users, with restrictions on admin role changes
 */
export async function PUT(request: NextRequest) {
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
    const { user_id, email, display_name, username, role, class_id } = await request.json()
    
    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent admin from editing themselves
    if (user_id === user.id) {
      return NextResponse.json({ 
        error: 'לא ניתן לערוך את הפרטים של עצמך' 
      }, { status: 403 })
    }

    const serviceSupabase = getServiceSupabase()

    // Get current user data to check restrictions
    const { data: currentUserData } = await serviceSupabase
      .from('profiles')
      .select('*, user_roles!inner(role)')
      .eq('id', user_id)
      .single()

    if (!currentUserData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent changing admin role or editing other admins
    if ((currentUserData as unknown as { user_roles?: { role: string } }).user_roles?.role === 'admin') {
      return NextResponse.json({ 
        error: 'לא ניתן לערוך מנהל מערכת' 
      }, { status: 403 })
    }

    // Prevent promoting user to admin
    if (role === 'admin') {
      return NextResponse.json({ 
        error: 'לא ניתן לשנות תפקיד למנהל מערכת דרך עריכה רגילה' 
      }, { status: 403 })
    }

    // Check if email is already taken by another user
    if (email && email !== currentUserData.email) {
      const { data: emailCheck } = await serviceSupabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .neq('id', user_id)
        .single()

      if (emailCheck) {
        return NextResponse.json({ 
          error: `האימייל ${email} כבר קיים במערכת` 
        }, { status: 409 })
      }
    }

    // Update profile
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .update({
        email: email || currentUserData.email,
        display_name: display_name || currentUserData.display_name,
        username: username || currentUserData.username,
        class_id: class_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json({ 
        error: `Failed to update profile: ${profileError.message}` 
      }, { status: 500 })
    }

    // Update user role if provided and different
    if (role && role !== (currentUserData as unknown as { user_roles?: { role: string } }).user_roles?.role) {
      const { error: roleError } = await serviceSupabase
        .from('user_roles')
        .update({ role: role })
        .eq('user_id', user_id)

      if (roleError) {
        console.error('Role update error:', roleError)
        return NextResponse.json({ 
          error: `Failed to update role: ${roleError.message}` 
        }, { status: 500 })
      }
    }

    // Handle class relationship updates
    if (class_id !== undefined) {
      const oldRole = (currentUserData as unknown as { user_roles?: { role: string } }).user_roles?.role
      const newRole = role || oldRole

      // Remove old relationships
      if (oldRole === 'child' || (oldRole === 'teacher' && newRole !== 'teacher')) {
        await serviceSupabase
          .from('class_students')
          .delete()
          .eq('student_id', user_id)
      }
      
      if (oldRole === 'teacher' || (oldRole === 'child' && newRole !== 'child')) {
        await serviceSupabase
          .from('teacher_class_relationships')
          .delete()
          .eq('teacher_id', user_id)
      }

      // Add new relationships
      if (class_id) {
        if (newRole === 'child') {
          await serviceSupabase
            .from('class_students')
            .insert({
              class_id: class_id,
              student_id: user_id,
              is_active: true
            })
        } else if (newRole === 'teacher') {
          await serviceSupabase
            .from('teacher_class_relationships')
            .insert({
              teacher_id: user_id,
              class_id: class_id,
              is_primary: false
            })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully' 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}