"use client";

import { useState, useEffect, useCallback } from 'react';
import createClient from '@/lib/supabase/client';

interface LatestVesselData {
  result_vessel_id: number;
  result_gsf_vessel_id: number;
  result_vessel_name: string;
  result_latitude: number;
  result_longitude: number;
  result_speed_knots: number | null;
  result_speed_kmh: number | null;
  result_course: number | null;
  result_timestamp_utc: string;
  result_created_at: string;
  result_origin: string | null;
}

// Transform latest vessel data to match existing API format
interface VesselPositionData {
  id: number;
  vessel_id: number;
  gsf_vessel_id: number;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  speed_knots: number | null;
  course: number | null;
  timestamp_utc: string;
  created_at: string;
}

interface GroupedPositions {
  [vesselName: string]: VesselPositionData[];
}

export function useLatestVesselPositions(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== undefined ? options.enabled : true;
  
  const [vesselPositions, setVesselPositions] = useState<GroupedPositions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestPositions = useCallback(async () => {
    if (!enabled) {
      setVesselPositions({});
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      
      // Try optimized database function first, fallback to direct query
      let data: LatestVesselData[] | null = null;
      let error: Error | null = null;

      try {
        // First, try the optimized RPC function (if it exists)
        const rpcResult = await supabase.rpc('get_latest_vessel_data') as {
          data: LatestVesselData[] | null;
          error: Error | null;
        };
        data = rpcResult.data;
        error = rpcResult.error;
      } catch {
        // Simplified fallback: Temporarily disable until database function is created
        console.warn('Using minimal fallback - please create get_latest_vessel_data function');
        throw new Error('Database function not available - please create get_latest_vessel_data function first');
      }

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform to match existing API format (grouped by vessel name)
      const groupedPositions: GroupedPositions = {};
      
      data?.forEach((row: LatestVesselData) => {
        if (row.result_vessel_name) {
          groupedPositions[row.result_vessel_name] = [{
            id: row.result_vessel_id,
            vessel_id: row.result_vessel_id,
            gsf_vessel_id: row.result_gsf_vessel_id,
            latitude: parseFloat(row.result_latitude.toString()),
            longitude: parseFloat(row.result_longitude.toString()),
            speed_kmh: row.result_speed_kmh,
            speed_knots: row.result_speed_knots,
            course: row.result_course,
            timestamp_utc: row.result_timestamp_utc,
            created_at: row.result_created_at
          }];
        }
      });

      setVesselPositions(groupedPositions);
      
      console.log(`Loaded latest positions for ${Object.keys(groupedPositions).length} vessels`);
      
    } catch (err) {
      console.error('Error fetching latest vessel positions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchLatestPositions();
  }, [fetchLatestPositions]);

  return {
    vesselPositions,
    loading,
    error,
    refetch: fetchLatestPositions
  };
}
