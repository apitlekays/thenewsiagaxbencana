import { useState, useEffect } from 'react';
import createClient from '@/lib/supabase/client';

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

const supabase = createClient();

export function useVessels() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
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

    // Set up realtime subscription
    const channel = supabase
      .channel('vessels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vessels',
          filter: 'status=eq.active',
        },
        (payload) => {
          console.log('Vessel change received:', payload);
          fetchVessels(); // Refetch on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        let query = supabase
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
    };

    fetchPositions();

    // Set up realtime subscription
    const channel = supabase
      .channel('vessel-positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vessel_positions',
        },
        (payload) => {
          console.log('Vessel position change received:', payload);
          fetchPositions(); // Refetch on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vesselId]);

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
      console.log('🔄 Fetching all vessel positions...');
      const { data, error } = await supabase
        .from('vessel_positions')
        .select('*')
        .order('timestamp_utc', { ascending: true })
        .limit(50000); // Explicitly set high limit to get all positions

      if (error) throw error;
      console.log(`✅ Fetched ${data?.length || 0} positions`);
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

    // Set up realtime subscription
    const channel = supabase
      .channel('all-vessel-positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vessel_positions',
        },
        (payload) => {
          console.log('All vessel position change received:', payload);
          fetchAllPositions(); // Refetch on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    positions,
    loading,
    error,
    refetch: fetchAllPositions, // Expose manual refetch function
  };
}