// src/app/api/enrollments/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Forbidden: Only students can join classes.' }, { status: 403 });
  }

  // 3. Get class_code from request body
  let classCode: string;
  try {
    const body = await request.json();
    classCode = body.class_code;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!classCode || typeof classCode !== 'string' || classCode.trim().length === 0) {
    return NextResponse.json({ error: 'Class code is required.' }, { status: 400 });
  }
  classCode = classCode.trim().toUpperCase(); // Normalize class code

  // 4. Find Class ID by class_code
  const { data: classData, error: classFetchError } = await supabase
    .from('classes')
    .select('id')
    .eq('class_code', classCode)
    .single();

  if (classFetchError || !classData) {
    return NextResponse.json({ error: 'Invalid or expired class code.' }, { status: 404 });
  }
  const classId = classData.id;

  // 5. Check for existing enrollment
  const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
    .from('student_class_enrollments')
    .select('id')
    .eq('student_id', studentUser.id)
    .eq('class_id', classId)
    .maybeSingle();

  if (enrollmentCheckError) {
    console.error('Error checking existing enrollment:', enrollmentCheckError.message);
    return NextResponse.json({ error: 'Failed to verify enrollment status.' }, { status: 500 });
  }

  if (existingEnrollment) {
    return NextResponse.json({ message: 'You are already enrolled in this class.' }, { status: 409 });
  }

  // 6. Insert new enrollment record
  const { data: newEnrollment, error: insertError } = await supabase
    .from('student_class_enrollments')
    .insert({
      student_id: studentUser.id,
      class_id: classId,
      status: 'approved', // Direct enrollment via code is auto-approved
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error enrolling in class:', insertError.message);
    return NextResponse.json({ error: 'Failed to enroll in class.' }, { status: 500 });
  }

  // 7. Return success
  return NextResponse.json({ message: 'Successfully enrolled in class!', enrollment: newEnrollment }, { status: 201 });
}
