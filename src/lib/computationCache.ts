"use client";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dependencies: string[];
}

class ComputationCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Single instance across app
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).__thenewsiagaxbencana_computationCache) {
      return (globalThis as Record<string, unknown>).__thenewsiagaxbencana_computationCache as ComputationCache;
    }
    
    if (typeof globalThis !== 'undefined') {
      (globalThis as Record<string, unknown>).__thenewsiagaxbencana_computationCache = this;
    }
  }

  private generateKey(baseKey: string, dependencies: unknown[]): string {
    const dependencyHashes = dependencies.map(dep => {
      if (typeof dep === 'object' && dep !== null) {
        return JSON.stringify(dep);
      }
      return String(dep);
    });
    return `${baseKey}:${dependencyHashes.join('|')}`;
  }

  /**
   * Get cached data or compute new data
   */
  getOrCompute<T>(
    key: string,
    computeFn: () => T,
    dependencies: unknown[] = [],
    ttl: number = this.DEFAULT_TTL
  ): T {
    const cacheKey = this.generateKey(key, dependencies);
    const entry = this.cache.get(cacheKey);

    // Check if cache is still valid
    if (entry && (Date.now() - entry.timestamp) < ttl) {
      return entry.data as T;
    }

    // Compute new data
    const data = computeFn();
    
    // Generate dependency hashes for caching
    const dependencyHashes = dependencies.map(dep => {
      if (typeof dep === 'object' && dep !== null) {
        return JSON.stringify(dep);
      }
      return String(dep);
    });
    
    // Cache the result
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      dependencies: dependencyHashes,
    });

    return data;
  }

  /**
   * Cached vessel pathway computation
   */
  computeVesselPathways(
    vesselPositions: Record<string, Array<{
      latitude: number | string;
      longitude: number | string;
    }>>,
    dependencyHash?: string
  ): Record<string, [number, number][]> {
    const cacheKey = 'vessel-pathways';
    const deps = dependencyHash ? [dependencyHash] : [JSON.stringify(vesselPositions)];

    return this.getOrCompute(
      cacheKey,
      () => {
        return Object.entries(vesselPositions).reduce((acc, [vesselName, positions]) => {
          const validPositions = positions.filter(position => {
            const lat = parseFloat(position.latitude.toString());
            const lng = parseFloat(position.longitude.toString());
            return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
          });

          acc[vesselName] = validPositions.map(position => [
            parseFloat(position.latitude.toString()),
            parseFloat(position.longitude.toString())
          ] as [number, number]);

          return acc;
        }, {} as Record<string, [number, number][]>);
      },
      deps,
      2 * 60 * 1000 // 2 minutes TTL for pathways
    );
  }

  /**
   * Cached distance calculations for flotilla center
   */
  computeFlotillaDistances(
    vessels: Array<{ 
      latitude?: number | null; 
      longitude?: number | null; 
      name: string; 
    }>,
    gazaPort: { lat: number; lng: number }
  ): Array<{ vessel: { latitude?: number | null; longitude?: number | null; name: string }; distance: number }> {
    const cacheKey = 'flotilla-distances';
    const deps = [
      JSON.stringify(vessels),
      `${gazaPort.lat},${gazaPort.lng}`
    ];

    return this.getOrCompute(
      cacheKey,
      () => {
        return vessels
          .filter(vessel => 
            vessel.latitude && vessel.longitude && 
            !isNaN(parseFloat(vessel.latitude.toString())) && 
            !isNaN(parseFloat(vessel.longitude.toString()))
          )
          .map(vessel => ({
            vessel,
            distance: this.haversineDistance(
              parseFloat(vessel.latitude!.toString()), 
              parseFloat(vessel.longitude!.toString()), 
              gazaPort.lat, 
              gazaPort.lng
            )
          }));
      },
      deps,
      1 * 60 * 1000 // 1 minute TTL for distances
    );
  }

  /**
   * Haversine distance calculation (memoized version)
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const key = `haversine:${lat1},${lng1},${lat2},${lng2}`;
    
    return this.getOrCompute(
      key,
      () => {
        const R = 3440.065; // Earth's radius in nautical miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      },
      [],
      10 * 60 * 1000 // 10 minutes TTL for distance calculations
    );
  };

  /**
   * Check if coordinates are near the anomaly point (28.999846, 40.000792)
   * This filters out Navionics malfunction data that caused vessels to "jump" inland
   */
  private isAnomalyCoordinate(lat: number, lng: number): boolean {
    const ANOMALY_LAT = 28.999846;
    const ANOMALY_LNG = 40.000792;
    const ANOMALY_THRESHOLD = 0.1; // ~11km radius
    
    return (
      Math.abs(lat - ANOMALY_LAT) < ANOMALY_THRESHOLD &&
      Math.abs(lng - ANOMALY_LNG) < ANOMALY_THRESHOLD
    );
  }

  /**
   * Cached actual vessel pathway computation for timeline with anomaly filtering
   */
  computeActualVesselPathway(
    vesselName: string,
    timelineData: Array<{
      timestamp: string;
      vessels: Array<{
        name: string;
        lat: number;
        lng: number;
        origin: string | null;
      }>;
    }>,
    currentFrame: number
  ): [number, number][] {
    const cacheKey = 'actual-vessel-pathway';
    const deps = [
      vesselName,
      currentFrame,
      JSON.stringify(timelineData.slice(0, currentFrame + 1)) // Only relevant frames
    ];

    return this.getOrCompute(
      cacheKey,
      () => {
        if (currentFrame < 0 || currentFrame >= timelineData.length) {
          return [];
        }

        const vesselPositions: [number, number][] = [];
        
        for (let i = 0; i <= currentFrame; i++) {
          const frame = timelineData[i];
          const vesselInFrame = frame.vessels.find(v => v.name === vesselName);
          
          if (vesselInFrame) {
            // Filter out anomaly coordinates to prevent pathways going inland
            if (!this.isAnomalyCoordinate(vesselInFrame.lat, vesselInFrame.lng)) {
              vesselPositions.push([vesselInFrame.lat, vesselInFrame.lng]);
            }
          }
        }

        return vesselPositions;
      },
      deps,
      30 * 1000 // 30 seconds TTL for actual pathways
    );
  }

  /**
   * Clear cache entries older than specified TTL
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.DEFAULT_TTL * 2) { // Clean up entries older than 2x TTL
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const computationCache = new ComputationCache();

// Auto-cleanup every 5 minutes
if (typeof globalThis !== 'undefined' && typeof window !== 'undefined') {
  setInterval(() => {
    computationCache.cleanupExpired();
  }, 5 * 60 * 1000);
}

export default ComputationCache;
