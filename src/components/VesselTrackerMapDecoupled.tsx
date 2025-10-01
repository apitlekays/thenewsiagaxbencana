"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVessels } from '@/hooks/queries/useVessels';
import { useGroupedVesselPositions } from '@/hooks/useGroupedVesselPositions';
import { useAnimationService } from '@/hooks/useAnimationService';
import { useIncidentData } from '@/hooks/useIncidentData';
import createClient from '@/lib/supabase/client';
import VesselMap from '@/components/VesselMap';
import Timeline from '@/components/Timeline';
import TestPulsingAnimation from '@/components/TestPulsingAnimation';

export default function VesselTrackerMap() {
  const disablePathways = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DISABLE_PATHWAYS === '1';
  const disableTimeline = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DISABLE_TIMELINE === '1';

  const { loading: vesselsLoading, error: vesselsError } = useVessels();
  const { vesselPositions, loading: positionsLoading, error: positionsError } = useGroupedVesselPositions({ enabled: !disablePathways });
  const { timelineData, timelineRange, isLoading: timelineLoading, loadTimelineData } = useAnimationService({ enabled: !disableTimeline });
  const { incidents, error: incidentsError } = useIncidentData();
  
  // Lazy Supabase client - will be created when first needed
  const getSupabase = () => createClient();
  
  // Timeline state - always visible, load asynchronously
  const [animatedVessels, setAnimatedVessels] = useState<Array<{name: string, lat: number, lng: number, origin: string | null, course: number | null}> | null>(null);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [currentTimelineFrame, setCurrentTimelineFrame] = useState<number>(0);
  
  // Ref to track last frame index to prevent unnecessary updates
  const lastFrameIndexRef = useRef<number>(-1);

  // Load timeline data automatically when component mounts
  useEffect(() => {
    if (!disableTimeline) {
      loadTimelineData();
    }
  }, [loadTimelineData, disableTimeline]);

  // Log incident data updates
  useEffect(() => {
    if (incidentsError) {
      console.error('❌ Incident data error:', incidentsError);
    }
  }, [incidentsError]);

  const loading = vesselsLoading || (!disablePathways && positionsLoading);
  const error = vesselsError || (!disablePathways && positionsError ? new Error(positionsError) : null);

  // Handle timeline frame updates
  const handleFrameUpdate = useCallback(async (frame: { vessels: Array<{name: string, lat: number, lng: number, origin: string | null, course: number | null}> }, frameIndex: number) => {
    // Always update vessels when timeline is playing
    if (isTimelinePlaying) {
      lastFrameIndexRef.current = frameIndex;
      
      // If this is the last frame, fetch the latest vessel positions to ensure sync
      if (frameIndex === timelineData.length - 1) {
        try {
          // Fetch latest vessel positions from database
          const { data: latestVessels, error } = await getSupabase()
            .from('vessels')
            .select('name, latitude, longitude, origin, course')
            .eq('status', 'active')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (!error && latestVessels) {
            // Convert to timeline format
            const latestVesselData = latestVessels.map((vessel: {
              name: string;
              latitude: string;
              longitude: string;
              origin: string | null;
              course: number | null;
            }) => ({
              name: vessel.name,
              lat: parseFloat(vessel.latitude),
              lng: parseFloat(vessel.longitude),
              origin: vessel.origin,
              course: vessel.course
            }));
            
            setAnimatedVessels(latestVesselData);
          } else {
            // Fallback to timeline frame data
            setAnimatedVessels(frame.vessels);
          }
        } catch (err) {
          console.error('Error fetching latest vessel positions:', err);
          // Fallback to timeline frame data
          setAnimatedVessels(frame.vessels);
        }
      } else {
        // Use timeline frame data for all other frames
        setAnimatedVessels(frame.vessels);
      }
      
      setCurrentTimelineFrame(frameIndex);
    }
  }, [isTimelinePlaying, timelineData.length]); // Keep dependency to ensure we have latest play state

  // Handle timeline play state changes
  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsTimelinePlaying(playing);
    if (!playing) {
      // When timeline stops, clear animated vessels and reset frame index
      setAnimatedVessels(null);
      lastFrameIndexRef.current = -1;
    }
  }, []);

  // Handle vessel click
  const handleVesselClick = useCallback(() => {
    // Could add vessel details modal or other interactions here
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Error Loading Map</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Test Pulsing Animation */}
      <TestPulsingAnimation 
        currentTimelineFrame={
          isTimelinePlaying
            ? currentTimelineFrame
            : (timelineData && timelineData.length > 0 ? timelineData.length - 1 : undefined)
        }
      />
      
      {/* Map Component */}
      <VesselMap 
        onVesselClick={handleVesselClick}
        showPathways={true}
        vesselPositions={vesselPositions}
        animatedVessels={animatedVessels}
        timelineData={timelineData}
        currentTimelineFrame={
          isTimelinePlaying
            ? currentTimelineFrame
            : (timelineData && timelineData.length > 0 ? timelineData.length - 1 : undefined)
        }
      />

      {/* Timeline Component - Always visible, loads asynchronously */}
      <Timeline
        timelineData={timelineData}
        timelineRange={timelineRange}
        incidents={incidents}
        isVisible={true}
        onFrameUpdate={handleFrameUpdate}
        onPlayStateChange={handlePlayStateChange}
      />
      
      {/* Timeline Loading Indicator */}
      {timelineLoading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm">
          Loading Timeline...
        </div>
      )}
      
      {/* Incident Loading Indicator 
      {incidentsLoading && (
        <div className="absolute bottom-4 left-32 z-[1000] bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm">
          Loading Incidents...
        </div>
      )}
      
      {/* Incident Data Status
      {!incidentsLoading && incidents.length > 0 && lastFetch && (
        <div className="absolute bottom-4 left-32 z-[1000] bg-green-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm">
          {incidents.length} incidents loaded
        </div>
      )}
      */}
    </div>
  );
}
