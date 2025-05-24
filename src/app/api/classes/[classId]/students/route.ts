// src/app/api/classes/[classId]/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types';

interface RouteParams {
  params: {
    classId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { classId } = params;

  if (!classId) {
    return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 });
  }

  // 1. Get authenticated user
  const { data: { user: teacherUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !teacherUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify user role is TEACHER
  const { data: userRoleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', teacherUser.id)
    .eq('role', UserRole.TEACHER)
    .single();

  if (roleError || !userRoleData) {
    return NextResponse.json({ error: 'Forbidden: Only teachers can perform this action.' }, { status: 403 });
  }

  // 3. Verify Class Ownership
  const { data: classData, error: classFetchError } = await supabase
    .from('classes')
    .select('id, teacher_id')
    .eq('id', classId)
    .single();

  if (classFetchError || !classData) {
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  }

  if (classData.teacher_id !== teacherUser.id) {
    return NextResponse.json({ error: 'Forbidden: You are not the teacher of this class.' }, { status: 403 });
  }

  // 4. Fetch enrolled students for this class
  const { data: enrollments, error: studentsFetchError } = await supabase
    .from('student_class_enrollments')
    .select(`
      id,
      status,
      enrolled_at,
      student: profiles (id, username, display_name)
    `)
    .eq('class_id', classId)
    .eq('status', 'approved');

  if (studentsFetchError) {
    console.error('Error fetching students for class:', studentsFetchError.message);
    return NextResponse.json({ error: 'Failed to fetch students.' }, { status: 500 });
  }
  
  const students = enrollments?.map(e => ({
      enrollment_id: e.id,
      enrollment_status: e.status,
      enrolled_at: e.enrolled_at,
      student_id: e.student?.id,
      student_username: e.student?.username,
      student_display_name: e.student?.display_name || e.student?.username || 'N/A',
  }));

  return NextResponse.json(students || [], { status: 200 });
}
