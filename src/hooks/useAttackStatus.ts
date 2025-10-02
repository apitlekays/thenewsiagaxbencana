"use client";

import { useState, useEffect, useCallback } from 'react';

export interface AttackStatus {
  vessel_name: string;
  status: 'attacked' | 'emergency';
}

export interface AttackStatusData {
  [vesselName: string]: AttackStatus['status'];
}

export function useAttackStatus() {
  const [attackStatuses, setAttackStatuses] = useState<AttackStatusData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchAttackStatus = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/attack-status');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attack status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch attack status');
      }
      
      setAttackStatuses(data.attackStatuses);
      setLastChecked(new Date());
      
    } catch (err) {
      console.error('Error fetching attack status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAttackStatus();
  }, [fetchAttackStatus]);

  // Set up polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAttackStatus, 30 * 1000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchAttackStatus]);

  return {
    attackStatuses,
    loading,
    error,
    lastChecked,
    refetch: fetchAttackStatus
  };
}
