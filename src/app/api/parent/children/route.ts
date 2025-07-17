import { NextRequest, NextResponse } from 'next/server';
import { validateAccess, unauthorizedResponse, forbiddenResponse, validateAuthentication } from '@/middleware/auth-validation';
import { UserRole } from '@/types';
import { getChildrenForParent } from '@/utils/supabase/relationships';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/parent/children
 * Retrieves all children associated with the authenticated parent
 * 
 * @param request - The incoming request
 * @returns JSON response with children data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Validate that user is authenticated and has parent role
    const hasAccess = await validateAccess(request, {
      allowedRoles: [UserRole.PARENT],
      allowAdmin: true
    });
    
    if (!hasAccess) {
      return unauthorizedResponse('גישה מורשית להורים בלבד');
    }

    // Get authenticated user
    const user = await validateAuthentication(request);
    
    if (!user) {
      return unauthorizedResponse('משתמש לא מאומת');
    }

    // Create server Supabase client
    const supabase = await createClient();
    
    // Fetch children for this parent
    const children = await getChildrenForParent(user.id, supabase);

    return NextResponse.json({
      success: true,
      data: children,
      message: 'רשימת הילדים נטענה בהצלחה'
    });

  } catch (error) {
    console.error('Error in GET /api/parent/children:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בטעינת רשימת הילדים',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/parent/children
 * Creates a new parent-child relationship
 * 
 * @param request - The incoming request with child details
 * @returns JSON response with created relationship or error
 */
export async function POST(request: NextRequest) {
  try {
    // Validate that user is authenticated and has parent role
    const hasAccess = await validateAccess(request, {
      allowedRoles: [UserRole.PARENT, UserRole.ADMIN],
      allowAdmin: true
    });

    if (!hasAccess) {
      return forbiddenResponse('גישה מורשית להורים ומנהלים בלבד');
    }

    // Get authenticated user
    const user = await validateAuthentication(request);
    if (!user) {
      return unauthorizedResponse('משתמש לא מאומת');
    }

    // Parse request body
    const body = await request.json();
    const { childId, relationshipType = 'parent' } = body;

    if (!childId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'מזהה ילד נדרש' 
        },
        { status: 400 }
      );
    }

    // Create the relationship using the utility function
    const { createParentChildRelationship } = await import('@/utils/supabase/relationships');
    const relationship = await createParentChildRelationship(
      user.id, 
      childId, 
      relationshipType
    );

    if (!relationship) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'שגיאה ביצירת הקשר הורה-ילד' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: relationship,
      message: 'הקשר הורה-ילד נוצר בהצלחה'
    });

  } catch (error) {
    console.error('Error in POST /api/parent/children:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה ביצירת הקשר הורה-ילד',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}