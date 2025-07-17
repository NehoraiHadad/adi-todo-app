import { NextRequest, NextResponse } from 'next/server';
import { validateAccess, unauthorizedResponse, validateAuthentication } from '@/middleware/auth-validation';
import { UserRole } from '@/types';
import { getParentsForChild } from '@/utils/supabase/relationships';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/child/profile
 * Retrieves the authenticated child's profile and related information
 * 
 * @param request - The incoming request
 * @returns JSON response with profile data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Validate that user is authenticated and has child role
    const hasAccess = await validateAccess(request, {
      allowedRoles: [UserRole.CHILD],
      allowAdmin: true
    });

    if (!hasAccess) {
      return unauthorizedResponse('גישה מורשית לתלמידים בלבד');
    }

    // Get authenticated user
    const user = await validateAuthentication(request);
    if (!user) {
      return unauthorizedResponse('משתמש לא מאומת');
    }

    const supabase = await createClient();
    
    // Get child's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get child's parents
    const parents = await getParentsForChild(user.id);

    // Get child's class information if they have one
    let classInfo = null;
    if (profile.class_id) {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', profile.class_id)
        .single();

      if (!classError && classData) {
        classInfo = classData;
      }
    }

    // Get recent tasks for this child
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent moods for this child
    const { data: recentMoods } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        parents,
        class: classInfo,
        recentTasks: recentTasks || [],
        recentMoods: recentMoods || []
      },
      message: 'פרופיל התלמיד נטען בהצלחה'
    });

  } catch (error) {
    console.error('Error in GET /api/child/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בטעינת פרופיל התלמיד',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/child/profile
 * Updates the authenticated child's profile information
 * 
 * @param request - The incoming request with updated profile data
 * @returns JSON response with updated profile or error
 */
export async function PATCH(request: NextRequest) {
  try {
    // Validate that user is authenticated and has child role or is a parent of this child
    const user = await validateAuthentication(request);
    if (!user) {
      return unauthorizedResponse('משתמש לא מאומת');
    }

    // Parse request body
    const body = await request.json();
    const { targetUserId, ...updateData } = body;

    // If targetUserId is provided, validate parent access
    if (targetUserId && targetUserId !== user.id) {
      const hasParentAccess = await validateAccess(request, {
        allowedRoles: [UserRole.PARENT],
        childId: targetUserId,
        allowAdmin: true
      });

      if (!hasParentAccess) {
        return unauthorizedResponse('אין הרשאה לעדכן פרופיל זה');
      }
    }

    const userIdToUpdate = targetUserId || user.id;

    // Validate that the target user is a child
    const childAccess = await validateAccess(request, {
      allowedRoles: [UserRole.CHILD, UserRole.PARENT, UserRole.ADMIN],
      targetUserId: userIdToUpdate,
      allowAdmin: true
    });

    if (!childAccess) {
      return unauthorizedResponse('גישה מורשית לעדכון פרופיל תלמיד');
    }

    const supabase = await createClient();

    // Remove fields that shouldn't be updated directly
    const { id, role, created_at, ...safeUpdateData } = updateData;
    // Explicitly ignore unused variables
    void id; void role; void created_at;

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...safeUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userIdToUpdate)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'פרופיל התלמיד עודכן בהצלחה'
    });

  } catch (error) {
    console.error('Error in PATCH /api/child/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בעדכון פרופיל התלמיד',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}