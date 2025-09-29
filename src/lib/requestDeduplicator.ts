"use client";

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<unknown>> = new Map();
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly DEFAULT_TTL = 60 * 1000; // 1 minute default TTL

  constructor() {
    // Single instance across app
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).__thenewsiagaxbencana_requestDeduplicator) {
      return (globalThis as Record<string, unknown>).__thenewsiagaxbencana_requestDeduplicator as RequestDeduplicator;
    }
    
    if (typeof globalThis !== 'undefined') {
      (globalThis as Record<string, unknown>).__thenewsiagaxbencana_requestDeduplicator = this;
    }
  }

  private generateCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const headers = JSON.stringify(options?.headers || {});
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${headers}:${body}`;
  }

  /**
   * Deduplicate fetch requests - if a request is already pending, return the same promise
   */
  async deduplicateFetch<T = unknown>(
    url: string | URL,
    options?: RequestInit,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(url.toString(), options);
    
    // Check cache first
    const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && (Date.now() - cachedEntry.timestamp) < cachedEntry.ttl) {
        return cachedEntry.data as T;
      }

    // Check if request is already pending
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest.promise as Promise<T>;
    }

    // Create new request
    const promise = this.executeFetch<T>(url, options);
    
    // Store pending request
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now(),
    });

    try {
      const result = await promise;
      
      // Cache successful result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl,
      });
      
      return result;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeFetch<T>(url: string | URL, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    } else {
      return response.text() as T;
    }
  }

  /**
   * Deduplicate Supabase queries - cache database responses
   */
  async deduplicateSupabaseQuery<T>(
    queryKey: string,
    queryFn: () => { data: T | null; error: unknown } | Promise<{ data: T | null; error: unknown }>,
    ttl: number = 30 * 1000 // 30 seconds for database queries
  ): Promise<{ data: T | null; error: unknown }> {
    // Check cache first
    const cachedEntry = this.cache.get(queryKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < cachedEntry.ttl) {
      return cachedEntry.data as { data: T | null; error: unknown };
    }

    // Check if query is already pending
    const pendingRequest = this.pendingRequests.get(queryKey);
    if (pendingRequest) {
      return pendingRequest.promise as Promise<{ data: T | null; error: unknown }>;
    }

    // Execute query
    const queryResult = queryFn();
    const promise = Promise.resolve(queryResult);
    
    // Store pending request
    this.pendingRequests.set(queryKey, {
      promise,
      timestamp: Date.now(),
    });

    try {
      const result = await promise;
      
      // Cache successful result
      this.cache.set(queryKey, {
        data: result,
        timestamp: Date.now(),
        ttl,
      });
      
      return result;
    } catch (error) {
      // Don't cache errors, but still clean up
      throw error;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(queryKey);
    }
  }

  /**
   * Specialized wrapper for vessel positions queries
   */
  async deduplicateVesselPositionsQuery<T>(
    timeRangeFilter: string,
    limit?: number,
    gsfVesselId?: number
  ): Promise<{ data: T | null; error: unknown }> {
    const queryKey = `vessel-positions:${timeRangeFilter}:${limit || 50000}:${gsfVesselId || 'all'}`;
    
    return this.deduplicateSupabaseQuery(
      queryKey,
      () => {
        // This function will be passed in - we're just providing the deduplication layer
        throw new Error('Query function must be provided');
      },
      2 * 60 * 1000 // 2 minutes for vessel positions
    );
  }

  /**
   * Specialized wrapper for timeline frames queries
   */
  async deduplicateTimelineFramesQuery<T>(
    timeRangeFilter: string
  ): Promise<{ data: T | null; error: unknown }> {
    const queryKey = `timeline-frames:${timeRangeFilter}`;
    
    return this.deduplicateSupabaseQuery(
      queryKey,
      () => {
        // This function will be passed in - we're just providing the deduplication layer
        throw new Error('Query function must be provided');
      },
      1 * 60 * 1000 // 1 minute for timeline frames
    );
  }

  /**
   * Clear cache entries older than TTL
   */
  cleanupExpired(): void {
    const now = Date.now();
    
    // Clean cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 2) { // Clean entries older than 2x TTL
        this.cache.delete(key);
      }
    }
    
    // Clean pending requests older than 5 minutes
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > 5 * 60 * 1000) {
        this.pendingRequests.delete(key);
        console.warn(`🧹 Cleaned up stale pending request: ${key}`);
      }
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get stats for debugging
   */
  getStats(): { 
    pendingRequests: number; 
    cacheSize: number; 
    cacheKeys: string[];
    pendingKeys: string[];
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      pendingKeys: Array.from(this.pendingRequests.keys()),
    };
  }

  /**
   * Clear all cache and pending requests
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Auto-cleanup every 5 minutes
if (typeof globalThis !== 'undefined' && typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanupExpired();
  }, 5 * 60 * 1000);
}

export default RequestDeduplicator;
