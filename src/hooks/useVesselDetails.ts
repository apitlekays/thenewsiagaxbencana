import { useState, useEffect, useCallback } from 'react';
import { VesselDetailsData } from '@/types/vessel';

// Cache for vessel data to avoid repeated API calls
const vesselDataCache = new Map<string, VesselDetailsData>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useVesselDetails(mmsi: string) {
  const [vesselData, setVesselData] = useState<VesselDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch vessel details from siagax.com API

  const fetchVesselData = useCallback(async (mmsiToFetch: string) => {
    // Don't fetch if MMSI is empty or invalid
    if (!mmsiToFetch || mmsiToFetch.trim() === '') {
      setVesselData(null);
      setIsLoading(false);
      setError('No MMSI available');
      return;
    }

    // Check cache first
    const cached = vesselDataCache.get(mmsiToFetch);
    const cachedExpiry = cacheExpiry.get(mmsiToFetch);
    
    if (cached && cachedExpiry && Date.now() < cachedExpiry) {
      setVesselData(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch vessel data from our new GSF API endpoint
      console.log('Fetching vessel data from GSF API...');
      const gsfResponse = await fetch('/api/vessels', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (gsfResponse.ok) {
        const vessels = await gsfResponse.json();
        
        if (Array.isArray(vessels)) {
          const vessel = vessels.find((v: { mmsi: string; name: string }) => v.mmsi === mmsiToFetch);
          if (vessel) {
            const extractedData: VesselDetailsData = {
              mmsi: vessel.mmsi,
              name: vessel.name,
              // Include all available fields from GSF API
              origin: vessel.origin || null,
              speed_kmh: vessel.speed_kmh || null,
              speed_knots: vessel.speed_knots || null,
              course: vessel.course || null,
              type: vessel.type || null,
              image_url: vessel.image_url || null,
              marinetraffic_shipid: vessel.marinetraffic_shipid || null,
              positions: vessel.positions || [],
              timestamp: vessel.timestamp || null,
              vessel_status: vessel.vessel_status || null,
            };
            
            // Cache the data
            vesselDataCache.set(mmsiToFetch, extractedData);
            cacheExpiry.set(mmsiToFetch, Date.now() + CACHE_DURATION);
            
            setVesselData(extractedData);
            setError(null);
            return;
          }
        }
      }
      
      // If GSF API doesn't have the vessel, set to null
      setError('Vessel data unavailable');
      setVesselData(null);
      
    } catch (err) {
      console.error('Error fetching vessel data:', err);
      setError('Failed to fetch vessel data');
      setVesselData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVesselData(mmsi);
  }, [mmsi, fetchVesselData]);

  return { vesselData, isLoading, error, refetch: () => fetchVesselData(mmsi) };
}

// Utility function to calculate vessel statistics
export function calculateVesselStats(vessel: { 
  positions?: Array<{ latitude: number; longitude: number; timestamp_utc: string }>;
  speed_kmh?: number | null | undefined;
  speed_knots?: number | null | undefined;
  course?: number | null | undefined;
}): {
  totalPositions: number;
  distanceTraveled: number;
  averageSpeed: number;
  currentSpeed: number;
  currentCourse: number;
  timeAtSea: number;
  estimatedTimeToGaza: number;
} {
  if (!vessel.positions || vessel.positions.length < 2) {
    return {
      totalPositions: vessel.positions?.length || 0,
      distanceTraveled: 0,
      averageSpeed: 0,
      currentSpeed: vessel.speed_kmh ? vessel.speed_kmh * 0.539957 : 0, // Convert km/h to knots
      currentCourse: vessel.course || 0,
      timeAtSea: 0,
      estimatedTimeToGaza: 0,
    };
  }

  const positions = vessel.positions;
  const totalPositions = positions.length;
  
  // Calculate total distance traveled
  let totalDistance = 0;
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    const distance = calculateDistance(
      prev.latitude, prev.longitude,
      curr.latitude, curr.longitude
    );
    totalDistance += distance;
  }

  // Calculate time at sea
  const startTime = new Date(positions[0].timestamp_utc);
  const endTime = new Date(positions[positions.length - 1].timestamp_utc);
  const timeAtSea = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

  // Calculate average speed
  const averageSpeed = timeAtSea > 0 ? totalDistance / timeAtSea : 0;

  // Get current speed and course - prefer GSF API data if available
  let currentSpeed = 0;
  let currentCourse = 0;
  
  if (vessel.speed_kmh !== null && vessel.speed_kmh !== undefined) {
    // Use GSF API speed data (convert km/h to knots)
    currentSpeed = vessel.speed_kmh * 0.539957;
  } else if (positions.length >= 2) {
    // Fallback to calculated speed from positions
    const last = positions[positions.length - 1];
    const secondLast = positions[positions.length - 2];
    
    const distance = calculateDistance(
      secondLast.latitude, secondLast.longitude,
      last.latitude, last.longitude
    );
    
    const timeDiff = (new Date(last.timestamp_utc).getTime() - 
                     new Date(secondLast.timestamp_utc).getTime()) / (1000 * 60 * 60);
    
    currentSpeed = timeDiff > 0 ? distance / timeDiff : 0;
  }
  
  if (vessel.course !== null && vessel.course !== undefined) {
    // Use GSF API course data
    currentCourse = vessel.course;
  } else if (positions.length >= 2) {
    // Fallback to calculated course from positions
    const last = positions[positions.length - 1];
    const secondLast = positions[positions.length - 2];
    currentCourse = calculateBearing(
      secondLast.latitude, secondLast.longitude,
      last.latitude, last.longitude
    );
  }

  // Note: ETA calculation removed as it requires hardcoded destination coordinates
  // const estimatedTimeToGaza = currentSpeed > 0 ? distanceToGaza / currentSpeed : 0;

  return {
    totalPositions,
    distanceTraveled: Math.round(totalDistance),
    averageSpeed: Math.round(averageSpeed * 10) / 10,
    currentSpeed: Math.round(currentSpeed * 10) / 10,
    currentCourse: Math.round(currentCourse),
    timeAtSea: Math.round(timeAtSea * 10) / 10,
    estimatedTimeToGaza: 0, // Removed hardcoded destination calculation
  };
}

// Helper function to calculate distance between two points (in nautical miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to calculate bearing between two points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}
