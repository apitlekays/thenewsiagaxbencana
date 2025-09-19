"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Vessel {
  id: number;
  gsf_id: number;
  name: string;
  mmsi: string | null;
  latitude: number;
  longitude: number;
  timestamp_utc: string;
  vessel_status: string;
  origin: string | null;
  speed_kmh: number | null;
  speed_knots: number | null;
  course: number | null;
  type: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VesselPosition {
  id: number;
  vessel_id: number | null;
  gsf_vessel_id: number;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  speed_knots: number | null;
  course: number | null;
  timestamp_utc: string;
  created_at: string;
}

export function useVessels() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchVessels = async () => {
      try {
        const { data, error } = await supabase
          .from('vessels')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setVessels(data || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vessels');
        setLoading(false);
      }
    };

    fetchVessels();

    // Set up real-time subscription
    const subscription = supabase
      .channel('vessels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vessels',
          filter: 'status=eq.active'
        },
        (payload) => {
          console.log('Vessel change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setVessels(prev => [...prev, payload.new as Vessel]);
          } else if (payload.eventType === 'UPDATE') {
            setVessels(prev => 
              prev.map(vessel => 
                vessel.id === payload.new.id ? payload.new as Vessel : vessel
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setVessels(prev => 
              prev.filter(vessel => vessel.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { vessels, loading, error };
}

export function useVesselPositions(vesselId?: number) {
  const [positions, setPositions] = useState<VesselPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vesselId) {
      setPositions([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchPositions = async () => {
      try {
        const { data, error } = await supabase
          .from('vessel_positions')
          .select('*')
          .eq('vessel_id', vesselId)
          .order('timestamp_utc', { ascending: false })
          .limit(100); // Limit to recent positions

        if (error) throw error;
        setPositions(data || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch positions');
        setLoading(false);
      }
    };

    fetchPositions();

    // Set up real-time subscription for this vessel's positions
    const subscription = supabase
      .channel(`vessel-positions-${vesselId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vessel_positions',
          filter: `vessel_id=eq.${vesselId}`
        },
        (payload) => {
          console.log('Position change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPositions(prev => [payload.new as VesselPosition, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPositions(prev => 
              prev.map(position => 
                position.id === payload.new.id ? payload.new as VesselPosition : position
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPositions(prev => 
              prev.filter(position => position.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [vesselId]);

  return { positions, loading, error };
}
