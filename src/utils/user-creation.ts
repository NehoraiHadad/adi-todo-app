import { UserRole } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { getServiceSupabase } from '@/utils/supabase/service-client';

/**
 * Helper functions for creating users with consistent role assignments
 * across both profiles and user_roles tables
 */

export interface CreateUserData {
  email: string;
  display_name: string;
  username?: string;
  role: UserRole;
  password?: string;
  parent_id?: string; // For child users
}

export interface CreateUserResult {
  success: boolean;
  user_id?: string;
  password?: string;
  error?: string;
}

/**
 * Creates a new user with consistent role assignment across all tables
 * This function ensures that both profiles and user_roles tables are updated
 * 
 * @param userData - User data including role information
 * @param isAdminCreated - Whether this is created by admin (bypasses email confirmation)
 * @returns Promise with creation result
 */
export async function createUserWithRole(
  userData: CreateUserData,
  isAdminCreated: boolean = false
): Promise<CreateUserResult> {
  const { email, display_name, username, role, password, parent_id } = userData;
  
  try {
    let authData: { user: { id: string; email: string | undefined } | null; error: unknown | null };
    let generatedPassword = password;
    
    if (isAdminCreated) {
      // Admin creation - use service client to bypass email confirmation
      const serviceSupabase = getServiceSupabase();
      
      // Generate password if not provided
      if (!generatedPassword) {
        generatedPassword = role === UserRole.CHILD 
          ? generateChildFriendlyPassword(username || display_name.split(' ')[0] || 'user')
          : generateSecurePassword();
      }
      
      const { data, error } = await serviceSupabase.auth.admin.createUser({
        email: email,
        password: generatedPassword,
        user_metadata: {
          display_name: display_name,
          username: username
        },
        email_confirm: true
      });
      
      if (error) throw error;
      authData = { user: { id: data.user.id, email: data.user.email || undefined }, error: null };
    } else {
      // Regular signup - requires email confirmation
      const supabase = createClient();
      
      if (!password) {
        throw new Error('Password is required for regular signup');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: display_name,
            username: username
          }
        }
      });
      
      if (error) throw error;
      authData = { user: data.user ? { id: data.user.id, email: data.user.email || undefined } : null, error: null };
    }
    
    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }
    
    const user_id = authData.user.id;
    const supabase = isAdminCreated ? getServiceSupabase() : createClient();
    
    // Create profile with role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user_id,
        email: email,
        display_name: display_name,
        username: username,
        role: role
      });
    
    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    
    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user_id,
        role: role
      });
    
    if (roleError) {
      throw new Error(`Role creation failed: ${roleError.message}`);
    }
    
    // Create parent-child relationship if this is a child user
    if (role === UserRole.CHILD && parent_id) {
      const { error: relationshipError } = await supabase
        .from('parent_child_relationships')
        .insert({
          parent_id: parent_id,
          child_id: user_id,
          relationship_type: 'parent',
          is_active: true
        });
      
      if (relationshipError) {
        console.error('Failed to create parent-child relationship:', relationshipError);
        // Don't throw here - user creation succeeded, relationship can be added later
      }
    }
    
    return {
      success: true,
      user_id: user_id,
      password: generatedPassword
    };
    
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Ensures user role consistency across both tables
 * Fixes cases where roles might be mismatched
 * 
 * @param user_id - The user ID to fix
 * @param correct_role - The correct role to set
 */
export async function fixUserRoleConsistency(
  user_id: string,
  correct_role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceSupabase = getServiceSupabase();
    
    // Update profile role
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .update({ role: correct_role })
      .eq('id', user_id);
    
    if (profileError) {
      throw new Error(`Profile update failed: ${profileError.message}`);
    }
    
    // Update user role (upsert in case it doesn't exist)
    const { error: roleError } = await serviceSupabase
      .from('user_roles')
      .upsert({
        user_id: user_id,
        role: correct_role
      });
    
    if (roleError) {
      throw new Error(`Role update failed: ${roleError.message}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error fixing user role consistency:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generates a child-friendly password
 * Format: username + 3 random digits (minimum 6 characters)
 */
function generateChildFriendlyPassword(username: string): string {
  const baseUsername = username.slice(0, 8); // Limit username part
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const password = baseUsername + randomDigits;
  
  // Ensure minimum length
  return password.length >= 6 ? password : password + '123';
}

/**
 * Generates a secure password for adult users
 * 12 characters with mixed case, numbers, and symbols
 */
function generateSecurePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}