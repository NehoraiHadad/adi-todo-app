import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types';
import { validateParentChildAccess, validateTeacherClassAccess } from '@/utils/supabase/relationships';

/**
 * Authentication and authorization validation middleware
 * Provides role-based access control and relationship validation
 */

/**
 * Validates user authentication and role
 * @param request - The incoming request
 * @returns User data if authenticated, null if not
 */
export async function validateAuthentication(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: userRole?.role || UserRole.CHILD
    };
  } catch (error) {
    console.error('Error validating authentication:', error);
    return null;
  }
}

/**
 * Validates if user has required role
 * @param user - User object from validateAuthentication
 * @param allowedRoles - Array of allowed roles
 * @returns boolean indicating if user has permission
 */
export function validateRole(
  user: { role: string },
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(user.role as UserRole);
}

/**
 * Validates parent access to child data
 * Used in API routes where parents request child-specific information
 * @param request - The incoming request
 * @param childId - The child ID being accessed
 * @returns boolean indicating if access is allowed
 */
export async function validateParentAccess(
  request: NextRequest,
  childId: string
): Promise<boolean> {
  try {
    const user = await validateAuthentication(request);
    if (!user || user.role !== UserRole.PARENT) {
      return false;
    }

    return await validateParentChildAccess(user.id, childId);
  } catch (error) {
    console.error('Error validating parent access:', error);
    return false;
  }
}

/**
 * Validates teacher access to class data
 * Used in API routes where teachers request class-specific information
 * @param request - The incoming request
 * @param classId - The class ID being accessed
 * @returns boolean indicating if access is allowed
 */
export async function validateTeacherAccess(
  request: NextRequest,
  classId: string
): Promise<boolean> {
  try {
    const user = await validateAuthentication(request);
    if (!user || user.role !== UserRole.TEACHER) {
      return false;
    }

    return await validateTeacherClassAccess(user.id, classId);
  } catch (error) {
    console.error('Error validating teacher access:', error);
    return false;
  }
}

/**
 * Validates child access to their own data
 * Ensures children can only access their own information
 * @param request - The incoming request
 * @param targetUserId - The user ID being accessed
 * @returns boolean indicating if access is allowed
 */
export async function validateChildSelfAccess(
  request: NextRequest,
  targetUserId: string
): Promise<boolean> {
  try {
    const user = await validateAuthentication(request);
    if (!user || user.role !== UserRole.CHILD) {
      return false;
    }

    return user.id === targetUserId;
  } catch (error) {
    console.error('Error validating child self access:', error);
    return false;
  }
}

/**
 * Validates admin access
 * Admins have access to all data
 * @param request - The incoming request
 * @returns boolean indicating if user is admin
 */
export async function validateAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    const user = await validateAuthentication(request);
    return user?.role === UserRole.ADMIN;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

/**
 * Generic authorization validator that checks multiple access patterns
 * @param request - The incoming request
 * @param options - Authorization options
 * @returns boolean indicating if access is allowed
 */
export async function validateAccess(
  request: NextRequest,
  options: {
    /** Required roles for access */
    allowedRoles?: UserRole[];
    /** Child ID for parent validation */
    childId?: string;
    /** Class ID for teacher validation */
    classId?: string;
    /** Target user ID for self-access validation */
    targetUserId?: string;
    /** Allow admin override */
    allowAdmin?: boolean;
  }
): Promise<boolean> {
  try {
    const user = await validateAuthentication(request);
    if (!user) return false;

    // Admin override
    if (options.allowAdmin && user.role === UserRole.ADMIN) {
      return true;
    }

    // Role-based validation
    if (options.allowedRoles) {
      if (!validateRole(user, options.allowedRoles)) {
        return false;
      }
    }

    // Parent-child validation
    if (options.childId && user.role === UserRole.PARENT) {
      return await validateParentChildAccess(user.id, options.childId);
    }

    // Teacher-class validation
    if (options.classId && user.role === UserRole.TEACHER) {
      return await validateTeacherClassAccess(user.id, options.classId);
    }

    // Self-access validation
    if (options.targetUserId) {
      return user.id === options.targetUserId;
    }

    return true;
  } catch (error) {
    console.error('Error validating access:', error);
    return false;
  }
}

/**
 * Creates a standardized unauthorized response
 * @param message - Custom error message
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(message: string = 'Unauthorized access') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Creates a standardized forbidden response
 * @param message - Custom error message
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(message: string = 'Access forbidden') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}