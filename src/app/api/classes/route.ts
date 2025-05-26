// src/app/api/classes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types';

// Helper function generateClassCode (already defined in the file from POST)
function generateClassCode(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// GET Handler for fetching teacher's classes
export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify user role is TEACHER
  const { data: userRoleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', UserRole.TEACHER)
    .maybeSingle(); // Use maybeSingle as admin might also access or non-teacher calls

  if (roleError) {
    console.error("Error fetching user role:", roleError.message);
    return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
  }
  
  if (!userRoleData) { // If user is not a teacher (or not found in user_roles with teacher role)
    return NextResponse.json({ error: 'Forbidden: Only teachers can view their classes this way.' }, { status: 403 });
  }

  // 3. Fetch classes for this teacher
  const { data: classes, error: fetchError } = await supabase
    .from('classes')
    .select('id, name, class_code, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching classes:', fetchError.message);
    return NextResponse.json({ error: 'Failed to fetch classes.' }, { status: 500 });
  }

  return NextResponse.json(classes || [], { status: 200 });
}

// POST Handler for creating a class (already implemented from previous step)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify user role is TEACHER
  const { data: userRoleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', UserRole.TEACHER) 
    .single();

  if (roleError || !userRoleData) {
    return NextResponse.json({ error: 'Forbidden: Only teachers can create classes.' }, { status: 403 });
  }

  // 3. Get class name from request body
  let className: string;
  try {
    const body = await request.json();
    className = body.name;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!className || typeof className !== 'string' || className.trim().length === 0) {
    return NextResponse.json({ error: 'Class name is required and must be a non-empty string.' }, { status: 400 });
  }

  // 4. Generate unique class code
  let classCode = '';
  let attempts = 0;
  const maxAttempts = 5; 

  while (attempts < maxAttempts) {
    classCode = generateClassCode();
    const { data: existingClass, error: codeCheckError } = await supabase
      .from('classes')
      .select('id')
      .eq('class_code', classCode)
      .maybeSingle();

    if (codeCheckError) {
      console.error('Error checking class code uniqueness:', codeCheckError.message);
      return NextResponse.json({ error: 'Failed to verify class code uniqueness.' }, { status: 500 });
    }
    if (!existingClass) {
      break; 
    }
    attempts++;
  }

  if (attempts === maxAttempts) {
    return NextResponse.json({ error: 'Failed to generate a unique class code after multiple attempts.' }, { status: 500 });
  }

  // 5. Insert new class
  const { data: newClass, error: insertError } = await supabase
    .from('classes')
    .insert({
      teacher_id: user.id,
      name: className.trim(),
      class_code: classCode,
    })
    .select() 
    .single();

  if (insertError) {
    console.error('Error creating class:', insertError.message);
    if (insertError.code === '23505') { 
        return NextResponse.json({ error: 'Failed to create class due to a class code conflict. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create class.' }, { status: 500 });
  }

  // 6. Return success
  return NextResponse.json({ message: 'Class created successfully', class: newClass }, { status: 201 });
}
