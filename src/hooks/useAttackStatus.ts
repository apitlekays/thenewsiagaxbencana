"use client";

import { useState, useEffect, useCallback } from 'react';

export interface AttackStatus {
  vessel_name: string;
  status: 'repairing' | 'attacked' | 'emergency';
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
      
      // Fetch data from Google Sheet
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRODXd6UHeb_ayDrGm_G61cmHMsAZcjOPbM8yfwXQdymVxCBOomvhdTFsl3gEVnH5l6T4WUQGIamgEO/pub?output=csv',
        {
          method: 'GET',
          headers: {
            'Accept': 'text/csv',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch attack status: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      
      // Parse CSV data
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Find header indices
      const vesselNameIndex = headers.findIndex(h => h.toLowerCase().includes('vessel') || h.toLowerCase().includes('name'));
      const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'));
      
      if (vesselNameIndex === -1 || statusIndex === -1) {
        throw new Error('Invalid CSV format: missing vessel_name or status headers');
      }

      // Parse data rows
      const newAttackStatuses: AttackStatusData = {};
      
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
        
        if (row.length >= Math.max(vesselNameIndex, statusIndex) + 1) {
          const vesselName = row[vesselNameIndex];
          const status = row[statusIndex].toLowerCase();
          
          // Validate status
          if (status === 'repairing' || status === 'attacked' || status === 'emergency') {
            newAttackStatuses[vesselName] = status as AttackStatus['status'];
          }
        }
      }

      setAttackStatuses(newAttackStatuses);
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

  // Set up polling every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAttackStatus, 5 * 60 * 1000); // 5 minutes
    
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
