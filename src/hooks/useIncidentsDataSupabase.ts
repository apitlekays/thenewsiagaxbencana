import { useState, useEffect } from 'react';
import createClient from '@/lib/supabase/client';

export interface IncidentReport {
  datetime: string;
  notes_published: string;
}

export function useIncidentDataSupabase() {
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
      
      const supabase = createClient();
      const { data: incidentsData, error: supabaseError } = await supabase
        .from('incidents_reports')
        .select('*')
        .order('datetime', { ascending: false });
      
      if (supabaseError) {
        throw new Error(`Supabase error: ${supabaseError.message}`);
      }
      
      // Transform Supabase data to match expected format
      const transformedIncidents: IncidentReport[] = incidentsData?.map((row: { datetime: string; notes_published: string }) => ({
        datetime: row.datetime,
        notes_published: row.notes_published
      })) || [];
      
      // Only update state if we have new data or this is the first load
      if (transformedIncidents.length > 0 || incidents.length === 0) {
        setIncidents(transformedIncidents);
        setError(null);
        setHasInitialized(true);
        
        // Debug: Log the first few incidents to verify sorting
        if (transformedIncidents.length > 0) {
          console.log('Incidents sorted (newest first):', transformedIncidents.slice(0, 3).map((inc: IncidentReport) => {
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
      const interval = setInterval(() => fetchIncidents(true), 300000); // 5 minutes (emergency traffic reduction)
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
