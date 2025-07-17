/**
 * Supabase Connection Pool Utilities
 * Manages database connections efficiently for optimal performance
 */

import { createClient } from '@supabase/supabase-js';

// Connection pool configuration
interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  reapIntervalMs: number;
}

// Default configuration
const defaultConfig: PoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  acquireTimeoutMs: 30000,
  idleTimeoutMs: 300000, // 5 minutes
  reapIntervalMs: 60000,  // 1 minute
};

// Connection wrapper
interface PooledConnection {
  client: ReturnType<typeof createClient>;
  lastUsed: number;
  inUse: boolean;
  created: number;
}

class ConnectionPool {
  private connections: PooledConnection[] = [];
  private config: PoolConfig;
  private reapInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.init();
  }

  private init() {
    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      this.createConnection();
    }

    // Start reaper for idle connections
    this.reapInterval = setInterval(() => {
      this.reapIdleConnections();
    }, this.config.reapIntervalMs);
  }

  private createConnection(): PooledConnection {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'connection-pool'
          }
        }
      }
    );

    const connection: PooledConnection = {
      client: client as ReturnType<typeof createClient>,
      lastUsed: Date.now(),
      inUse: false,
      created: Date.now()
    };

    this.connections.push(connection);
    return connection;
  }

  private reapIdleConnections() {
    const now = Date.now();
    const toRemove: number[] = [];

    this.connections.forEach((conn, index) => {
      if (!conn.inUse && 
          now - conn.lastUsed > this.config.idleTimeoutMs &&
          this.connections.length > this.config.minConnections) {
        toRemove.push(index);
      }
    });

    // Remove idle connections
    toRemove.reverse().forEach(index => {
      this.connections.splice(index, 1);
    });
  }

  async acquire(): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeoutMs);

      // Find available connection
      let connection = this.connections.find(conn => !conn.inUse);

      if (!connection) {
        // Create new connection if under max limit
        if (this.connections.length < this.config.maxConnections) {
          connection = this.createConnection();
        } else {
          reject(new Error('Max connections reached'));
          return;
        }
      }

      // Mark as in use
      connection.inUse = true;
      connection.lastUsed = Date.now();

      clearTimeout(timeout);
      resolve(connection);
    });
  }

  release(connection: PooledConnection) {
    connection.inUse = false;
    connection.lastUsed = Date.now();
  }

  async execute<T>(
    operation: (client: ReturnType<typeof createClient>) => Promise<T>
  ): Promise<T> {
    const connection = await this.acquire();
    
    try {
      return await operation(connection.client);
    } finally {
      this.release(connection);
    }
  }

  getStats() {
    return {
      total: this.connections.length,
      inUse: this.connections.filter(c => c.inUse).length,
      idle: this.connections.filter(c => !c.inUse).length,
      config: this.config
    };
  }

  destroy() {
    if (this.reapInterval) {
      clearInterval(this.reapInterval);
    }
    this.connections = [];
  }
}

// Global connection pool instance
const connectionPool = new ConnectionPool();

// Enhanced Supabase client with connection pooling
export const createPooledClient = () => {
  return {
    async query<T>(
      operation: (client: ReturnType<typeof createClient>) => Promise<T>
    ): Promise<T> {
      return connectionPool.execute(operation);
    },

    // Batch operations for better performance
    async batch<T>(
      operations: Array<(client: ReturnType<typeof createClient>) => Promise<T>>
    ): Promise<T[]> {
      // Execute operations in parallel using multiple connections
      const promises = operations.map(async (operation) => {
        return connectionPool.execute(operation);
      });

      return Promise.all(promises);
    },

    // Transaction support
    async transaction<T>(
      operations: Array<(client: ReturnType<typeof createClient>) => Promise<unknown>>
    ): Promise<T[]> {
      const connection = await connectionPool.acquire();
      
      try {
        // Execute all operations in sequence using the same connection
        const results: unknown[] = [];
        for (const operation of operations) {
          results.push(await operation(connection.client));
        }
        return results as T[];
      } finally {
        connectionPool.release(connection);
      }
    },

    getStats: () => connectionPool.getStats(),
    destroy: () => connectionPool.destroy()
  };
};

// Optimized query functions using connection pooling
export const pooledQueries = {
  // Subjects with connection pooling
  subjects: async () => {
    const pooledClient = createPooledClient();
    return pooledClient.query(async (client) => {
      const { data, error } = await client
        .from('subjects')
        .select('id, name, color, text_color, icon')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    });
  },

  // User profile with connection pooling
  userProfile: async (userId: string) => {
    const pooledClient = createPooledClient();
    return pooledClient.query(async (client) => {
      const { data, error } = await client
        .from('profiles')
        .select('id, email, display_name, username, role, grade, class_id')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    });
  },

  // User role with connection pooling
  userRole: async (userId: string) => {
    const pooledClient = createPooledClient();
    return pooledClient.query(async (client) => {
      const { data, error } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data?.role || 'unknown';
    });
  },

  // Batch user data fetching
  userBatch: async (userId: string) => {
    const pooledClient = createPooledClient();
    return pooledClient.batch([
      // Profile
      async (client) => {
        const { data, error } = await client
          .from('profiles')
          .select('id, email, display_name, username, role, grade, class_id')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        return data;
      },
      // Role
      async (client) => {
        const { data, error } = await client
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        return data?.role || 'unknown';
      },
      // Tasks
      async (client) => {
        const { data, error } = await client
          .from('tasks')
          .select('id, title, due_date, is_completed')
          .eq('user_id', userId)
          .order('due_date', { ascending: true });
        
        if (error) throw error;
        return data;
      },
      // Schedule
      async (client) => {
        const { data, error } = await client
          .from('schedules')
          .select('day_of_week, slot_index, subject')
          .eq('user_id', userId)
          .order('day_of_week', { ascending: true });
        
        if (error) throw error;
        return data;
      }
    ]);
  },

  // Admin users with connection pooling
  adminUsers: async () => {
    const pooledClient = createPooledClient();
    return pooledClient.query(async (client) => {
      const { data, error } = await client
        .from('admin_users_view')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    });
  },

  // Parent dashboard data with connection pooling
  parentDashboard: async (parentId: string) => {
    const pooledClient = createPooledClient();
    return pooledClient.query(async (client) => {
      const { data, error } = await client.rpc('get_parent_dashboard_data', {
        parent_id_param: parentId
      });
      
      if (error) throw error;
      return data;
    });
  },
};

// Connection pool health check
export const poolHealthCheck = {
  async checkHealth(): Promise<boolean> {
    try {
      const pooledClient = createPooledClient();
      await pooledClient.query(async (client) => {
        const { data, error } = await client
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        return data;
      });
      return true;
    } catch (error) {
      console.error('Pool health check failed:', error);
      return false;
    }
  },

  getDetailedStats() {
    return {
      ...connectionPool.getStats(),
      isHealthy: this.checkHealth(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
};

// Cleanup on process exit
process.on('SIGINT', () => {
  connectionPool.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  connectionPool.destroy();
  process.exit(0);
});

export { connectionPool };