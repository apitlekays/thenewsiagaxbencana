import { useState, useEffect, useCallback } from 'react';
import createClient from '@/lib/supabase/client';

export interface SecondLastVesselPosition {
  gsf_vessel_id: number;
  name: string;
  latitude: number;
  longitude: number;
  timestamp_utc: string;
  created_at: string;
  speed_knots?: number;
  speed_kmh?: number;
  course?: number;
  origin?: string;
}

export function useSecondLastVesselPositions(options?: { enabled?: boolean }) {
  const [secondLastPositions, setSecondLastPositions] = useState<SecondLastVesselPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const enabled = options?.enabled !== false;

  const fetchSecondLastPositions = useCallback(async () => {
    if (!enabled) {
      setSecondLastPositions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query to get second-to-last position for each vessel using direct SQL
      const supabase = createClient();
      
      // Get all positions grouped by vessel with ranking
      const { data: allPositions, error: queryError } = await supabase
        .from('vessel_positions')
        .select(`
          gsf_vessel_id,
          latitude,
          longitude,
          timestamp_utc,
          created_at,
          speed_knots,
          speed_kmh,
          course
        `)
        .order('gsf_vessel_id')
        .order('timestamp_utc', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(`Database error: ${queryError.message}`);
      }

      if (allPositions && allPositions.length > 0) {
        // Process positions to find second-to-last for each vessel
        const positionMap = new Map<number, Array<typeof allPositions[0]>>();
        
        // Group positions by vessel
        allPositions.forEach(position => {
          const vesselId = position.gsf_vessel_id;
          if (!positionMap.has(vesselId)) {
            positionMap.set(vesselId, []);
          }
          positionMap.get(vesselId)!.push(position);
        });

        // Get second-to-last position for each vessel (fallback to latest if only one exists)
        const secondLastPositionsData: typeof allPositions = [];
        positionMap.forEach(positions => {
          // Sort by timestamp and created_at to get correct order
          const sorted = positions.sort((a, b) => {
            if (a.timestamp_utc !== b.timestamp_utc) {
              return new Date(b.timestamp_utc).getTime() - new Date(a.timestamp_utc).getTime();
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          // If at least two positions, take second-to-last; otherwise fallback to latest
          const pick = sorted.length >= 2 ? sorted[1] : sorted[0];
          if (pick) secondLastPositionsData.push(pick);
        });

        if (secondLastPositionsData.length > 0) {
          // Get vessel info for these positions
          const vesselIds = secondLastPositionsData.map(d => d.gsf_vessel_id);
          const { data: vessels, error: vesselError } = await supabase
            .from('vessels')
            .select('gsf_id, name, origin')
            .in('gsf_id', vesselIds)
            .eq('status', 'active');

          if (vesselError) {
            throw new Error(`Vessel fetch error: ${vesselError.message}`);
          }

          // Combine position data with vessel data
          const combinedData = secondLastPositionsData.map(position => {
            const vessel = vessels?.find(v => v.gsf_id === position.gsf_vessel_id);
            return {
              gsf_vessel_id: position.gsf_vessel_id,
              latitude: position.latitude,
              longitude: position.longitude,
              timestamp_utc: position.timestamp_utc,
              created_at: position.created_at,
              speed_knots: position.speed_knots,
              speed_kmh: position.speed_kmh,
              course: position.course,
              name: vessel?.name || 'Unknown Vessel',
              origin: vessel?.origin || null
            };
          });

          setSecondLastPositions(combinedData);
        } else {
          setSecondLastPositions([]);
        }
        setHasInitialized(true);
      } else {
        setSecondLastPositions([]);
        setHasInitialized(true);
      }

    } catch (err) {
      console.error('Error fetching second last vessel positions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setHasInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchSecondLastPositions();
  }, [fetchSecondLastPositions]);

  return {
    secondLastPositions,
    loading,
    error,
    hasInitialized,
    refetch: fetchSecondLastPositions
  };
}
