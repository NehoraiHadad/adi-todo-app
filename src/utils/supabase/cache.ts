/**
 * Supabase Query Caching Utilities
 * Provides caching mechanisms for frequently accessed data
 */

import { createClient } from '@/utils/supabase/client';

// Simple in-memory cache with TTL
class MemoryCache {
  private cache = new Map<string, { data: unknown; expires: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: unknown, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expires });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cleanup expired entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

// Cache key generators
export const cacheKeys = {
  subjects: () => 'subjects',
  timeSlots: () => 'time_slots',
  userProfile: (userId: string) => `user_profile_${userId}`,
  userRole: (userId: string) => `user_role_${userId}`,
  userSchedule: (userId: string) => `user_schedule_${userId}`,
  userTasks: (userId: string, includeCompleted: boolean = false) => 
    `user_tasks_${userId}_${includeCompleted}`,
  parentChildren: (parentId: string) => `parent_children_${parentId}`,
  userDashboard: (userId: string) => `user_dashboard_${userId}`,
  adminUsers: () => 'admin_users',
  adminStats: () => 'admin_stats',
};

// Cache durations in milliseconds
export const cacheDurations = {
  subjects: 30 * 60 * 1000,      // 30 minutes (rarely changes)
  timeSlots: 30 * 60 * 1000,     // 30 minutes (rarely changes)
  userProfile: 10 * 60 * 1000,   // 10 minutes
  userRole: 15 * 60 * 1000,      // 15 minutes
  userSchedule: 5 * 60 * 1000,   // 5 minutes
  userTasks: 2 * 60 * 1000,      // 2 minutes (frequently updated)
  parentChildren: 10 * 60 * 1000, // 10 minutes
  userDashboard: 3 * 60 * 1000,  // 3 minutes
  adminUsers: 5 * 60 * 1000,     // 5 minutes
  adminStats: 5 * 60 * 1000,     // 5 minutes
};

// Generic cached query function
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cache.get(key) as T;
  if (cached) {
    console.log(`Cache hit for key: ${key}`);
    return cached;
  }

  console.log(`Cache miss for key: ${key}, executing query`);
  
  try {
    const result = await queryFn();
    cache.set(key, result, ttl);
    return result;
  } catch (error) {
    console.error(`Query failed for key: ${key}`, error);
    throw error;
  }
}

// Cached query functions for common operations
export const cachedQueries = {
  subjects: async () => {
    return cachedQuery(
      cacheKeys.subjects(),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name, color, text_color, icon')
          .order('name', { ascending: true });
        
        if (error) throw error;
        return data;
      },
      cacheDurations.subjects
    );
  },

  timeSlots: async () => {
    return cachedQuery(
      cacheKeys.timeSlots(),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('time_slots')
          .select('id, start_time, end_time, slot_index')
          .order('slot_index', { ascending: true });
        
        if (error) throw error;
        return data;
      },
      cacheDurations.timeSlots
    );
  },

  userProfile: async (userId: string) => {
    return cachedQuery(
      cacheKeys.userProfile(userId),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, display_name, username, role, grade, class_id')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        return data;
      },
      cacheDurations.userProfile
    );
  },

  userRole: async (userId: string) => {
    return cachedQuery(
      cacheKeys.userRole(userId),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        return data?.role || 'unknown';
      },
      cacheDurations.userRole
    );
  },

  userSchedule: async (userId: string) => {
    return cachedQuery(
      cacheKeys.userSchedule(userId),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('schedule_with_subjects')
          .select('*')
          .eq('user_id', userId)
          .order('day_of_week', { ascending: true })
          .order('slot_index', { ascending: true });
        
        if (error) throw error;
        return data;
      },
      cacheDurations.userSchedule
    );
  },

  userTasks: async (userId: string, includeCompleted: boolean = false) => {
    return cachedQuery(
      cacheKeys.userTasks(userId, includeCompleted),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_user_tasks_optimized', {
          user_id_param: userId,
          include_completed: includeCompleted
        });
        
        if (error) throw error;
        return data;
      },
      cacheDurations.userTasks
    );
  },

  parentChildren: async (parentId: string) => {
    return cachedQuery(
      cacheKeys.parentChildren(parentId),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_parent_dashboard_data', {
          parent_id_param: parentId
        });
        
        if (error) throw error;
        return data;
      },
      cacheDurations.parentChildren
    );
  },

  userDashboard: async (userId: string) => {
    return cachedQuery(
      cacheKeys.userDashboard(userId),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_user_dashboard_summary', {
          user_id_param: userId
        });
        
        if (error) throw error;
        return data?.[0] || null;
      },
      cacheDurations.userDashboard
    );
  },

  adminUsers: async () => {
    return cachedQuery(
      cacheKeys.adminUsers(),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_users_view')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      },
      cacheDurations.adminUsers
    );
  },

  adminStats: async () => {
    return cachedQuery(
      cacheKeys.adminStats(),
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_admin_user_stats');
        
        if (error) throw error;
        return data?.[0] || null;
      },
      cacheDurations.adminStats
    );
  },
};

// Cache invalidation functions
export const cacheInvalidation = {
  // Invalidate user-specific data
  invalidateUser: (userId: string) => {
    cache.delete(cacheKeys.userProfile(userId));
    cache.delete(cacheKeys.userRole(userId));
    cache.delete(cacheKeys.userSchedule(userId));
    cache.delete(cacheKeys.userTasks(userId, false));
    cache.delete(cacheKeys.userTasks(userId, true));
    cache.delete(cacheKeys.userDashboard(userId));
  },

  // Invalidate parent-specific data
  invalidateParent: (parentId: string) => {
    cache.delete(cacheKeys.parentChildren(parentId));
    cacheInvalidation.invalidateUser(parentId);
  },

  // Invalidate admin data
  invalidateAdmin: () => {
    cache.delete(cacheKeys.adminUsers());
    cache.delete(cacheKeys.adminStats());
  },

  // Invalidate global data
  invalidateGlobal: () => {
    cache.delete(cacheKeys.subjects());
    cache.delete(cacheKeys.timeSlots());
  },

  // Clear all cache
  clearAll: () => {
    cache.clear();
  },
};

// Cache warming functions - preload commonly accessed data
export const cacheWarming = {
  // Warm up global data
  warmGlobal: async () => {
    try {
      await Promise.all([
        cachedQueries.subjects(),
        cachedQueries.timeSlots(),
      ]);
      console.log('Global cache warmed successfully');
    } catch (error) {
      console.error('Failed to warm global cache:', error);
    }
  },

  // Warm up user-specific data
  warmUser: async (userId: string) => {
    try {
      await Promise.all([
        cachedQueries.userProfile(userId),
        cachedQueries.userRole(userId),
        cachedQueries.userSchedule(userId),
        cachedQueries.userTasks(userId),
        cachedQueries.userDashboard(userId),
      ]);
      console.log(`User cache warmed for user: ${userId}`);
    } catch (error) {
      console.error(`Failed to warm user cache for ${userId}:`, error);
    }
  },

  // Warm up admin data
  warmAdmin: async () => {
    try {
      await Promise.all([
        cachedQueries.adminUsers(),
        cachedQueries.adminStats(),
      ]);
      console.log('Admin cache warmed successfully');
    } catch (error) {
      console.error('Failed to warm admin cache:', error);
    }
  },
};

// Cache statistics
export const cacheStats = {
  getStats: () => {
    const stats = {
      totalKeys: cache['cache'].size,
      keys: Array.from(cache['cache'].keys()),
      memory: JSON.stringify(cache['cache']).length,
    };
    return stats;
  },
};

// Initialize cache warming for global data
if (typeof window !== 'undefined') {
  // Client-side cache warming
  cacheWarming.warmGlobal();
}

export { cache };