import { createClient } from '@/utils/supabase/server'
import { getServiceSupabase } from '@/utils/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')

    if (!classId) {
      return NextResponse.json({ 
        error: 'Class ID is required' 
      }, { status: 400 })
    }

    // Get students in the class
    const { data: students, error } = await supabase
      .from('class_students')
      .select(`
        *,
        student_profile:profiles!class_students_student_id_fkey(
          id,
          display_name,
          email,
          username,
          date_of_birth,
          grade
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Error fetching class students:', error)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      students: students || [] 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
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

    const { student_id, class_id } = await request.json()

    if (!student_id || !class_id) {
      return NextResponse.json({ 
        error: 'Student ID and Class ID are required' 
      }, { status: 400 })
    }

    const serviceSupabase = getServiceSupabase()
    
    // Check if student is already enrolled in this class
    const { data: existing } = await serviceSupabase
      .from('class_students')
      .select('*')
      .eq('student_id', student_id)
      .eq('class_id', class_id)
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json({ 
        error: 'התלמיד כבר רשום לכיתה זו' 
      }, { status: 400 })
    }

    // Enroll student in class
    const { data: enrollment, error: enrollError } = await serviceSupabase
      .from('class_students')
      .insert({
        student_id,
        class_id,
        is_active: true
      })
      .select()
      .single()

    if (enrollError) {
      console.error('Error enrolling student:', enrollError)
      return NextResponse.json({ 
        error: 'שגיאה ברישום התלמיד לכיתה' 
      }, { status: 500 })
    }

    // Update student's profile class_id
    await serviceSupabase
      .from('profiles')
      .update({ class_id })
      .eq('id', student_id)

    return NextResponse.json({ 
      success: true, 
      message: 'תלמיד נרשם לכיתה בהצלחה',
      enrollment
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const classId = searchParams.get('class_id')

    if (!studentId || !classId) {
      return NextResponse.json({ 
        error: 'Student ID and Class ID are required' 
      }, { status: 400 })
    }

    const serviceSupabase = getServiceSupabase()
    
    // Remove student from class
    const { error: removeError } = await serviceSupabase
      .from('class_students')
      .update({ is_active: false })
      .eq('student_id', studentId)
      .eq('class_id', classId)

    if (removeError) {
      console.error('Error removing student from class:', removeError)
      return NextResponse.json({ 
        error: 'שגיאה בהסרת התלמיד מהכיתה' 
      }, { status: 500 })
    }

    // Update student's profile class_id to null
    await serviceSupabase
      .from('profiles')
      .update({ class_id: null })
      .eq('id', studentId)

    return NextResponse.json({ 
      success: true, 
      message: 'תלמיד הוסר מהכיתה בהצלחה'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}