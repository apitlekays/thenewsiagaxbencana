"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import createClient from '@/lib/supabase/client';
import { useUIStore } from '@/store/uiStore';
import { requestDeduplicator } from '@/lib/requestDeduplicator';
import { subscriptionManager } from '@/lib/subscriptionManager';

// Types
export interface TimelineFrame {
  timestamp: string;
  vessels: Array<{
    name: string;
    lat: number;
    lng: number;
    origin: string | null;
    course: number | null;
    speed_knots?: number | null;
    speed_kmh?: number | null;
  }>;
}

export interface TimelineRange {
  start: string;
  end: string;
}

// Animation Service Hook
export function useAnimationService(options?: { enabled?: boolean }) {
  const isDisabledViaEnv = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DISABLE_TIMELINE === '1';
  const enabled = options?.enabled !== undefined ? options.enabled : !isDisabledViaEnv;
  const [timelineData, setTimelineData] = useState<TimelineFrame[]>([]);
  const [timelineRange, setTimelineRange] = useState<TimelineRange | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get time range filter selectively from UI store (reduces re-renders)
  const timeRangeFilter = useUIStore(state => state.timeRangeFilter);

  // Debounce ref to track timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedTimeRange, setDebouncedTimeRange] = useState(timeRangeFilter);

  // Debounce time range changes to prevent rapid successive API calls
  useEffect(() => {
    if (!enabled) return; // disabled: skip debounce wiring
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedTimeRange(timeRangeFilter);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [timeRangeFilter]);

  // Calculate date threshold based on time range filter
  const getDateThreshold = (range: '48h' | '7d' | '2w' | 'all'): string | null => {
    if (range === 'all') return null;
    
    const now = Date.now();
    let hoursBack = 48; // Default 48h
    
    switch (range) {
      case '48h': hoursBack = 48; break;
      case '7d': hoursBack = 7 * 24; break;
      case '2w': hoursBack = 14 * 24; break;
    }
    
    const thresholdDate = new Date(now - hoursBack * 60 * 60 * 1000);
    return thresholdDate.toISOString();
  };

  // Load timeline data from pre-processed timeline_frames table
  const loadTimelineData = useCallback(async () => {
    if (!enabled) {
      setTimelineData([]);
      setTimelineRange(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Calculate date threshold for filtering
      const dateThreshold = getDateThreshold(debouncedTimeRange);

      // Use deduplicated query for timeline frames
      const queryKey = `timeline-frames:${debouncedTimeRange}:${dateThreshold || 'all'}`;
      
      const { data: frames, error: fetchError } = await requestDeduplicator.deduplicateSupabaseQuery(
        queryKey,
        async () => {
          // Build query with optional time filtering
          let query = supabase
            .from('timeline_frames')
            .select('frame_timestamp, frame_index, vessels_data')
            .order('frame_index', { ascending: true });

          // Apply time range filter if not 'all'
          if (dateThreshold) {
            query = query.gte('frame_timestamp', dateThreshold);
          }

          const result = await query;
          return { data: result.data, error: result.error };
        },
        1 * 60 * 1000 // 1 minute cache TTL for timeline frames
      );

      if (fetchError) {
        throw new Error(`Failed to fetch timeline frames: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }

      if (!frames || frames.length === 0) {
        return;
      }

      // Convert database frames to TimelineFrame format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timeline: TimelineFrame[] = frames.map((frame: any) => ({
        timestamp: frame.frame_timestamp,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vessels: frame.vessels_data.map((vessel: any) => ({
          name: vessel.name,
          lat: vessel.lat,
          lng: vessel.lng,
          origin: vessel.origin,
          course: vessel.course || null, // Include course data for heading visualization
          speed_knots: vessel.speed_knots || null,
          speed_kmh: vessel.speed_kmh || null
        }))
      }));

      setTimelineData(timeline);
      if (timeline.length > 0) {
        setTimelineRange({
          start: timeline[0].timestamp,
          end: timeline[timeline.length - 1].timestamp
        });
      }
    } catch (err) {
      console.error('❌ Error loading timeline data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedTimeRange, enabled]);

  // Clear timeline data
  const clearTimelineData = useCallback(() => {
    setTimelineData([]);
    setTimelineRange(null);
    setError(null);
  }, []);

  // Watch for time range filter changes and reload timeline data
  useEffect(() => {
    if (!enabled) {
      setTimelineData([]);
      setTimelineRange(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    clearTimelineData();
    loadTimelineData();
  }, [debouncedTimeRange, clearTimelineData, loadTimelineData, enabled]);

  // Subscribe to realtime updates on timeline_frames and reload on change
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscriptionManager.subscribeToTimelineFrames(
      () => {
        // cache is already invalidated centrally; just reload
        loadTimelineData();
      },
      'useAnimationService'
    );
    return unsubscribe;
  }, [loadTimelineData, enabled]);

  return {
    timelineData,
    timelineRange,
    isLoading,
    error,
    loadTimelineData,
    clearTimelineData
  };
}