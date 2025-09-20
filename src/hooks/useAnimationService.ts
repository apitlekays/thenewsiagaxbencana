"use client";

import { useState, useCallback } from 'react';
import createClient from '@/lib/supabase/client';

// Types
export interface TimelineFrame {
  timestamp: string;
  vessels: Array<{
    name: string;
    lat: number;
    lng: number;
    origin: string | null;
    course: number | null;
  }>;
}

export interface TimelineRange {
  start: string;
  end: string;
}

// Animation Service Hook
export function useAnimationService() {
  const [timelineData, setTimelineData] = useState<TimelineFrame[]>([]);
  const [timelineRange, setTimelineRange] = useState<TimelineRange | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load timeline data from pre-processed timeline_frames table
  const loadTimelineData = useCallback(async () => {
    if (timelineData.length > 0) return; // Already loaded

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch timeline frames from database
      const { data: frames, error: fetchError } = await supabase
        .from('timeline_frames')
        .select('frame_timestamp, frame_index, vessels_data')
        .order('frame_index', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch timeline frames: ${fetchError.message}`);
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
          course: vessel.course || null // Include course data for heading visualization
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
  }, [timelineData.length]);

  // Clear timeline data
  const clearTimelineData = useCallback(() => {
    setTimelineData([]);
    setTimelineRange(null);
    setError(null);
  }, []);

  return {
    timelineData,
    timelineRange,
    isLoading,
    error,
    loadTimelineData,
    clearTimelineData
  };
}