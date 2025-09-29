import { useState, useEffect, useCallback } from 'react';
import createClient from '@/lib/supabase/client';
import { subscriptionManager } from '@/lib/subscriptionManager';

export interface Vessel {
  id: number;
  gsf_id: number;
  name: string;
  type: string;
  image_url?: string;
  origin?: string;
  status: 'active' | 'decommissioned';
  latitude?: number;
  longitude?: number;
  timestamp_utc?: string;
  speed_kmh?: number;
  speed_knots?: number;
  course?: number;
  vessel_status?: string;
  created_at: string;
  updated_at: string;
}

export interface VesselPosition {
  id: number;
  vessel_id?: number;
  gsf_vessel_id: number;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  speed_knots?: number;
  course?: number;
  timestamp_utc: string;
  created_at: string;
}

// Lazy Supabase client - will be created when first needed
let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

export function useVessels() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
      const fetchVessels = async () => {
        try {
          setLoading(true);
          const { data, error } = await getSupabase()
          .from('vessels')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setVessels(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchVessels();

    // Use centralized subscription manager
    const unsubscribe = subscriptionManager.subscribeToVessels(
      fetchVessels,
      'useVessels'
    );

    return unsubscribe;
  }, []);

  return {
    vessels,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Refetch logic here if needed
    },
  };
}

export function useVesselPositions(vesselId?: number) {
  const [positions, setPositions] = useState<VesselPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      let query = getSupabase()
        .from('vessel_positions')
        .select('*')
        .order('timestamp_utc', { ascending: false });

      if (vesselId) {
        query = query.eq('gsf_vessel_id', vesselId);
      }

      const { data, error } = await query.limit(50000); // Increased limit

      if (error) throw error;
      setPositions(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [vesselId]);

  useEffect(() => {
    fetchPositions();

    // Use centralized subscription manager
    const unsubscribe = subscriptionManager.subscribeToVesselPositions(
      fetchPositions,
      `useVesselPositions-${vesselId || 'all'}`
    );

    return unsubscribe;
  }, [vesselId, fetchPositions]);

  return {
    positions,
    loading,
    error,
  };
}

export function useAllVesselPositions() {
  const [positions, setPositions] = useState<VesselPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllPositions = async () => {
    try {
      setLoading(true);
      const { data, error } = await getSupabase()
        .from('vessel_positions')
        .select('*')
        .order('timestamp_utc', { ascending: true })
        .limit(50000); // Explicitly set high limit to get all positions

      if (error) throw error;
      setPositions(data || []);
    } catch (err) {
      console.error('❌ Error fetching positions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPositions();

    // Use centralized subscription manager
    const unsubscribe = subscriptionManager.subscribeToVesselPositions(
      fetchAllPositions,
      'useAllVesselPositions'
    );

    return unsubscribe;
  }, []);

  return {
    positions,
    loading,
    error,
    refetch: fetchAllPositions, // Expose manual refetch function
  };
}