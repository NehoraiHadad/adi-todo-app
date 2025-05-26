// src/app/api/enrollments/student/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types';

export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user: studentUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !studentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify user role is STUDENT
  const { data: userRoleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', studentUser.id)
    .eq('role', UserRole.STUDENT)
    .single();

  if (roleError || !userRoleData) {
    return NextResponse.json({ error: 'Forbidden: Only students can view their enrollments.' }, { status: 403 });
  }

  // 3. Fetch enrolled classes for this student
  // Joins: student_class_enrollments -> classes -> profiles (for teacher's name)
  const { data: enrollments, error: fetchError } = await supabase
    .from('student_class_enrollments')
    .select(`
      id, 
      status,
      enrolled_at,
      class: classes (
        id,
        name,
        class_code,
        teacher: profiles!classes_teacher_id_fkey ( 
          id, 
          username, 
          display_name 
        )
      )
    `)
    .eq('student_id', studentUser.id)
    .eq('status', 'approved'); // Assuming 'approved' means successfully enrolled

  if (fetchError) {
    console.error('Error fetching student enrollments:', fetchError.message);
    return NextResponse.json({ error: 'Failed to fetch enrollments.' }, { status: 500 });
  }

  // Format the response if needed, or return directly
  const enrolledClasses = enrollments?.map(e => ({
    enrollment_id: e.id,
    enrollment_status: e.status,
    enrolled_at: e.enrolled_at,
    class_id: e.class?.id,
    class_name: e.class?.name,
    class_code: e.class?.class_code,
    teacher_id: e.class?.teacher?.id,
    teacher_name: e.class?.teacher?.display_name || e.class?.teacher?.username || 'N/A',
  }));

  return NextResponse.json(enrolledClasses || [], { status: 200 });
}
