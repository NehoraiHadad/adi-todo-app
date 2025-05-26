// src/app/api/tasks/class/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole, TaskType } from '@/types'; // Import UserRole and TaskType

export async function POST(request: NextRequest) {
  const supabase = await createClient();

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
    return NextResponse.json({ error: 'Forbidden: Only teachers can create class tasks.' }, { status: 403 });
  }

  // 3. Input Validation
  let taskData;
  try {
    taskData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { class_id, title, description, due_date, due_time } = taskData;

  if (!class_id || !title) {
    return NextResponse.json({ error: 'class_id and title are required.' }, { status: 400 });
  }
  if (typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title must be a non-empty string.' }, { status: 400 });
  }
  // Add more validation for due_date, due_time formats if necessary

  // 4. Verify Class Ownership
  const { data: classData, error: classFetchError } = await supabase
    .from('classes')
    .select('id')
    .eq('id', class_id)
    .eq('teacher_id', teacherUser.id) // Ensure teacher owns this class
    .single();

  if (classFetchError || !classData) {
    return NextResponse.json({ error: 'Class not found or you are not the teacher of this class.' }, { status: 404 });
  }

  // 5. Database Insertion
  const taskToInsert = {
    user_id: teacherUser.id, // Teacher is the owner/creator of the class task
    class_id: class_id,
    title: title.trim(),
    description: description?.trim() || null,
    due_date: due_date || null,
    due_time: due_time || null,
    type: TaskType.CLASS,
    is_completed: false,
    is_shared: false, // Not using the old is_shared for class tasks
    // Other fields from Task type can be added here if provided in taskData
  };

  const { data: newTask, error: insertError } = await supabase
    .from('tasks')
    .insert(taskToInsert)
    .select()
    .single();

  if (insertError) {
    console.error('Error creating class task:', insertError.message);
    return NextResponse.json({ error: 'Failed to create class task.' }, { status: 500 });
  }

  return NextResponse.json(newTask, { status: 201 });
}
