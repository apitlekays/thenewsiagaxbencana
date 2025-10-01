import { useState, useEffect } from 'react';

export interface IncidentReport {
  datetime: string;
  notes_published: string;
}

export function useIncidentsData() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async (isRefresh = false) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setRefreshing(true);
      } else if (incidents.length === 0) {
        setLoading(true);
      }
      
      const response = await fetch('/api/incidents');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch incidents: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch incidents');
      }
      
      // Only update state if we have new data or this is the first load
      if (data.incidents.length > 0 || incidents.length === 0) {
        setIncidents(data.incidents);
        setError(null);
        
        // Debug: Log the first few incidents to verify sorting
        if (data.incidents.length > 0) {
          console.log('Incidents sorted (newest first):', data.incidents.slice(0, 3).map((inc: IncidentReport) => {
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
      // Only set error if we don't have existing data
      if (incidents.length === 0) {
        setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchIncidents();
    
    // Set up polling every 15 seconds
    const interval = setInterval(() => fetchIncidents(true), 15000);
    
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    incidents,
    loading,
    refreshing,
    error,
    refetch: () => fetchIncidents(true)
  };
}
