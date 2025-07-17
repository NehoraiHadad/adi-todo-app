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

    // Get all classes first
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Enrich classes with related data
    const enrichedClasses = await Promise.all(
      (classes || []).map(async (cls) => {
        // Get teacher profile if teacher_id exists
        let teacher_profile = null
        if (cls.teacher_id) {
          const { data: teacherData } = await supabase
            .from('profiles')
            .select('id, display_name, email')
            .eq('id', cls.teacher_id)
            .single()
          teacher_profile = teacherData
        }

        // Get teacher-class relationships
        const { data: teacherRelationships } = await supabase
          .from('teacher_class_relationships')
          .select('id, teacher_id, is_primary')
          .eq('class_id', cls.id)

        // Get teacher profiles for relationships
        const enrichedTeacherRels = await Promise.all(
          (teacherRelationships || []).map(async (rel) => {
            const { data: teacherData } = await supabase
              .from('profiles')
              .select('id, display_name, email')
              .eq('id', rel.teacher_id)
              .single()
            return { ...rel, teacher_profile: teacherData }
          })
        )

        // Get class students
        const { data: classStudents } = await supabase
          .from('class_students')
          .select('id, student_id, is_active, enrolled_at')
          .eq('class_id', cls.id)

        // Get student profiles
        const enrichedStudents = await Promise.all(
          (classStudents || []).map(async (student) => {
            const { data: studentData } = await supabase
              .from('profiles')
              .select('id, display_name, email, username')
              .eq('id', student.student_id)
              .single()
            return { ...student, student_profile: studentData }
          })
        )

        return {
          ...cls,
          teacher_profile,
          teacher_class_relationships: enrichedTeacherRels,
          class_students: enrichedStudents
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      classes: enrichedClasses || [] 
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

    const { name, grade, school_year, teacher_id } = await request.json()

    if (!name || !grade) {
      return NextResponse.json({ 
        error: 'שם כיתה ורמה הם שדות חובה' 
      }, { status: 400 })
    }

    const serviceSupabase = getServiceSupabase()
    
    // Create the class
    const { data: newClass, error: classError } = await serviceSupabase
      .from('classes')
      .insert({
        name,
        grade,
        school_year: school_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        teacher_id: teacher_id || null,
        is_active: true
      })
      .select()
      .single()

    if (classError) {
      console.error('Error creating class:', classError)
      return NextResponse.json({ 
        error: 'שגיאה ביצירת הכיתה' 
      }, { status: 500 })
    }

    // If teacher_id is provided, create teacher-class relationship
    if (teacher_id) {
      await serviceSupabase
        .from('teacher_class_relationships')
        .insert({
          teacher_id: teacher_id,
          class_id: newClass.id,
          is_primary: true
        })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'כיתה נוצרה בהצלחה',
      class: newClass
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

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

    const { id, name, grade, school_year, teacher_id, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        error: 'Class ID is required' 
      }, { status: 400 })
    }

    const serviceSupabase = getServiceSupabase()
    
    // Update the class
    const { data: updatedClass, error: classError } = await serviceSupabase
      .from('classes')
      .update({
        name,
        grade,
        school_year,
        teacher_id,
        is_active
      })
      .eq('id', id)
      .select()
      .single()

    if (classError) {
      console.error('Error updating class:', classError)
      return NextResponse.json({ 
        error: 'שגיאה בעדכון הכיתה' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'כיתה עודכנה בהצלחה',
      class: updatedClass
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
    const classId = searchParams.get('id')

    if (!classId) {
      return NextResponse.json({ 
        error: 'Class ID is required' 
      }, { status: 400 })
    }

    const serviceSupabase = getServiceSupabase()
    
    // Delete related records first
    await serviceSupabase
      .from('teacher_class_relationships')
      .delete()
      .eq('class_id', classId)
    
    await serviceSupabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
    
    // Update profiles to remove class_id
    await serviceSupabase
      .from('profiles')
      .update({ class_id: null })
      .eq('class_id', classId)

    // Delete the class
    const { error: classError } = await serviceSupabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (classError) {
      console.error('Error deleting class:', classError)
      return NextResponse.json({ 
        error: 'שגיאה במחיקת הכיתה' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'כיתה נמחקה בהצלחה'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}