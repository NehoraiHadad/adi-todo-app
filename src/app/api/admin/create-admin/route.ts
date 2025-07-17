import { createClient } from '@/utils/supabase/server'
import { getServiceSupabase } from '@/utils/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a new admin user - restricted to existing admins only
 * This is a high-security endpoint that should only be accessible to super admins
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
      return NextResponse.json({ 
        error: 'רק מנהל מערכת יכול ליצור מנהל נוסף' 
      }, { status: 403 })
    }

    // Get request data
    const { email, display_name, username, admin_password } = await request.json()
    
    // Additional security check - require admin password confirmation
    if (!admin_password) {
      return NextResponse.json({ 
        error: 'נדרשת אישור סיסמת מנהל ליצירת מנהל נוסף' 
      }, { status: 400 })
    }

    // Verify admin password by attempting to sign in
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: admin_password
    })

    if (passwordError) {
      return NextResponse.json({ 
        error: 'סיסמת מנהל שגויה' 
      }, { status: 403 })
    }

    // Generate secure password for new admin
    const generateSecurePassword = (length: number = 16): string => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz'
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const numbers = '0123456789'
      const symbols = '!@#$%^&*'
      
      const allChars = lowercase + uppercase + numbers + symbols
      let password = ''
      
      // Ensure at least one character from each category
      password += lowercase[Math.floor(Math.random() * lowercase.length)]
      password += uppercase[Math.floor(Math.random() * uppercase.length)]
      password += numbers[Math.floor(Math.random() * numbers.length)]
      password += symbols[Math.floor(Math.random() * symbols.length)]
      
      // Fill the rest randomly
      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)]
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('')
    }

    const adminPassword = generateSecurePassword(16)
    
    // Create admin user using service client (this won't sign them in)
    const serviceSupabase = getServiceSupabase()
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: email,
      password: adminPassword,
      user_metadata: {
        display_name: display_name,
        username: username,
        role: 'admin'
      },
      email_confirm: true // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      if (authError.message.includes('User already registered')) {
        return NextResponse.json({ 
          success: false, 
          error: `המשתמש ${email} כבר קיים במערכת` 
        })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create admin user: ${authError.message}` 
      })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user returned from auth.signUp' 
      })
    }

    // Wait for user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Insert profile using service client
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        display_name: display_name,
        username: username
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: `Profile creation failed: ${profileError.message}` 
      })
    }

    // Insert admin role using service client
    const { error: roleError } = await serviceSupabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin'
      })

    if (roleError) {
      console.error('Role error:', roleError)
      return NextResponse.json({ 
        success: false, 
        error: `Role creation failed: ${roleError.message}` 
      })
    }

    // Log admin creation for security audit
    console.log(`🔐 SECURITY: Admin user created by ${user.email} for ${email} at ${new Date().toISOString()}`)

    return NextResponse.json({ 
      success: true, 
      message: 'מנהל מערכת נוצר בהצלחה',
      user_id: authData.user.id,
      password: adminPassword,
      security_note: 'הסיסמה חייבת להיות מועברת בצורה מאובטחת ולהשתנות בהתחברות הראשונה'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}