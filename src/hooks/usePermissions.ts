'use client';

import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { useMemo } from 'react';

/**
 * Custom hook for managing user permissions and role-based access control
 * Provides utilities to check user permissions throughout the application
 */
export const usePermissions = () => {
  const { userRole, userWithRelationships, user } = useAuth();

  /**
   * Computed permissions object with various access checks
   */
  const permissions = useMemo(() => {
    return {
      /** Current user's role */
      role: userRole,
      
      /** User ID for reference */
      userId: user?.id,

      /** Check if user is authenticated */
      isAuthenticated: !!user,

      /** Role-based checks */
      isChild: userRole === UserRole.CHILD,
      isParent: userRole === UserRole.PARENT,
      isTeacher: userRole === UserRole.TEACHER,
      isAdmin: userRole === UserRole.ADMIN,

      /** Multi-role checks */
      isEducator: userRole === UserRole.TEACHER || userRole === UserRole.ADMIN,
      isAdult: userRole === UserRole.PARENT || userRole === UserRole.TEACHER || userRole === UserRole.ADMIN,

      /** Relationship-based access */
      hasChildren: userRole === UserRole.PARENT && (userWithRelationships?.children?.length ?? 0) > 0,
      hasParents: userRole === UserRole.CHILD && (userWithRelationships?.parents?.length ?? 0) > 0,
      hasClasses: userRole === UserRole.TEACHER && (userWithRelationships?.classes?.length ?? 0) > 0,

      /** Get children IDs for parent */
      childrenIds: userRole === UserRole.PARENT 
        ? userWithRelationships?.children?.map(child => child.id) || []
        : [],

      /** Get class IDs for teacher */
      classIds: userRole === UserRole.TEACHER 
        ? userWithRelationships?.classes?.map(cls => cls.id) || []
        : [],

      /** Get parent IDs for child */
      parentIds: userRole === UserRole.CHILD 
        ? userWithRelationships?.parents?.map(parent => parent.id) || []
        : [],
    };
  }, [userRole, userWithRelationships, user]);

  /**
   * Check if user can access specific child data
   * @param childId - The child's user ID
   * @returns boolean indicating permission
   */
  const canAccessChild = (childId: string): boolean => {
    if (!permissions.isAuthenticated) return false;
    
    // Admin can access all
    if (permissions.isAdmin) return true;
    
    // Child can access their own data
    if (permissions.isChild && permissions.userId === childId) return true;
    
    // Parent can access their children's data
    if (permissions.isParent && permissions.childrenIds.includes(childId)) return true;
    
    return false;
  };

  /**
   * Check if user can access specific class data
   * @param classId - The class ID
   * @returns boolean indicating permission
   */
  const canAccessClass = (classId: string): boolean => {
    if (!permissions.isAuthenticated) return false;
    
    // Admin can access all
    if (permissions.isAdmin) return true;
    
    // Teacher can access their classes
    if (permissions.isTeacher && permissions.classIds.includes(classId)) return true;
    
    return false;
  };

  /**
   * Check if user can access specific parent data
   * @param parentId - The parent's user ID
   * @returns boolean indicating permission
   */
  const canAccessParent = (parentId: string): boolean => {
    if (!permissions.isAuthenticated) return false;
    
    // Admin can access all
    if (permissions.isAdmin) return true;
    
    // Parent can access their own data
    if (permissions.isParent && permissions.userId === parentId) return true;
    
    // Child can access their parents' data
    if (permissions.isChild && permissions.parentIds.includes(parentId)) return true;
    
    return false;
  };

  /**
   * Check if user can modify specific data
   * @param targetUserId - The target user ID
   * @param requiredRole - Minimum required role
   * @returns boolean indicating permission
   */
  const canModify = (targetUserId?: string, requiredRole?: UserRole): boolean => {
    if (!permissions.isAuthenticated) return false;
    
    // Admin can modify all
    if (permissions.isAdmin) return true;
    
    // Check role requirement
    if (requiredRole) {
      const roleHierarchy = {
        [UserRole.CHILD]: 0,
        [UserRole.PARENT]: 1,
        [UserRole.TEACHER]: 1,
        [UserRole.ADMIN]: 2
      };
      
      const userLevel = roleHierarchy[userRole!];
      const requiredLevel = roleHierarchy[requiredRole];
      
      if (userLevel < requiredLevel) return false;
    }
    
    // Self-modification
    if (targetUserId && permissions.userId === targetUserId) return true;
    
    // Parent can modify their children
    if (targetUserId && permissions.isParent && permissions.childrenIds.includes(targetUserId)) return true;
    
    return false;
  };

  /**
   * Check if user can access admin features
   * @returns boolean indicating admin access
   */
  const canAccessAdmin = (): boolean => {
    return permissions.isAdmin;
  };

  /**
   * Check if user can create new entities
   * @param entityType - Type of entity to create
   * @returns boolean indicating permission
   */
  const canCreate = (entityType: 'class' | 'user' | 'relationship'): boolean => {
    if (!permissions.isAuthenticated) return false;
    
    // Admin can create all
    if (permissions.isAdmin) return true;
    
    switch (entityType) {
      case 'class':
        return permissions.isTeacher || permissions.isAdmin;
      case 'user':
        return permissions.isAdmin;
      case 'relationship':
        return permissions.isParent || permissions.isTeacher || permissions.isAdmin;
      default:
        return false;
    }
  };

  return {
    permissions,
    canAccessChild,
    canAccessClass,
    canAccessParent,
    canModify,
    canAccessAdmin,
    canCreate,
  };
};

/**
 * Type definition for the permissions hook return value
 */
export type UsePermissionsReturn = ReturnType<typeof usePermissions>;