"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import createClient from '@/lib/supabase/client';
import { useUIStore } from '@/store/uiStore';
import { subscriptionManager } from '@/lib/subscriptionManager';
import { requestDeduplicator } from '@/lib/requestDeduplicator';

// Lazy Supabase client - will be created when first needed
let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

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

  // Get time range filter selectively from UI store (reduces re-renders)
  const timeRangeFilter = useUIStore(state => state.timeRangeFilter);

  // Debounce ref to track timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedTimeRange, setDebouncedTimeRange] = useState(timeRangeFilter);

  // Debounce time range changes to prevent rapid successive API calls
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedTimeRange(timeRangeFilter);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [timeRangeFilter]);

  // Calculate date threshold based on time range filter
  const getDateThreshold = (range: '48h' | '7d' | '2w' | 'all'): string | null => {
    if (range === 'all') return null;
    
    const now = Date.now();
    let hoursBack = 48; // Default 48h
    
    switch (range) {
      case '48h': hoursBack = 48; break;
      case '7d': hoursBack = 7 * 24; break;
      case '2w': hoursBack = 14 * 24; break;
    }
    
    const thresholdDate = new Date(now - hoursBack * 60 * 60 * 1000);
    return thresholdDate.toISOString();
  };

  const fetchGroupedPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date threshold for filtering
      const dateThreshold = getDateThreshold(debouncedTimeRange);

      // Use deduplicated query for vessel positions
      const queryKey = `vessel-positions:${debouncedTimeRange}:${dateThreshold || 'all'}:50000`;
      
      const { data: allPositions, error: positionsError } = await requestDeduplicator.deduplicateSupabaseQuery(
        queryKey,
        async () => {
          // Build query with time filtering and limit
          let query = getSupabase()
            .from('vessel_positions')
            .select('*')
            .order('timestamp_utc', { ascending: true })
            .limit(50000);

          // Apply time range filter if not 'all'
          if (dateThreshold) {
            query = query.gte('timestamp_utc', dateThreshold);
          }

          const result = await query;
          return { data: result.data, error: result.error };
        },
        2 * 60 * 1000 // 2 minutes cache TTL
      );

      if (positionsError) {
        throw new Error(`Failed to fetch positions: ${positionsError instanceof Error ? positionsError.message : 'Unknown error'}`);
      }

      // Use deduplicated query for vessels
      const { data: allVessels, error: vesselsError } = await requestDeduplicator.deduplicateSupabaseQuery(
        'vessels:active:id-gsf-name',
        async () => {
          const result = await getSupabase()
            .from('vessels')
            .select('id, gsf_id, name')
            .eq('status', 'active');
          return { data: result.data, error: result.error };
        },
        5 * 60 * 1000 // 5 minutes cache TTL for vessel metadata
      );

      if (vesselsError) {
        throw new Error(`Failed to fetch vessels: ${vesselsError instanceof Error ? vesselsError.message : 'Unknown error'}`);
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
  }, [debouncedTimeRange]);

  useEffect(() => {
    fetchGroupedPositions();

    // Use centralized subscription manager
    const unsubscribe = subscriptionManager.subscribeToVesselPositions(
      fetchGroupedPositions,
      'useGroupedVesselPositions'
    );

    return unsubscribe;
  }, [fetchGroupedPositions]);

  return { vesselPositions, loading, error, refetch: fetchGroupedPositions };
}
