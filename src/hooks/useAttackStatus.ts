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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchAttackStatus = useCallback(async () => {
    try {
      setLoading(true);
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
      const interval = setInterval(fetchAttackStatus, 300 * 1000); // 5 minutes (emergency traffic reduction)
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
