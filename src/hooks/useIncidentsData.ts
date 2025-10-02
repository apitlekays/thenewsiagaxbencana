import { useState, useEffect } from 'react';
import createClient from '../lib/supabase/client';

export interface IncidentReport {
  datetime: string;
  notes_published: string;
}

export function useIncidentsData() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchIncidents = async (isRefresh = false) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch incidents directly from Supabase
      const supabase = createClient();
      const { data: supabaseData, error } = await supabase
        .from('incidents_reports')
        .select('datetime, notes_published')
        .order('datetime', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Only update state if we have new data or this is the first load
      if (supabaseData && (supabaseData.length > 0 || incidents.length === 0)) {
        setIncidents(supabaseData.map((item: { datetime: string; notes_published: string }) => ({
          datetime: item.datetime,
          notes_published: item.notes_published
        })));
        setError(null);
        setHasInitialized(true);
      
      // Debug: Log the first few incidents to verify sorting
      if (supabaseData && supabaseData.length > 0) {
        console.log('Incidents sorted (newest first):', supabaseData.slice(0, 3).map((inc: { datetime: string; notes_published: string }) => {
          const date = new Date(inc.datetime);
          return {
            datetime: inc.datetime,
            parsed: isNaN(date.getTime()) ? 'Invalid Date' : date.toISOString()
          };
        }));
      }
      }
      
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
      setHasInitialized(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up polling only after initial fetch
  useEffect(() => {
    if (hasInitialized) {
      const interval = setInterval(() => fetchIncidents(true), 15000);
      return () => clearInterval(interval);
    }
  }, [hasInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    incidents,
    loading,
    refreshing,
    error,
    hasInitialized,
    refetch: () => fetchIncidents(true),
    initialize: () => {
      if (!hasInitialized) {
        fetchIncidents();
      }
    }
  };
}
