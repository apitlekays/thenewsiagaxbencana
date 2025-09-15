import { useEffect, useState, useCallback } from 'react';
import { Vessel } from '@/contexts/MapContext'; // Re-using the Vessel interface from MapContext

// Global state to prevent multiple instances from conflicting
let globalVessels: Vessel[] = [];
let globalInterval: NodeJS.Timeout | null = null;
const globalListeners: Set<() => void> = new Set();

export function useVessels(intervalMs: number = 900000) { // Changed to 15 minutes (900000ms)
  const [vessels, setVessels] = useState<Vessel[]>(globalVessels);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

  async function fetchVessels(isInitial = false) {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = isInitial ? '/api/vessels?initial=true' : '/api/vessels';
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const vessels: Vessel[] = await res.json();
      
      // Validate response format
      if (!Array.isArray(vessels)) {
        throw new Error('Unexpected API response format');
      }
      
      globalVessels = vessels;
      setVessels(vessels);
      setError(null);
      
      // Mark initial load as complete only after background loading is done
      if (!isInitial) {
        setIsInitialLoad(false);
      }
      
      // Notify all listeners
      globalListeners.forEach(listener => listener());
      
      // Force update if this is a background load
      if (!isInitial) {
        setVessels([...globalVessels]);
      }
    } catch (error) {
      console.error('Error fetching vessels:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      globalVessels = [];
      setVessels([]);
      globalListeners.forEach(listener => listener());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Only initialize once globally
    if (!isInitialized) {
      setIsInitialized(true);
      
      // If no global interval exists, create one
      if (!globalInterval) {
        //console.log('Initializing global vessels fetch with interval:', intervalMs);
        fetchVessels(true); // Initial fetch with limited data
        globalInterval = setInterval(() => fetchVessels(false), intervalMs);
      }
    }

    // Add this component as a listener
    const updateListener = () => setVessels(globalVessels);
    globalListeners.add(updateListener);

    // Cleanup
    return () => {
      globalListeners.delete(updateListener);
    };
  }, [isInitialized, intervalMs]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchVessels(false); // Use full data for manual refresh
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  // Function to load full vessel data in background
  const loadFullData = useCallback(async () => {
    if (isInitialLoad && !isBackgroundLoading) {
      setIsBackgroundLoading(true);
      
      try {
        await fetchVessels(false);
      } catch (error) {
        console.error('Background load failed:', error);
      } finally {
        setIsBackgroundLoading(false);
      }
    }
  }, [isInitialLoad, isBackgroundLoading]);

  // Auto-trigger background loading after initial load
  useEffect(() => {
    if (isInitialLoad && !isBackgroundLoading && vessels.length > 0) {
      // Start background loading after initial data is loaded
      const timer = setTimeout(() => {
        loadFullData();
      }, 1000); // Wait 1 second after initial load
      
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad, isBackgroundLoading, vessels.length, loadFullData]);

  return { vessels, isLoading, error, isInitialLoad, isBackgroundLoading, loadFullData };
}
