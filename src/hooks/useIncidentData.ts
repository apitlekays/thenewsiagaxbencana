"use client";

import { useState, useEffect, useCallback } from 'react';

export interface IncidentData {
  timestamp_utc: string;
  event_type: string;
  title: string;
  description: string;
  location: string;
  severity: 'warning' | 'critical';
  source_url: string;
  icon: string;
  category: string;
}

export function useIncidentData() {
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbFZIfnaSBO-35ApiFBiFZdjw8Ak6ifBLs9bRqDgLGC294-CksS6mpOXtPH3Ec-QY0eoQP7qN7b8TC/pub?output=csv',
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch incidents: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const incidents = parseCSVToIncidents(csvText);
      
      setIncidents(incidents);
      setLastFetch(new Date());
    } catch (err) {
      console.error('❌ Error fetching incidents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Set up 15-minute polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchIncidents();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    lastFetch,
    refetch: fetchIncidents,
  };
}

function parseCSVToIncidents(csvText: string): IncidentData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);
  
  return dataLines
    .map(line => {
      // Parse CSV line (handle commas within quotes)
      const values = parseCSVLine(line);
      
      if (values.length < 9) return null;

      return {
        timestamp_utc: values[0]?.trim() || '',
        event_type: values[1]?.trim() || '',
        title: values[2]?.trim() || '',
        description: values[3]?.trim() || '',
        location: values[4]?.trim() || '',
        severity: (values[5]?.trim().toLowerCase() as 'warning' | 'critical') || 'warning',
        source_url: values[6]?.trim() || '',
        icon: values[7]?.trim() || '',
        category: values[8]?.trim() || '',
      };
    })
    .filter((incident): incident is IncidentData => incident !== null)
    .sort((a, b) => new Date(a.timestamp_utc).getTime() - new Date(b.timestamp_utc).getTime());
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}
