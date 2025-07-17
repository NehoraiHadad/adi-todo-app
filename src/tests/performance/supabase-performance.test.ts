/**
 * Performance Tests for Supabase Operations
 * Tests query performance, caching, and connection pooling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cachedQueries, cacheInvalidation } from '@/utils/supabase/cache';
import { pooledQueries } from '@/utils/supabase/connection-pool';
import { performanceUtils, monitoredQuery } from '@/utils/supabase/performance-monitor';

// Test configuration
const PERFORMANCE_THRESHOLDS = {
  fastQuery: 100,      // < 100ms
  mediumQuery: 500,    // < 500ms
  slowQuery: 1000,     // < 1000ms
  cacheHitRate: 0.8,   // > 80%
  errorRate: 0.05,     // < 5%
};

const TEST_USER_ID = 'test-user-id';
const TEST_PARENT_ID = 'test-parent-id';

describe('Supabase Performance Tests', () => {
  // let _supabase: ReturnType<typeof createClient>;

  beforeAll(async () => {
    // const _supabase = createClient();
    
    // Clear cache before tests
    cacheInvalidation.clearAll();
    
    // Clear performance monitor alerts
    performanceUtils.clearAlerts();
  });

  afterAll(async () => {
    // Clean up after tests
    cacheInvalidation.clearAll();
    performanceUtils.clearAlerts();
  });

  beforeEach(async () => {
    // Reset cache between tests
    cacheInvalidation.clearAll();
  });

  describe('Query Performance', () => {
    it('should fetch subjects quickly', async () => {
      const startTime = Date.now();
      
      const subjects = await monitoredQuery(
        'subjects_performance_test',
        'subjects',
        'SELECT',
        () => cachedQueries.subjects()
      );
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumQuery);
      expect(Array.isArray(subjects)).toBe(true);
    });

    it('should fetch time slots quickly', async () => {
      const startTime = Date.now();
      
      const timeSlots = await monitoredQuery(
        'time_slots_performance_test',
        'time_slots',
        'SELECT',
        () => cachedQueries.timeSlots()
      );
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumQuery);
      expect(Array.isArray(timeSlots)).toBe(true);
    });

    it('should handle user profile queries efficiently', async () => {
      const startTime = Date.now();
      
      try {
        await monitoredQuery(
          'user_profile_performance_test',
          'profiles',
          'SELECT',
          () => cachedQueries.userProfile(TEST_USER_ID)
        );
      } catch {
        // Expected to fail with test user, but should be fast
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumQuery);
    });

    it('should handle user role queries efficiently', async () => {
      const startTime = Date.now();
      
      try {
        await monitoredQuery(
          'user_role_performance_test',
          'user_roles',
          'SELECT',
          () => cachedQueries.userRole(TEST_USER_ID)
        );
      } catch {
        // Expected to fail with test user, but should be fast
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumQuery);
    });
  });

  describe('Cache Performance', () => {
    it('should cache subjects and provide fast subsequent access', async () => {
      // First call (cache miss)
      const startTime1 = Date.now();
      const subjects1 = await cachedQueries.subjects();
      const duration1 = Date.now() - startTime1;
      
      // Second call (cache hit)
      const startTime2 = Date.now();
      const subjects2 = await cachedQueries.subjects();
      const duration2 = Date.now() - startTime2;
      
      expect(duration2).toBeLessThan(PERFORMANCE_THRESHOLDS.fastQuery);
      expect(duration2).toBeLessThan(duration1 / 2); // Should be at least 2x faster
      expect(subjects1).toEqual(subjects2);
    });

    it('should cache time slots and provide fast subsequent access', async () => {
      // First call (cache miss)
      const startTime1 = Date.now();
      const timeSlots1 = await cachedQueries.timeSlots();
      const duration1 = Date.now() - startTime1;
      
      // Second call (cache hit)
      const startTime2 = Date.now();
      const timeSlots2 = await cachedQueries.timeSlots();
      const duration2 = Date.now() - startTime2;
      
      expect(duration2).toBeLessThan(PERFORMANCE_THRESHOLDS.fastQuery);
      expect(duration2).toBeLessThan(duration1 / 2); // Should be at least 2x faster
      expect(timeSlots1).toEqual(timeSlots2);
    });

    it('should invalidate cache properly', async () => {
      // Cache some data
      await cachedQueries.subjects();
      await cachedQueries.timeSlots();
      
      // Invalidate global cache
      cacheInvalidation.invalidateGlobal();
      
      // Next calls should be slower (cache misses)
      const startTime = Date.now();
      await cachedQueries.subjects();
      const duration = Date.now() - startTime;
      
      // Should be slower than cached access but still reasonable
      expect(duration).toBeGreaterThan(PERFORMANCE_THRESHOLDS.fastQuery);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumQuery);
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle multiple concurrent queries efficiently', async () => {
      const startTime = Date.now();
      
      // Execute multiple queries concurrently
      const promises = [
        pooledQueries.subjects(),
        pooledQueries.userProfile(TEST_USER_ID).catch(() => null),
        pooledQueries.userRole(TEST_USER_ID).catch(() => null),
        pooledQueries.adminUsers().catch(() => null),
      ];
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery);
      expect(results.length).toBe(4);
    });

    it('should handle batch operations efficiently', async () => {
      const startTime = Date.now();
      
      try {
        const batchResults = await pooledQueries.userBatch(TEST_USER_ID);
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery);
        expect(Array.isArray(batchResults)).toBe(true);
      } catch {
        // Expected to fail with test user, but should be fast
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery);
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should track query performance metrics', async () => {
      // Execute some monitored queries
      try {
        await monitoredQuery(
          'test_query_1',
          'subjects',
          'SELECT',
          () => cachedQueries.subjects()
        );
        
        await monitoredQuery(
          'test_query_2',
          'time_slots',
          'SELECT',
          () => cachedQueries.timeSlots()
        );
      } catch {
        // Ignore errors for performance testing
      }
      
      // Check performance stats
      const stats = performanceUtils.getStats(60000); // Last minute
      
      expect(stats.queries.total).toBeGreaterThan(0);
      expect(stats.queries.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.errorRate);
      expect(stats.queries.averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery);
    });

    it('should generate performance report', async () => {
      // Execute some test queries
      for (let i = 0; i < 10; i++) {
        try {
          await monitoredQuery(
            `test_query_${i}`,
            'subjects',
            'SELECT',
            () => cachedQueries.subjects()
          );
        } catch {
          // Ignore errors for performance testing
        }
      }
      
      const report = performanceUtils.getReport(60000);
      
      expect(report.summary).toBeDefined();
      expect(report.tableStats).toBeDefined();
      expect(report.operationStats).toBeDefined();
      expect(typeof report.summary.queries.total).toBe('number');
      expect(typeof report.summary.queries.errorRate).toBe('number');
      expect(typeof report.summary.queries.averageDuration).toBe('number');
    });

    it('should detect slow queries', async () => {
      // Simulate a slow query
      await monitoredQuery(
        'slow_query_test',
        'test_table',
        'SELECT',
        () => new Promise(resolve => setTimeout(resolve, 1200)) // 1.2 seconds
      );
      
      const alerts = performanceUtils.getAlerts(60000);
      const slowQueryAlerts = alerts.filter(a => a.type === 'slow_query');
      
      expect(slowQueryAlerts.length).toBeGreaterThan(0);
    });

    it('should perform health check', async () => {
      const health = await performanceUtils.healthCheck();
      
      expect(health).toBeDefined();
      expect(typeof health.isHealthy).toBe('boolean');
      expect(health.stats).toBeDefined();
      expect(Array.isArray(health.alerts)).toBe(true);
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle dashboard data loading efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate dashboard data loading
      try {
        await Promise.all([
          cachedQueries.subjects(),
          cachedQueries.timeSlots(),
          cachedQueries.userProfile(TEST_USER_ID).catch(() => null),
          cachedQueries.userRole(TEST_USER_ID).catch(() => null),
          cachedQueries.userSchedule(TEST_USER_ID).catch(() => null),
          cachedQueries.userTasks(TEST_USER_ID).catch(() => null),
        ]);
      } catch {
        // Some queries expected to fail with test data
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery);
    });

    it('should handle admin panel data loading efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate admin panel data loading
      try {
        await Promise.all([
          cachedQueries.adminUsers().catch(() => null),
          cachedQueries.adminStats().catch(() => null),
          cachedQueries.subjects(),
          cachedQueries.timeSlots(),
        ]);
      } catch {
        // Some queries expected to fail with test data
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery);
    });

    it('should handle parent dashboard data loading efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate parent dashboard data loading
      try {
        await Promise.all([
          cachedQueries.parentChildren(TEST_PARENT_ID).catch(() => null),
          cachedQueries.userProfile(TEST_PARENT_ID).catch(() => null),
          cachedQueries.userRole(TEST_PARENT_ID).catch(() => null),
        ]);
      } catch {
        // Some queries expected to fail with test data
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery);
    });
  });

  describe('Load Testing', () => {
    it('should handle moderate load efficiently', async () => {
      const startTime = Date.now();
      const concurrentOperations = 50;
      
      // Create array of promises for concurrent operations
      const promises = Array(concurrentOperations).fill(0).map(async (_, index) => {
        try {
          if (index % 2 === 0) {
            return await cachedQueries.subjects();
          } else {
            return await cachedQueries.timeSlots();
          }
        } catch {
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.slowQuery * 2); // Allow 2x for load
      expect(results.length).toBe(concurrentOperations);
      
      // Check that cache is working (should be many cache hits)
      const stats = performanceUtils.getStats(60000);
      expect(stats.cache.hitRate).toBeGreaterThan(0.5); // At least 50% cache hit rate
    });
  });
});

// Helper function to run performance benchmarks
export const runPerformanceBenchmarks = async () => {
  console.log('Starting Supabase Performance Benchmarks...');
  
  const benchmarks = [
    {
      name: 'Subjects Query',
      fn: () => cachedQueries.subjects(),
      threshold: PERFORMANCE_THRESHOLDS.mediumQuery
    },
    {
      name: 'Time Slots Query',
      fn: () => cachedQueries.timeSlots(),
      threshold: PERFORMANCE_THRESHOLDS.mediumQuery
    },
    {
      name: 'Cached Subjects Query',
      fn: async () => {
        await cachedQueries.subjects(); // Prime cache
        return cachedQueries.subjects(); // Cached access
      },
      threshold: PERFORMANCE_THRESHOLDS.fastQuery
    },
    {
      name: 'Batch Operations',
      fn: () => pooledQueries.userBatch(TEST_USER_ID).catch(() => null),
      threshold: PERFORMANCE_THRESHOLDS.slowQuery
    },
  ];
  
  const results = [];
  
  for (const benchmark of benchmarks) {
    const startTime = Date.now();
    
    try {
      await benchmark.fn();
      const duration = Date.now() - startTime;
      const passed = duration < benchmark.threshold;
      
      results.push({
        name: benchmark.name,
        duration,
        threshold: benchmark.threshold,
        passed,
        status: passed ? 'PASS' : 'FAIL'
      });
      
      console.log(`${benchmark.name}: ${duration}ms (${passed ? 'PASS' : 'FAIL'})`);
    } catch (error) {
      results.push({
        name: benchmark.name,
        duration: -1,
        threshold: benchmark.threshold,
        passed: false,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`${benchmark.name}: ERROR - ${error}`);
    }
  }
  
  console.log('\nPerformance Benchmark Results:');
  console.table(results);
  
  return results;
};