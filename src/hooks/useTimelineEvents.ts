import { useState, useEffect, useCallback } from 'react';
import { TimelineEvent } from '@/types/vessel';

// Cache for timeline events to avoid repeated API calls
const eventsCache = new Map<string, TimelineEvent[]>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function useTimelineEvents() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchTimelineEvents = useCallback(async () => {
    const cacheKey = 'timeline_events';
    
    // Check cache first
    const cached = eventsCache.get(cacheKey);
    const cachedExpiry = cacheExpiry.get(cacheKey);
    
    if (cached && cachedExpiry && Date.now() < cachedExpiry) {
      setEvents(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, get the CSV URL from the webhook endpoint
      const webhookResponse = await fetch('https://flotillatracker.siagax.com/webhook/timelineevents');
      
      if (!webhookResponse.ok) {
        throw new Error(`Failed to fetch webhook URL: ${webhookResponse.status}`);
      }
      
      const csvUrl = await webhookResponse.text();
      
      if (!csvUrl) {
        throw new Error('No URL returned from webhook');
      }
      
      // Now fetch the CSV data using the URL from the webhook
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timeline events: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      // Parse CSV data with proper CSV parsing
      const eventData: TimelineEvent[] = [];
      
      // Function to parse CSV line properly handling quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add the last field
        result.push(current.trim());
        return result;
      };
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = parseCSVLine(lines[i]);
          if (values.length >= 9) {
            const event: TimelineEvent = {
              timestamp_utc: values[0] || '',
              event_type: values[1] || '',
              title: values[2] || '',
              description: values[3] || '',
              location: values[4] || '',
              severity: (values[5] as 'info' | 'warning' | 'critical' | 'success') || 'info',
              source_url: values[6] || undefined,
              icon: values[7] || 'info',
              category: values[8] || ''
            };
            eventData.push(event);
          }
        }
      }
      
      // Sort by timestamp (oldest first for timeline)
      eventData.sort((a, b) => {
        const dateA = new Date(a.timestamp_utc);
        const dateB = new Date(b.timestamp_utc);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Cache the data
      eventsCache.set(cacheKey, eventData);
      cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
      
      setEvents(eventData);
      setLastRefresh(new Date());
      setError(null);
      
    } catch (err) {
      console.error('Error fetching timeline events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimelineEvents();
  }, [fetchTimelineEvents]);

  return { 
    events, 
    isLoading, 
    error, 
    lastRefresh, 
    refetch: fetchTimelineEvents 
  };
}
