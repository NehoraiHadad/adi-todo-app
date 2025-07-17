import { NextRequest, NextResponse } from 'next/server';
import { validateAccess, unauthorizedResponse, forbiddenResponse, validateAuthentication } from '@/middleware/auth-validation';
import { UserRole } from '@/types';
import { getClassesForTeacher, getStudentsInClass } from '@/utils/supabase/relationships';

/**
 * GET /api/teacher/classes
 * Retrieves all classes associated with the authenticated teacher
 * 
 * @param request - The incoming request
 * @returns JSON response with classes data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Validate that user is authenticated and has teacher role
    const hasAccess = await validateAccess(request, {
      allowedRoles: [UserRole.TEACHER],
      allowAdmin: true
    });

    if (!hasAccess) {
      return unauthorizedResponse('גישה מורשית למורים בלבד');
    }

    // Get authenticated user
    const user = await validateAuthentication(request);
    if (!user) {
      return unauthorizedResponse('משתמש לא מאומת');
    }

    // Check if specific class details are requested
    const url = new URL(request.url);
    const includeStudents = url.searchParams.get('includeStudents') === 'true';

    // Fetch classes for this teacher
    const classes = await getClassesForTeacher(user.id);

    // If students are requested, fetch them for each class
    if (includeStudents) {
      const classesWithStudents = await Promise.all(
        (classes as unknown as Array<{ classes?: { id: string }; id: string }>).map(async (classItem) => {
          const students = await getStudentsInClass(classItem.classes?.id || classItem.id);
          return {
            ...classItem,
            students
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: classesWithStudents,
        message: 'רשימת הכיתות והתלמידים נטענה בהצלחה'
      });
    }

    return NextResponse.json({
      success: true,
      data: classes,
      message: 'רשימת הכיתות נטענה בהצלחה'
    });

  } catch (error) {
    console.error('Error in GET /api/teacher/classes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בטעינת רשימת הכיתות',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/classes
 * Creates a new class and assigns the teacher to it
 * 
 * @param request - The incoming request with class details
 * @returns JSON response with created class or error
 */
export async function POST(request: NextRequest) {
  try {
    // Validate that user is authenticated and has teacher or admin role
    const hasAccess = await validateAccess(request, {
      allowedRoles: [UserRole.TEACHER, UserRole.ADMIN],
      allowAdmin: true
    });

    if (!hasAccess) {
      return forbiddenResponse('גישה מורשית למורים ומנהלים בלבד');
    }

    // Get authenticated user
    const user = await validateAuthentication(request);
    if (!user) {
      return unauthorizedResponse('משתמש לא מאומת');
    }

    // Parse request body
    const body = await request.json();
    const { name, grade, schoolYear, isPrimary = true } = body;

    if (!name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'שם הכיתה נדרש' 
        },
        { status: 400 }
      );
    }

    // Create the class using the utility function
    const { createClass } = await import('@/utils/supabase/relationships');
    const newClass = await createClass(
      name,
      grade,
      schoolYear,
      isPrimary ? user.id : undefined
    );

    if (!newClass) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'שגיאה ביצירת הכיתה' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newClass,
      message: 'הכיתה נוצרה בהצלחה'
    });

  } catch (error) {
    console.error('Error in POST /api/teacher/classes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה ביצירת הכיתה',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}