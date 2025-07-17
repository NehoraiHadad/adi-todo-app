import { createClient } from '@/utils/supabase/server'
import { getServiceSupabase } from '@/utils/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Generates a secure random password
 * @param length - Password length (default: 12)
 * @returns Random password string
 */
function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generates a simple temporary password for children
 * Format: name + random 3 digits (easy to remember, meets 6+ char requirement)
 * @param username - Username or display name to base password on
 * @returns Simple password string for children (minimum 6 characters)
 */
function generateChildFriendlyPassword(username: string): string {
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Ensure minimum 6 characters for Supabase requirement
  const baseUsername = cleanUsername.length >= 3 ? cleanUsername : (cleanUsername + 'abc');
  const password = `${baseUsername}${randomSuffix}`;
  
  // If still too short, pad with numbers
  return password.length >= 6 ? password : password + '123';
}

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
    const { email, display_name, username, role, parent_email, class_id } = await request.json()
    
    // Security check - prevent admin creation through regular endpoint
    if (role === 'admin') {
      return NextResponse.json({ 
        error: 'לא ניתן ליצור מנהל מערכת דרך נקודה זו. השתמש ב-API מיוחד ליצירת מנהלים' 
      }, { status: 403 })
    }
    
    // Generate appropriate password based on user role
    const password = role === 'child' 
      ? generateChildFriendlyPassword(username || display_name.split(' ')[0] || 'user')
      : generateSecurePassword();
    
    // Create user using service client admin API (this won't sign them in)
    const serviceSupabase = getServiceSupabase()
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        display_name: display_name,
        username: username
      },
      email_confirm: true // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      // If user already exists, give helpful error message
      if (authError.message.includes('User already registered')) {
        return NextResponse.json({ 
          success: false, 
          error: `המשתמש ${email} כבר קיים במערכת. אנא השתמש באימייל אחר או בדוק אם הוא כבר מופיע ברשימת המשתמשים.` 
        })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create auth user: ${authError.message}` 
      })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user returned from auth.signUp' 
      })
    }

    // Wait a bit for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Insert profile using service client
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .insert({
        id: authData.user.id,  // Use the real auth user ID
        email: email,
        display_name: display_name,
        username: username,
        role: role,  // Ensure role is consistent across both tables
        class_id: class_id || null  // Add class_id if provided
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: `Profile creation failed: ${profileError.message}` 
      })
    }

    // Insert user role using service client
    const { error: roleError } = await serviceSupabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,  // Use the real auth user ID
        role: role
      })

    if (roleError) {
      console.error('Role error:', roleError)
      return NextResponse.json({ 
        success: false, 
        error: `Role creation failed: ${roleError.message}` 
      })
    }

    // Handle parent-child relationship if needed
    if (role === 'child' && parent_email) {
      const { data: parentData } = await serviceSupabase
        .from('profiles')
        .select('id')
        .eq('email', parent_email)
        .single()

      if (parentData) {
        await serviceSupabase
          .from('parent_child_relationships')
          .insert({
            parent_id: parentData.id,
            child_id: authData.user.id  // Use the real auth user ID
          })
      }
    }

    // Handle class assignment
    if (class_id) {
      if (role === 'child') {
        // Enroll student in class
        await serviceSupabase
          .from('class_students')
          .insert({
            class_id: class_id,
            student_id: authData.user.id,
            is_active: true
          })
      } else if (role === 'teacher') {
        // Assign teacher to class
        await serviceSupabase
          .from('teacher_class_relationships')
          .insert({
            teacher_id: authData.user.id,
            class_id: class_id,
            is_primary: false  // Default to non-primary, can be changed later
          })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user_id: authData.user.id,
      generated_password: password,
      password_type: role === 'child' ? 'child_friendly' : 'secure'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}