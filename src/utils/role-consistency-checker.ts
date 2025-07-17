import { UserRole } from '@/types';
import { getServiceSupabase } from '@/utils/supabase/service-client';

/**
 * Utility for checking and fixing role consistency across profiles and user_roles tables
 */

export interface RoleInconsistency {
  user_id: string;
  email: string;
  display_name: string;
  profile_role: UserRole | null;
  user_role: UserRole | null;
  issue_type: 'missing_user_role' | 'missing_profile_role' | 'role_mismatch';
}

export interface ConsistencyReport {
  total_users: number;
  consistent_users: number;
  inconsistent_users: number;
  issues: RoleInconsistency[];
}

/**
 * Checks role consistency across all users
 * @returns Promise with consistency report
 */
export async function checkRoleConsistency(): Promise<ConsistencyReport> {
  const serviceSupabase = getServiceSupabase();
  
  try {
    // Get all users with their roles from both tables
    const { data: users, error } = await serviceSupabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        role,
        user_roles (
          role
        )
      `);
    
    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
    
    const issues: RoleInconsistency[] = [];
    let consistentUsers = 0;
    
    for (const user of users || []) {
      const typedUser = user as unknown as { 
        id: string; 
        email: string; 
        display_name: string; 
        role: string;
        user_roles?: { role: string }[] 
      };
      const profile_role = typedUser.role as UserRole;
      const user_role = typedUser.user_roles?.[0]?.role as UserRole;
      
      // Check for missing user_role
      if (!user_role) {
        issues.push({
          user_id: typedUser.id,
          email: typedUser.email,
          display_name: typedUser.display_name,
          profile_role: profile_role,
          user_role: null,
          issue_type: 'missing_user_role'
        });
        continue;
      }
      
      // Check for missing profile_role
      if (!profile_role) {
        issues.push({
          user_id: typedUser.id,
          email: typedUser.email,
          display_name: typedUser.display_name,
          profile_role: null,
          user_role: user_role,
          issue_type: 'missing_profile_role'
        });
        continue;
      }
      
      // Check for role mismatch
      if (profile_role !== user_role) {
        issues.push({
          user_id: typedUser.id,
          email: typedUser.email,
          display_name: typedUser.display_name,
          profile_role: profile_role,
          user_role: user_role,
          issue_type: 'role_mismatch'
        });
        continue;
      }
      
      // User is consistent
      consistentUsers++;
    }
    
    return {
      total_users: users?.length || 0,
      consistent_users: consistentUsers,
      inconsistent_users: issues.length,
      issues: issues
    };
    
  } catch (error) {
    console.error('Error checking role consistency:', error);
    throw error;
  }
}

/**
 * Fixes role inconsistencies for a specific user
 * @param user_id - The user ID to fix
 * @param preferred_role - The role to use (if null, will use user_roles.role as source of truth)
 * @returns Promise with success status
 */
export async function fixUserRoleInconsistency(
  user_id: string,
  preferred_role?: UserRole
): Promise<{ success: boolean; error?: string }> {
  const serviceSupabase = getServiceSupabase();
  
  try {
    // Get current user data
    const { data: user, error: fetchError } = await serviceSupabase
      .from('profiles')
      .select(`
        id,
        role,
        user_roles (
          role
        )
      `)
      .eq('id', user_id)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch user: ${fetchError.message}`);
    }
    
    const typedUser = user as unknown as { 
      id: string; 
      email: string; 
      display_name: string; 
      role: string;
      user_roles?: { role: string }[] 
    };
    const profile_role = typedUser.role as UserRole;
    const user_role = typedUser.user_roles?.[0]?.role as UserRole;
    
    // Determine the correct role to use
    let correct_role: UserRole;
    if (preferred_role) {
      correct_role = preferred_role;
    } else if (user_role) {
      // Use user_roles as source of truth
      correct_role = user_role;
    } else if (profile_role) {
      // Use profile role as fallback
      correct_role = profile_role;
    } else {
      // Default to child if no role found
      correct_role = UserRole.CHILD;
    }
    
    // Update profile role if needed
    if (profile_role !== correct_role) {
      const { error: profileError } = await serviceSupabase
        .from('profiles')
        .update({ role: correct_role })
        .eq('id', user_id);
      
      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }
    }
    
    // Update or create user role if needed
    if (user_role !== correct_role) {
      const { error: roleError } = await serviceSupabase
        .from('user_roles')
        .upsert({
          user_id: user_id,
          role: correct_role
        });
      
      if (roleError) {
        throw new Error(`Role update failed: ${roleError.message}`);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error fixing user role inconsistency:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Fixes all role inconsistencies found in the system
 * @param use_user_roles_as_source - If true, uses user_roles as source of truth, otherwise uses profiles
 * @returns Promise with results
 */
export async function fixAllRoleInconsistencies(
  use_user_roles_as_source: boolean = true
): Promise<{
  success: boolean;
  fixed_count: number;
  failed_count: number;
  errors: string[];
}> {
  try {
    const report = await checkRoleConsistency();
    
    if (report.inconsistent_users === 0) {
      return {
        success: true,
        fixed_count: 0,
        failed_count: 0,
        errors: []
      };
    }
    
    let fixedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    for (const issue of report.issues) {
      // Determine preferred role based on strategy
      let preferred_role: UserRole | undefined;
      
      if (use_user_roles_as_source && issue.user_role) {
        preferred_role = issue.user_role;
      } else if (!use_user_roles_as_source && issue.profile_role) {
        preferred_role = issue.profile_role;
      } else if (issue.user_role) {
        preferred_role = issue.user_role;
      } else if (issue.profile_role) {
        preferred_role = issue.profile_role;
      }
      
      const result = await fixUserRoleInconsistency(issue.user_id, preferred_role);
      
      if (result.success) {
        fixedCount++;
      } else {
        failedCount++;
        errors.push(`${issue.email}: ${result.error}`);
      }
    }
    
    return {
      success: failedCount === 0,
      fixed_count: fixedCount,
      failed_count: failedCount,
      errors: errors
    };
    
  } catch (error) {
    console.error('Error fixing all role inconsistencies:', error);
    return {
      success: false,
      fixed_count: 0,
      failed_count: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}

/**
 * Ensures a user has the correct role and creates parent-child relationships if needed
 * @param user_id - The user ID
 * @param role - The role to assign
 * @param parent_id - Parent ID if this is a child user
 */
export async function ensureUserRoleAndRelationships(
  user_id: string,
  role: UserRole,
  parent_id?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First fix the role consistency
    const roleResult = await fixUserRoleInconsistency(user_id, role);
    
    if (!roleResult.success) {
      return roleResult;
    }
    
    // Create parent-child relationship if this is a child user
    if (role === UserRole.CHILD && parent_id) {
      const serviceSupabase = getServiceSupabase();
      
      // Check if relationship already exists
      const { data: existingRelationship } = await serviceSupabase
        .from('parent_child_relationships')
        .select('id')
        .eq('parent_id', parent_id)
        .eq('child_id', user_id)
        .eq('is_active', true)
        .single();
      
      if (!existingRelationship) {
        const { error: relationshipError } = await serviceSupabase
          .from('parent_child_relationships')
          .insert({
            parent_id: parent_id,
            child_id: user_id,
            relationship_type: 'parent',
            is_active: true
          });
        
        if (relationshipError) {
          return {
            success: false,
            error: `Failed to create parent-child relationship: ${relationshipError.message}`
          };
        }
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error ensuring user role and relationships:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}