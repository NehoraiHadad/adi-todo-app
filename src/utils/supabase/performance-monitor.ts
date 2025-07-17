/**
 * Performance Monitoring System for Supabase Operations
 * Tracks query performance, connection health, and system metrics
 */

import { cacheStats } from './cache';
import { poolHealthCheck } from './connection-pool';
import { optimizedRealtime } from './realtime-optimized';

// Performance metric types
interface QueryMetric {
  queryId: string;
  table: string;
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  cacheHit?: boolean;
  connectionPoolUsed?: boolean;
}

interface SystemMetric {
  timestamp: number;
  memoryUsage: NodeJS.MemoryUsage;
  cacheStats: Record<string, unknown>;
  connectionPoolStats: Record<string, unknown>;
  realtimeStats: Record<string, unknown>;
}

interface PerformanceAlert {
  id: string;
  type: 'slow_query' | 'high_error_rate' | 'cache_miss_rate' | 'connection_pool_exhausted';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  data?: Record<string, unknown>;
}

// Performance monitoring configuration
const MONITORING_CONFIG = {
  slowQueryThreshold: 1000, // 1 second
  highErrorRateThreshold: 0.1, // 10%
  cacheMissRateThreshold: 0.8, // 80%
  connectionPoolExhaustedThreshold: 0.9, // 90%
  alertCooldown: 300000, // 5 minutes
  maxMetricsHistory: 1000,
  metricsRetentionMs: 3600000, // 1 hour
};

class PerformanceMonitor {
  private queryMetrics: QueryMetric[] = [];
  private systemMetrics: SystemMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private alertCooldowns = new Map<string, number>();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  // Start performance monitoring
  private startMonitoring() {
    // Collect system metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.analyzePerformance();
      this.cleanupOldMetrics();
    }, 30000);
  }

  // Track query performance
  trackQuery(
    queryId: string,
    table: string,
    operation: string,
    startTime: number,
    success: boolean,
    error?: string,
    cacheHit?: boolean,
    connectionPoolUsed?: boolean
  ) {
    const duration = Date.now() - startTime;
    
    const metric: QueryMetric = {
      queryId,
      table,
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
      cacheHit,
      connectionPoolUsed
    };

    this.queryMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.queryMetrics.length > MONITORING_CONFIG.maxMetricsHistory) {
      this.queryMetrics.shift();
    }

    // Check for slow queries
    if (duration > MONITORING_CONFIG.slowQueryThreshold) {
      this.createAlert('slow_query', `Slow query detected: ${queryId} took ${duration}ms`, 'medium', {
        queryId,
        table,
        operation,
        duration
      });
    }
  }

  // Collect system metrics
  private collectSystemMetrics() {
    const systemMetric: SystemMetric = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      cacheStats: cacheStats.getStats(),
      connectionPoolStats: poolHealthCheck.getDetailedStats(),
      realtimeStats: optimizedRealtime.getStats()
    };

    this.systemMetrics.push(systemMetric);
    
    // Keep only recent metrics
    if (this.systemMetrics.length > MONITORING_CONFIG.maxMetricsHistory) {
      this.systemMetrics.shift();
    }
  }

  // Analyze performance and create alerts
  private analyzePerformance() {
    const recentMetrics = this.getRecentQueryMetrics(300000); // Last 5 minutes
    
    if (recentMetrics.length === 0) return;

    // Check error rate
    const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length;
    if (errorRate > MONITORING_CONFIG.highErrorRateThreshold) {
      this.createAlert('high_error_rate', `High error rate detected: ${(errorRate * 100).toFixed(1)}%`, 'high', {
        errorRate,
        totalQueries: recentMetrics.length,
        errors: recentMetrics.filter(m => !m.success).length
      });
    }

    // Check cache miss rate
    const cacheEligibleQueries = recentMetrics.filter(m => m.cacheHit !== undefined);
    if (cacheEligibleQueries.length > 0) {
      const cacheMissRate = cacheEligibleQueries.filter(m => !m.cacheHit).length / cacheEligibleQueries.length;
      if (cacheMissRate > MONITORING_CONFIG.cacheMissRateThreshold) {
        this.createAlert('cache_miss_rate', `High cache miss rate: ${(cacheMissRate * 100).toFixed(1)}%`, 'medium', {
          cacheMissRate,
          totalCacheableQueries: cacheEligibleQueries.length
        });
      }
    }

    // Check connection pool usage
    const latestSystemMetric = this.systemMetrics[this.systemMetrics.length - 1];
    if (latestSystemMetric?.connectionPoolStats) {
      const poolStats = latestSystemMetric.connectionPoolStats as { inUse: number; total: number };
      const poolUsage = poolStats.inUse / poolStats.total;
      if (poolUsage > MONITORING_CONFIG.connectionPoolExhaustedThreshold) {
        this.createAlert('connection_pool_exhausted', `Connection pool nearly exhausted: ${(poolUsage * 100).toFixed(1)}%`, 'critical', {
          poolUsage,
          inUse: poolStats.inUse,
          total: poolStats.total
        });
      }
    }
  }

  // Create performance alert
  private createAlert(
    type: PerformanceAlert['type'],
    message: string,
    severity: PerformanceAlert['severity'],
    data?: Record<string, unknown>
  ) {
    const alertKey = `${type}_${severity}`;
    const now = Date.now();
    
    // Check cooldown
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlert = this.alertCooldowns.get(alertKey)!;
      if (now - lastAlert < MONITORING_CONFIG.alertCooldown) {
        return; // Skip alert due to cooldown
      }
    }

    const alert: PerformanceAlert = {
      id: `${type}_${now}`,
      type,
      message,
      severity,
      timestamp: now,
      data
    };

    this.alerts.push(alert);
    this.alertCooldowns.set(alertKey, now);
    
    // Log alert
    console.warn('Performance Alert:', alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  // Get recent query metrics
  private getRecentQueryMetrics(timeRangeMs: number): QueryMetric[] {
    const cutoff = Date.now() - timeRangeMs;
    return this.queryMetrics.filter(m => m.timestamp > cutoff);
  }

  // Clean up old metrics
  private cleanupOldMetrics() {
    const cutoff = Date.now() - MONITORING_CONFIG.metricsRetentionMs;
    
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp > cutoff);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  // Get performance statistics
  getStats(timeRangeMs: number = 300000) {
    const recentQueries = this.getRecentQueryMetrics(timeRangeMs);
    const latestSystemMetric = this.systemMetrics[this.systemMetrics.length - 1];
    
    const stats = {
      queries: {
        total: recentQueries.length,
        successful: recentQueries.filter(q => q.success).length,
        errors: recentQueries.filter(q => !q.success).length,
        errorRate: recentQueries.length > 0 ? recentQueries.filter(q => !q.success).length / recentQueries.length : 0,
        averageDuration: recentQueries.length > 0 ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length : 0,
        slowQueries: recentQueries.filter(q => q.duration > MONITORING_CONFIG.slowQueryThreshold).length
      },
      cache: {
        hits: recentQueries.filter(q => q.cacheHit === true).length,
        misses: recentQueries.filter(q => q.cacheHit === false).length,
        hitRate: recentQueries.filter(q => q.cacheHit !== undefined).length > 0 
          ? recentQueries.filter(q => q.cacheHit === true).length / recentQueries.filter(q => q.cacheHit !== undefined).length 
          : 0,
        stats: latestSystemMetric?.cacheStats || {}
      },
      connectionPool: latestSystemMetric?.connectionPoolStats || {},
      realtime: latestSystemMetric?.realtimeStats || {},
      memory: latestSystemMetric?.memoryUsage || {},
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        high: this.alerts.filter(a => a.severity === 'high').length,
        medium: this.alerts.filter(a => a.severity === 'medium').length,
        low: this.alerts.filter(a => a.severity === 'low').length,
        recent: this.alerts.filter(a => a.timestamp > Date.now() - timeRangeMs)
      }
    };

    return stats;
  }

  // Get detailed performance report
  getPerformanceReport(timeRangeMs: number = 3600000) {
    const recentQueries = this.getRecentQueryMetrics(timeRangeMs);
    
    // Group by table
    const tableStats = recentQueries.reduce((acc, query) => {
      if (!acc[query.table]) {
        acc[query.table] = {
          total: 0,
          successful: 0,
          errors: 0,
          totalDuration: 0,
          slowQueries: 0
        };
      }
      
      acc[query.table].total++;
      if (query.success) acc[query.table].successful++;
      else acc[query.table].errors++;
      acc[query.table].totalDuration += query.duration;
      if (query.duration > MONITORING_CONFIG.slowQueryThreshold) {
        acc[query.table].slowQueries++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; successful: number; errors: number; totalDuration: number; slowQueries: number; averageDuration?: number; errorRate?: number; slowQueryRate?: number }>);

    // Calculate averages
    Object.keys(tableStats).forEach(table => {
      const stats = tableStats[table];
      stats.averageDuration = stats.totalDuration / stats.total;
      stats.errorRate = stats.errors / stats.total;
      stats.slowQueryRate = stats.slowQueries / stats.total;
    });

    // Group by operation
    const operationStats = recentQueries.reduce((acc, query) => {
      if (!acc[query.operation]) {
        acc[query.operation] = {
          total: 0,
          successful: 0,
          errors: 0,
          totalDuration: 0,
          slowQueries: 0
        };
      }
      
      acc[query.operation].total++;
      if (query.success) acc[query.operation].successful++;
      else acc[query.operation].errors++;
      acc[query.operation].totalDuration += query.duration;
      if (query.duration > MONITORING_CONFIG.slowQueryThreshold) {
        acc[query.operation].slowQueries++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; successful: number; errors: number; totalDuration: number; slowQueries: number; averageDuration?: number; errorRate?: number; slowQueryRate?: number }>);

    // Calculate averages
    Object.keys(operationStats).forEach(operation => {
      const stats = operationStats[operation];
      stats.averageDuration = stats.totalDuration / stats.total;
      stats.errorRate = stats.errors / stats.total;
      stats.slowQueryRate = stats.slowQueries / stats.total;
    });

    return {
      summary: this.getStats(timeRangeMs),
      tableStats,
      operationStats,
      slowQueries: recentQueries
        .filter(q => q.duration > MONITORING_CONFIG.slowQueryThreshold)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      errorQueries: recentQueries
        .filter(q => !q.success)
        .slice(0, 10),
      alerts: this.alerts.filter(a => a.timestamp > Date.now() - timeRangeMs)
    };
  }

  // Get recent alerts
  getAlerts(timeRangeMs: number = 3600000) {
    const cutoff = Date.now() - timeRangeMs;
    return this.alerts.filter(a => a.timestamp > cutoff);
  }

  // Clear alerts
  clearAlerts() {
    this.alerts = [];
    this.alertCooldowns.clear();
  }

  // Stop monitoring
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.queryMetrics = [];
    this.systemMetrics = [];
    this.alerts = [];
    this.alertCooldowns.clear();
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Performance monitoring wrapper for Supabase operations
export const monitoredQuery = async <T>(
  queryId: string,
  table: string,
  operation: string,
  queryFn: () => Promise<T>,
  options: {
    cacheHit?: boolean;
    connectionPoolUsed?: boolean;
  } = {}
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    
    performanceMonitor.trackQuery(
      queryId,
      table,
      operation,
      startTime,
      true,
      undefined,
      options.cacheHit,
      options.connectionPoolUsed
    );
    
    return result;
  } catch (error) {
    performanceMonitor.trackQuery(
      queryId,
      table,
      operation,
      startTime,
      false,
      error instanceof Error ? error.message : 'Unknown error',
      options.cacheHit,
      options.connectionPoolUsed
    );
    
    throw error;
  }
};

// Performance monitoring utilities
export const performanceUtils = {
  // Get current performance statistics
  getStats: (timeRangeMs?: number) => performanceMonitor.getStats(timeRangeMs),
  
  // Get detailed performance report
  getReport: (timeRangeMs?: number) => performanceMonitor.getPerformanceReport(timeRangeMs),
  
  // Get recent alerts
  getAlerts: (timeRangeMs?: number) => performanceMonitor.getAlerts(timeRangeMs),
  
  // Clear alerts
  clearAlerts: () => performanceMonitor.clearAlerts(),
  
  // Health check
  healthCheck: async () => {
    const stats = performanceMonitor.getStats();
    const isHealthy = stats.queries.errorRate < 0.1 && 
                     stats.queries.averageDuration < 1000 &&
                     stats.alerts.critical === 0;
    
    return {
      isHealthy,
      stats,
      alerts: performanceMonitor.getAlerts(300000) // Last 5 minutes
    };
  }
};

// Export performance monitor for advanced usage
export { performanceMonitor };

// Cleanup on process exit
process.on('SIGINT', () => {
  performanceMonitor.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  performanceMonitor.destroy();
  process.exit(0);
});