'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';

/**
 * Props for the PermissionGuard component
 */
interface PermissionGuardProps {
  /** Child components to render if permission is granted */
  children: React.ReactNode;
  /** Component to render if permission is denied */
  fallback?: React.ReactNode;
  /** Required roles for access */
  allowedRoles?: UserRole[];
  /** Specific child ID for parent access validation */
  childId?: string;
  /** Specific class ID for teacher access validation */
  classId?: string;
  /** Target user ID for self-access validation */
  targetUserId?: string;
  /** Allow admin override (default: true) */
  allowAdmin?: boolean;
  /** Custom permission check function */
  customCheck?: () => boolean;
  /** Require authentication (default: true) */
  requireAuth?: boolean;
}

/**
 * Permission guard component that conditionally renders children based on user permissions
 * Provides role-based and relationship-based access control
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  fallback = null,
  allowedRoles,
  childId,
  classId,
  targetUserId,
  allowAdmin = true,
  customCheck,
  requireAuth = true,
}) => {
  const { 
    permissions, 
    canAccessChild, 
    canAccessClass, 
    canAccessParent 
  } = usePermissions();

  /**
   * Performs the permission check based on provided criteria
   * @returns boolean indicating if access should be granted
   */
  const hasPermission = (): boolean => {
    // Check if authentication is required
    if (requireAuth && !permissions.isAuthenticated) {
      return false;
    }

    // Admin override
    if (allowAdmin && permissions.isAdmin) {
      return true;
    }

    // Custom check takes precedence
    if (customCheck) {
      return customCheck();
    }

    // Role-based access check
    if (allowedRoles && allowedRoles.length > 0) {
      if (!permissions.role || !allowedRoles.includes(permissions.role)) {
        return false;
      }
    }

    // Child access validation
    if (childId) {
      return canAccessChild(childId);
    }

    // Class access validation
    if (classId) {
      return canAccessClass(classId);
    }

    // Parent access validation
    if (targetUserId && permissions.isChild) {
      return canAccessParent(targetUserId);
    }

    // Self-access validation
    if (targetUserId) {
      return permissions.userId === targetUserId;
    }

    return true;
  };

  // Render children if permission is granted, otherwise render fallback
  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};

/**
 * Higher-order component that wraps a component with permission checking
 * @param Component - The component to wrap
 * @param permissions - Permission configuration
 * @returns Wrapped component with permission checking
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  permissions: Omit<PermissionGuardProps, 'children'>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PermissionGuard {...permissions}>
      <Component {...props} />
    </PermissionGuard>
  );

  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Specialized permission guards for common use cases
 */

/**
 * Guard for parent-only content
 */
export const ParentGuard: React.FC<Pick<PermissionGuardProps, 'children' | 'fallback' | 'childId'>> = ({
  children,
  fallback,
  childId
}) => (
  <PermissionGuard
    allowedRoles={[UserRole.PARENT]}
    childId={childId}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * Guard for teacher-only content
 */
export const TeacherGuard: React.FC<Pick<PermissionGuardProps, 'children' | 'fallback' | 'classId'>> = ({
  children,
  fallback,
  classId
}) => (
  <PermissionGuard
    allowedRoles={[UserRole.TEACHER]}
    classId={classId}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * Guard for child-only content
 */
export const ChildGuard: React.FC<Pick<PermissionGuardProps, 'children' | 'fallback' | 'targetUserId'>> = ({
  children,
  fallback,
  targetUserId
}) => (
  <PermissionGuard
    allowedRoles={[UserRole.CHILD]}
    targetUserId={targetUserId}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * Guard for admin-only content
 */
export const AdminGuard: React.FC<Pick<PermissionGuardProps, 'children' | 'fallback'>> = ({
  children,
  fallback
}) => (
  <PermissionGuard
    allowedRoles={[UserRole.ADMIN]}
    allowAdmin={false} // Don't allow admin override since this IS admin content
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * Guard for adult users (parents, teachers, admins)
 */
export const AdultGuard: React.FC<Pick<PermissionGuardProps, 'children' | 'fallback'>> = ({
  children,
  fallback
}) => (
  <PermissionGuard
    allowedRoles={[UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN]}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * Guard for educators (teachers and admins)
 */
export const EducatorGuard: React.FC<Pick<PermissionGuardProps, 'children' | 'fallback'>> = ({
  children,
  fallback
}) => (
  <PermissionGuard
    allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);