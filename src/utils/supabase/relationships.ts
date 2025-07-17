import { createClient } from '@/utils/supabase/client';
import { ParentChildRelationship, TeacherClassRelationship, ClassStudent, Class, UserRole } from '@/types';

/**
 * Database utility functions for managing user relationships
 * Handles parent-child relationships, teacher-class assignments, and class-student enrollments
 */

const supabase = createClient();

/**
 * Creates a new parent-child relationship
 * @param parentId - The UUID of the parent user
 * @param childId - The UUID of the child user  
 * @param relationshipType - Type of relationship ('parent' or 'guardian')
 * @returns Promise resolving to the created relationship or error
 */
export async function createParentChildRelationship(
  parentId: string,
  childId: string,
  relationshipType: 'parent' | 'guardian' = 'parent'
): Promise<ParentChildRelationship | null> {
  try {
    // Verify parent has parent role
    const { data: parentRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', parentId)
      .single();

    if (parentRole?.role !== UserRole.PARENT) {
      throw new Error('User is not a parent');
    }

    // Verify child has child role
    const { data: childRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', childId)
      .single();

    if (childRole?.role !== UserRole.CHILD) {
      throw new Error('User is not a child');
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('parent_child_relationships')
      .select('*')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .single();

    if (existing) {
      throw new Error('Relationship already exists');
    }

    // Create the relationship
    const { data, error } = await supabase
      .from('parent_child_relationships')
      .insert({
        parent_id: parentId,
        child_id: childId,
        relationship_type: relationshipType
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating parent-child relationship:', error);
    return null;
  }
}

/**
 * Gets all children for a specific parent
 * @param parentId - The UUID of the parent user
 * @param supabaseClient - Optional Supabase client instance (defaults to createClient())
 * @returns Promise resolving to array of child profiles
 */
export async function getChildrenForParent(parentId: string, supabaseClient?: ReturnType<typeof createClient>) {
  try {
    const client = supabaseClient || createClient();
    console.log('🔍 DEBUG: Fetching relationships for parent:', parentId);
    
    // Get parent-child relationships first
    const { data: relationships, error: relationshipError } = await client
      .from('parent_child_relationships')
      .select('child_id, relationship_type')
      .eq('parent_id', parentId)
      .eq('is_active', true);

    console.log('🔍 DEBUG: Filtered query result:', { data: relationships, error: relationshipError });

    if (relationshipError) {
      console.error('Error fetching parent-child relationships:', relationshipError);
      throw relationshipError;
    }
    
    // Check if data exists
    if (!relationships || relationships.length === 0) {
      return [];
    }
    
    // Get child IDs
    const childIds = relationships.map(rel => rel.child_id);
    
    // Get child profiles in a separate query
    const { data: children, error: profileError } = await client
      .from('profiles')
      .select('id, display_name, email, username, date_of_birth, grade, class_id, role, is_active')
      .in('id', childIds);

    if (profileError) {
      console.error('Error fetching child profiles:', profileError);
      throw profileError;
    }
    
    return children || [];
  } catch (error) {
    console.error('Error fetching children for parent:', error);
    return [];
  }
}

/**
 * Gets all parents for a specific child
 * @param childId - The UUID of the child user
 * @returns Promise resolving to array of parent profiles
 */
export async function getParentsForChild(childId: string) {
  try {
    // Get parent-child relationships first
    const { data: relationships, error: relationshipError } = await supabase
      .from('parent_child_relationships')
      .select('parent_id, relationship_type')
      .eq('child_id', childId);

    if (relationshipError) throw relationshipError;
    
    // Check if data exists
    if (!relationships || relationships.length === 0) {
      console.log(`No parent relationships found for child: ${childId}`);
      return [];
    }
    
    // Get parent IDs
    const parentIds = relationships.map(rel => rel.parent_id);
    
    // Get parent profiles
    const { data: parents, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, email, username, role, is_active')
      .in('id', parentIds);

    if (profileError) throw profileError;
    
    return parents || [];
  } catch (error) {
    console.error('Error fetching parents for child:', error);
    return [];
  }
}

/**
 * Creates a teacher-class relationship
 * @param teacherId - The UUID of the teacher user
 * @param classId - The UUID of the class
 * @param isPrimary - Whether this teacher is the primary teacher for the class
 * @returns Promise resolving to the created relationship or error
 */
export async function assignTeacherToClass(
  teacherId: string,
  classId: string,
  isPrimary: boolean = false
): Promise<TeacherClassRelationship | null> {
  try {
    // Verify teacher has teacher role
    const { data: teacherRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', teacherId)
      .single();

    if (teacherRole?.role !== UserRole.TEACHER) {
      throw new Error('User is not a teacher');
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('teacher_class_relationships')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .single();

    if (existing) {
      throw new Error('Teacher already assigned to this class');
    }

    // If this is primary teacher, remove primary status from other teachers
    if (isPrimary) {
      await supabase
        .from('teacher_class_relationships')
        .update({ is_primary: false })
        .eq('class_id', classId)
        .eq('is_primary', true);
    }

    // Create the relationship
    const { data, error } = await supabase
      .from('teacher_class_relationships')
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        is_primary: isPrimary
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning teacher to class:', error);
    return null;
  }
}

/**
 * Gets all classes for a specific teacher
 * @param teacherId - The UUID of the teacher user
 * @returns Promise resolving to array of classes
 */
export async function getClassesForTeacher(teacherId: string) {
  try {
    const { data, error } = await supabase
      .from('teacher_class_relationships')
      .select(`
        is_primary,
        classes (
          id,
          name,
          grade,
          school_year,
          teacher_id,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('teacher_id', teacherId);

    if (error) throw error;
    return data?.map(rel => ({ ...rel.classes, is_primary: rel.is_primary })) || [];
  } catch (error) {
    console.error('Error fetching classes for teacher:', error);
    return [];
  }
}

/**
 * Enrolls a student in a class
 * @param studentId - The UUID of the student user
 * @param classId - The UUID of the class
 * @returns Promise resolving to the created enrollment or error
 */
export async function enrollStudentInClass(
  studentId: string,
  classId: string
): Promise<ClassStudent | null> {
  try {
    // Verify student has child role
    const { data: studentRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', studentId)
      .single();

    if (studentRole?.role !== UserRole.CHILD) {
      throw new Error('User is not a student');
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_students')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('is_active', true)
      .single();

    if (existing) {
      throw new Error('Student already enrolled in this class');
    }

    // Create the enrollment
    const { data, error } = await supabase
      .from('class_students')
      .insert({
        student_id: studentId,
        class_id: classId,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update student's class_id in profiles
    await supabase
      .from('profiles')
      .update({ class_id: classId })
      .eq('id', studentId);

    return data;
  } catch (error) {
    console.error('Error enrolling student in class:', error);
    return null;
  }
}

/**
 * Gets all students in a specific class
 * @param classId - The UUID of the class
 * @returns Promise resolving to array of student profiles
 */
export async function getStudentsInClass(classId: string) {
  try {
    const { data, error } = await supabase
      .from('class_students')
      .select(`
        enrolled_at,
        profiles!class_students_student_id_fkey (
          id,
          display_name,
          username,
          date_of_birth,
          grade,
          role,
          is_active
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true);

    if (error) throw error;
    return data?.map(enrollment => ({
      ...enrollment.profiles,
      enrolled_at: enrollment.enrolled_at
    })) || [];
  } catch (error) {
    console.error('Error fetching students in class:', error);
    return [];
  }
}

/**
 * Validates if a parent has access to a specific child
 * @param parentId - The UUID of the parent user
 * @param childId - The UUID of the child user
 * @returns Promise resolving to boolean indicating access permission
 */
export async function validateParentChildAccess(
  parentId: string,
  childId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error validating parent-child access:', error);
    return false;
  }
}

/**
 * Validates if a teacher has access to a specific class
 * @param teacherId - The UUID of the teacher user
 * @param classId - The UUID of the class
 * @returns Promise resolving to boolean indicating access permission
 */
export async function validateTeacherClassAccess(
  teacherId: string,
  classId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('teacher_class_relationships')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error validating teacher-class access:', error);
    return false;
  }
}

/**
 * Creates a new class
 * @param name - The name of the class
 * @param grade - The grade level (optional)
 * @param schoolYear - The school year (optional)
 * @param teacherId - The primary teacher ID (optional)
 * @returns Promise resolving to the created class or error
 */
export async function createClass(
  name: string,
  grade?: string,
  schoolYear?: string,
  teacherId?: string
): Promise<Class | null> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name,
        grade,
        school_year: schoolYear,
        teacher_id: teacherId,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // If primary teacher specified, create the relationship
    if (teacherId) {
      await assignTeacherToClass(teacherId, data.id, true);
    }

    return data;
  } catch (error) {
    console.error('Error creating class:', error);
    return null;
  }
}