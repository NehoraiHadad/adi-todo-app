import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { current_password, new_password } = await request.json()

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: 'נדרשת סיסמה נוכחית וסיסמה חדשה' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'לא מחובר למערכת' },
        { status: 401 }
      )
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current_password
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'הסיסמה הנוכחית שגויה' },
        { status: 400 }
      )
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password
    })

    if (updateError) {
      return NextResponse.json(
        { error: 'שגיאה בעדכון הסיסמה' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'הסיסמה עודכנה בהצלחה' 
    })

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'שגיאה בשינוי הסיסמה' },
      { status: 500 }
    )
  }
}