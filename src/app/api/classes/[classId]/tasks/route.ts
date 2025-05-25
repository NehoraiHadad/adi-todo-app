// src/app/api/classes/[classId]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole, TaskType } from '@/types';

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

  // 1. Get authenticated teacher user
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
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacherUser.id) // Ensure teacher owns this class
    .single();

  if (classFetchError || !classData) {
    return NextResponse.json({ error: 'Class not found or you are not the teacher of this class.' }, { status: 404 });
  }

  // 4. Fetch tasks for this class created by this teacher
  const { data: tasks, error: tasksFetchError } = await supabase
    .from('tasks')
    .select('*') // Select all task fields
    .eq('class_id', classId)
    .eq('user_id', teacherUser.id) // Tasks created by this teacher
    .eq('type', TaskType.CLASS)    // Specifically class tasks
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (tasksFetchError) {
    console.error('Error fetching class tasks for teacher:', tasksFetchError.message);
    return NextResponse.json({ error: 'Failed to fetch class tasks.' }, { status: 500 });
  }

  return NextResponse.json(tasks || [], { status: 200 });
}
