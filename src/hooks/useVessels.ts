import { useEffect, useState } from 'react';
import { Vessel } from '@/contexts/MapContext'; // Re-using the Vessel interface from MapContext

// Global state to prevent multiple instances from conflicting
let globalVessels: Vessel[] = [];
let globalInterval: NodeJS.Timeout | null = null;
const globalListeners: Set<() => void> = new Set();

export function useVessels(intervalMs: number = 600000) {
  const [vessels, setVessels] = useState<Vessel[]>(globalVessels);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchVessels() {
    setIsLoading(true);
    setError(null);
    
    try {
      //console.log('Fetching vessels from API...');
      const res = await fetch('https://flotillatracker.siagax.com/webhook/tracker', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      //console.log('API Response:', data);
      
      // Handle the specific API response format: Array(1) -> [{vessels: Array(17)}]
      let vessels: Vessel[] = [];
      
      if (Array.isArray(data) && data.length > 0 && data[0].vessels && Array.isArray(data[0].vessels)) {
        // API returns: [{vessels: [vessel1, vessel2, ...]}]
        vessels = data[0].vessels;
      } else if (Array.isArray(data)) {
        // Direct array response
        vessels = data;
      } else if (data.vessels && Array.isArray(data.vessels)) {
        // Wrapped in vessels property
        vessels = data.vessels;
      } else if (data.data && Array.isArray(data.data)) {
        // Wrapped in data property
        vessels = data.data;
      } else {
        console.warn('Unexpected API response format:', data);
        throw new Error('Unexpected API response format');
      }
      
      //console.log('Successfully fetched vessels:', vessels.length);
      globalVessels = vessels;
      setVessels(vessels);
      setError(null);
      // Notify all listeners
      globalListeners.forEach(listener => listener());
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
        fetchVessels(); // Initial fetch
        globalInterval = setInterval(fetchVessels, intervalMs);
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
      console.log('Manual refresh triggered');
      fetchVessels();
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  return { vessels, isLoading, error };
}
