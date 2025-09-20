"use client";

import { useState, useEffect, useCallback } from 'react';
import createClient from '@/lib/supabase/client';

const supabase = createClient();

export function useGroupedVesselPositions() {
  const [vesselPositions, setVesselPositions] = useState<Record<string, Array<{
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
  }>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupedPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);


      // Fetch ALL positions for all vessels
      const { data: allPositions, error: positionsError } = await supabase
        .from('vessel_positions')
        .select('*')
        .order('timestamp_utc', { ascending: true })
        .limit(50000);

      if (positionsError) {
        throw new Error(`Failed to fetch positions: ${positionsError.message || 'Unknown error'}`);
      }

      // Fetch all vessels to get the mapping
      const { data: allVessels, error: vesselsError } = await supabase
        .from('vessels')
        .select('id, gsf_id, name')
        .eq('status', 'active');

      if (vesselsError) {
        throw new Error(`Failed to fetch vessels: ${vesselsError.message || 'Unknown error'}`);
      }

      // Create a mapping from gsf_id to vessel name
      const vesselMapping: Record<number, string> = {};
      allVessels?.forEach((vessel: { gsf_id: number; name: string }) => {
        vesselMapping[vessel.gsf_id] = vessel.name;
      });

      // Group positions by vessel name
      const groupedPositions: Record<string, Array<{
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
      }>> = {};
      
      allPositions?.forEach((position: {
        gsf_vessel_id: number;
        id: number;
        vessel_id: number;
        latitude: number;
        longitude: number;
        speed_kmh: number | null;
        speed_knots: number | null;
        course: number | null;
        timestamp_utc: string;
        created_at: string;
      }) => {
        const vesselName = vesselMapping[position.gsf_vessel_id];
        if (vesselName) {
          if (!groupedPositions[vesselName]) {
            groupedPositions[vesselName] = [];
          }
          groupedPositions[vesselName].push(position);
        }
      });

      
      setVesselPositions(groupedPositions);
    } catch (err) {
      console.error('Error fetching grouped vessel positions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupedPositions();

    // Set up realtime subscription
    const channel = supabase
      .channel('grouped-vessel-positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vessel_positions',
        },
        (payload) => {
          fetchGroupedPositions(); // Refetch on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGroupedPositions]);

  return { vesselPositions, loading, error, refetch: fetchGroupedPositions };
}
