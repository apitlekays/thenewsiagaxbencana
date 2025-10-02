"use client";

import { useState, useEffect, useCallback } from 'react';
import createClient from '../lib/supabase/client';

export interface AttackStatus {
  vessel_name: string;
  status: 'attacked' | 'emergency';
}

export interface AttackStatusData {
  [vesselName: string]: AttackStatus['status'];
}

export function useAttackStatus() {
  const [attackStatuses, setAttackStatuses] = useState<AttackStatusData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchAttackStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch attack status directly from Supabase
      const supabase = createClient();
      const { data: supabaseData, error } = await supabase
        .from('attack_status')
        .select('vessel_name, status')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (supabaseData && supabaseData.length > 0) {
        // Transform array data to the expected object format
        const attackStatusesObj: AttackStatusData = {};
        supabaseData.forEach((item: { vessel_name: string; status: 'attacked' | 'emergency' }) => {
          attackStatusesObj[item.vessel_name] = item.status;
        });
        
        setAttackStatuses(attackStatusesObj);
      } else {
        setAttackStatuses({});
      }
      
      setLastChecked(new Date());
      setHasInitialized(true);
      
    } catch (err) {
      console.error('Error fetching attack status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHasInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up polling only after initial fetch
  useEffect(() => {
    if (hasInitialized) {
      const interval = setInterval(fetchAttackStatus, 30 * 1000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [hasInitialized, fetchAttackStatus]);

  return {
    attackStatuses,
    loading,
    error,
    lastChecked,
    hasInitialized,
    refetch: fetchAttackStatus,
    initialize: () => {
      if (!hasInitialized) {
        fetchAttackStatus();
      }
    }
  };
}
