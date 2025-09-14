import { useState, useEffect, useCallback } from 'react';
import { VesselStatusData, VesselStatus } from '@/types/vessel';

// Cache for vessel status data
const statusCache = new Map<string, VesselStatusData[]>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

export function useVesselStatus() {
  const [vesselStatuses, setVesselStatuses] = useState<Map<string, VesselStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchVesselStatuses = useCallback(async () => {
    const cacheKey = 'vessel_statuses';
    
    // Check cache first
    const cached = statusCache.get(cacheKey);
    const cachedExpiry = cacheExpiry.get(cacheKey);
    
    if (cached && cachedExpiry && Date.now() < cachedExpiry) {
      // Convert array to Map for easier lookup
      const statusMap = new Map<string, VesselStatus>();
      cached.forEach(item => {
        statusMap.set(item.mmsi, item.status);
      });
      setVesselStatuses(statusMap);
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch vessel statuses from webhook
      const webhookResponse = await fetch('https://flotillatracker.siagax.com/webhook/vesselstatus');
      
      if (!webhookResponse.ok) {
        throw new Error(`Failed to fetch vessel statuses: ${webhookResponse.status}`);
      }
      
      const csvUrl = await webhookResponse.text();
      if (!csvUrl) {
        throw new Error('No URL returned from webhook for vessel statuses');
      }
      
      // Fetch the actual CSV data from Google Sheets
      const response = await fetch(csvUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        throw new Error(`Failed to fetch vessel statuses CSV: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      // Parse CSV data
      const statusData: VesselStatusData[] = [];
      
      // Function to parse CSV line properly handling quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add the last field
        result.push(current.trim());
        return result;
      };
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = parseCSVLine(lines[i]);
          if (values.length >= 3) {
            const item: VesselStatusData = {
              mmsi: values[0] || '',
              status: (values[1] as VesselStatus) || 'sailing',
              datetime: values[2] || ''
            };
            statusData.push(item);
          }
        }
      }
      
      // Cache the data
      statusCache.set(cacheKey, statusData);
      cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
      
      // Convert array to Map for easier lookup
      const statusMap = new Map<string, VesselStatus>();
      statusData.forEach(item => {
        statusMap.set(item.mmsi, item.status);
      });
      
      setVesselStatuses(statusMap);
      setLastRefresh(new Date());
      setError(null);
      setIsLoading(false);
      setIsInitialized(true);
      
      
    } catch (err) {
      console.error('Error fetching vessel statuses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vessel statuses');
      setIsLoading(false);
      setIsInitialized(true); // Mark as initialized even on error
      // Keep existing statuses on error
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchVesselStatuses();
    
    // Set up periodic refresh every 2 minutes
    const interval = setInterval(fetchVesselStatuses, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchVesselStatuses]);

  // Get status for a specific vessel MMSI at a specific time
  const getVesselStatus = useCallback((mmsi: string, currentTime?: Date): string => {
    const cacheKey = 'vessel_statuses';
    const cachedData = statusCache.get(cacheKey);
    
    if (!cachedData || cachedData.length === 0) {
      return 'sailing'; // Default to 'sailing' if no webhook data
    }
    
    // Find the vessel's status data
    const vesselStatusData = cachedData.find(data => data.mmsi === mmsi);
    
    if (!vesselStatusData) {
      return 'sailing'; // Default to 'sailing' if vessel not in webhook data
    }
    
    // If no currentTime provided, return the status immediately
    if (!currentTime) {
      return vesselStatusData.status;
    }
    
    // Check if current time is after the status change datetime
    const statusChangeTime = new Date(vesselStatusData.datetime);
    
    if (currentTime >= statusChangeTime) {
      return vesselStatusData.status;
    }
    
    // If current time is before the status change, return default 'sailing'
    return 'sailing';
  }, []);

  return { 
    vesselStatuses,
    getVesselStatus,
    isLoading, 
    error, 
    lastRefresh, 
    isInitialized,
    refetch: fetchVesselStatuses 
  };
}
