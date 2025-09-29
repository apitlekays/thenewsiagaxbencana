"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Plane, Flame, Clock } from 'lucide-react';
import packageJson from '../../package.json';
import { IncidentData } from '../hooks/useIncidentData';
import IncidentPopup from './IncidentPopup';
import { useUIStore } from '@/store/uiStore';

// Debounce hook to prevent rapid successive API calls
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Timeline data types
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

// Timeline events for communication with map
export const TIMELINE_EVENTS = {
  PLAY: 'timeline:play',
  PAUSE: 'timeline:pause',
  SEEK: 'timeline:seek',
  FRAME_UPDATE: 'timeline:frame-update',
  RESET: 'timeline:reset',
  SPEED_CHANGE: 'timeline:speed-change'
} as const;

interface TimelineProps {
  timelineData: TimelineFrame[];
  timelineRange: TimelineRange | null;
  incidents?: IncidentData[];
  isVisible?: boolean;
  onFrameUpdate?: (frame: TimelineFrame, frameIndex: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function Timeline({ 
  timelineData, 
  timelineRange, 
  incidents = [],
  isVisible = true,
  onFrameUpdate,
  onPlayStateChange 
}: TimelineProps) {
  // Timeline state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.5);
  
  // Incident popup state
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);
  const [isManualPopup, setIsManualPopup] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);

  // Refs for stable animation dependencies (after all state declarations)
  const playbackSpeedRef = useRef(1.5);
  const timelineLengthRef = useRef(0);
  const timelineDataRef = useRef(timelineData);
  const incidentsRef = useRef(incidents);
  const isPlayingRef = useRef(isPlaying);
  const isPlaybackPausedRef = useRef(isPlaybackPaused);

  // Get time range filter selectively from UI store (reduces re-renders)
  const timeRangeFilter = useUIStore(state => state.timeRangeFilter);
  const setTimeRangeFilter = useUIStore(state => state.setTimeRangeFilter);

  // Debounce time range changes to prevent rapid successive API calls
  useDebounce(timeRangeFilter, 300); // Debounced time range used for prevention

  // Time range options
  const timeRangeOptions = useMemo(() => [
    { value: '48h', label: '48 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '2w', label: '2 Weeks' },
    { value: 'all', label: 'All Time' },
  ], []);

  // Handle time range change with immediate UI update but debounced API calls
  const handleTimeRangeChange = (newRange: '48h' | '7d' | '2w' | 'all') => {
    setTimeRangeFilter(newRange);
  };

  // Update refs when values change (stable references for animation)
  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    timelineLengthRef.current = timelineData.length;
    timelineDataRef.current = timelineData;
  }, [timelineData.length, timelineData]);

  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPlaybackPausedRef.current = isPlaybackPaused;
  }, [isPlaybackPaused]);

  // Initialize timeline position to end when data loads
  useEffect(() => {
    if (timelineData.length > 0) {
      setCurrentTime(timelineData.length - 1);
    }
  }, [timelineData.length]);

  // Animation using direct useEffect approach
  useEffect(() => {
    if (!isPlaying || isPlaybackPaused) return;

    // Check if current frame has an incident (uses refs for stability)
    const getCurrentFrameIncident = (frameIndex: number): IncidentData | null => {
      const currentTimelineData = timelineDataRef.current;
      const currentIncidents = incidentsRef.current;
      
      if (!currentTimelineData || currentTimelineData.length === 0 || currentIncidents.length === 0) {
        return null;
      }
      
      const currentFrame = currentTimelineData[frameIndex];
      if (!currentFrame) {
        return null;
      }
      
      const currentFrameTime = normalizeTimestamp(currentFrame.timestamp);
      
      // Find incidents that match the current frame time (within a small tolerance)
      const tolerance = 30 * 60 * 1000; // 30 minutes tolerance
      
      for (const incident of currentIncidents) {
        const incidentTime = normalizeTimestamp(incident.timestamp_utc);
        const timeDiff = Math.abs(incidentTime - currentFrameTime);
        
        if (timeDiff <= tolerance) {
          return incident;
        }
      }
      
      return null;
    };

    const intervalId = setInterval(() => {
      setCurrentTime(prev => {
        const nextTime = prev + playbackSpeedRef.current;
        if (nextTime >= timelineLengthRef.current - 1) {
          // Stop playing
          setIsPlaying(false);
          return timelineLengthRef.current - 1;
        }
        
        // Check if the next frame has an incident
        const currentFrameIndex = Math.floor(nextTime);
        const nextFrameIncident = getCurrentFrameIncident(currentFrameIndex);
        if (nextFrameIncident) {
          // Pause playback and show incident popup
          setIsPlaying(false);
          setSelectedIncident(nextFrameIncident);
          setIsManualPopup(false);
          setIsPlaybackPaused(true);
          return prev; // Don't advance the frame
        }
        
        return nextTime;
      });
    }, 100); // 10fps for smoother, less jittery playback

    return () => clearInterval(intervalId);
  }, [isPlaying, isPlaybackPaused]); // Remove unstable dependencies

  // Handle end of timeline detection
  useEffect(() => {
    if (isPlaying && currentTime >= timelineData.length - 1) {
      setIsPlaying(false);
    }
  }, [currentTime, isPlaying, timelineData.length]);

  // Notify play state changes
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Notify frame updates - use exact frames only for stable playback
  useEffect(() => {
    const frameIndex = Math.floor(currentTime);
    if (timelineData[frameIndex] && onFrameUpdate) {
      onFrameUpdate(timelineData[frameIndex], frameIndex);
    }
  }, [currentTime, timelineData, onFrameUpdate]);

  // Playback controls
  const togglePlayPause = () => {
    if (!isPlaying) {
      // When starting playback, reset to beginning
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const resetTimeline = () => {
    setIsPlaying(false);
    setCurrentTime(timelineData.length - 1);
  };

  const skipToStart = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const skipToEnd = () => {
    setIsPlaying(false);
    setCurrentTime(timelineData.length - 1);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  // Normalize timestamp to handle different formats (UTC, with/without Z, with/without timezone)
  const normalizeTimestamp = (timestamp: string): number => {
    // Handle different timestamp formats
    let normalizedTimestamp = timestamp;
    
    // If timestamp doesn't end with Z or have timezone info, assume it's UTC
    if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
      normalizedTimestamp = timestamp + 'Z';
    }
    
    const date = new Date(normalizedTimestamp);
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return 0;
    }
    
    return date.getTime();
  };

  // Find the interpolated position for an incident timestamp
  const getIncidentPosition = (incidentTimestamp: string) => {
    if (!timelineData || timelineData.length === 0) return -1;
    
    const incidentTime = normalizeTimestamp(incidentTimestamp);
    
    // Find the two frames that bracket the incident time
    let beforeFrameIndex = -1;
    let afterFrameIndex = -1;
    
    // Find the frame just before the incident time
    for (let i = 0; i < timelineData.length; i++) {
      const frameTime = normalizeTimestamp(timelineData[i].timestamp);
      if (frameTime <= incidentTime) {
        beforeFrameIndex = i;
      } else {
        afterFrameIndex = i;
        break;
      }
    }
    
    // Handle edge cases
    if (beforeFrameIndex === -1) {
      // Incident is before all frames
      return 0;
    }
    
    if (afterFrameIndex === -1) {
      // Incident is after all frames
      return 100;
    }
    
    // Interpolate between the two frames
    const beforeTime = normalizeTimestamp(timelineData[beforeFrameIndex].timestamp);
    const afterTime = normalizeTimestamp(timelineData[afterFrameIndex].timestamp);
    
    let interpolatedFrameIndex;
    
    if (beforeTime === afterTime) {
      // Same timestamp, use the frame index directly
      interpolatedFrameIndex = beforeFrameIndex;
    } else {
      // Linear interpolation between frames
      const timeRatio = (incidentTime - beforeTime) / (afterTime - beforeTime);
      interpolatedFrameIndex = beforeFrameIndex + timeRatio * (afterFrameIndex - beforeFrameIndex);
    }
    
    // Calculate position percentage
    const position = (interpolatedFrameIndex / (timelineData.length - 1)) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    
    return clampedPosition;
  };

  // Get icon component based on icon type
  const getIncidentIcon = (iconType: string) => {
    switch (iconType.toLowerCase()) {
      case 'fire':
        return <Flame className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'plane':
        return <Plane className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Plane className="w-3 h-3 sm:w-4 sm:h-4" />; // Default to plane
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 border-red-400';
      case 'warning':
        return 'bg-orange-500 border-orange-400';
      default:
        return 'bg-gray-500 border-gray-400';
    }
  };

  // Handle incident marker click
  const handleIncidentClick = (incident: IncidentData) => {
    setSelectedIncident(incident);
    setIsManualPopup(true);
    setIsPlaybackPaused(false);
  };

  // Handle popup close
  const handlePopupClose = () => {
    setSelectedIncident(null);
    setIsManualPopup(false);
    setIsPlaybackPaused(false);
  };

  // Handle continue playback
  const handleContinuePlayback = () => {
    setSelectedIncident(null);
    setIsManualPopup(false);
    setIsPlaybackPaused(false);
    
    // Advance the timeline by a few frames to avoid immediately triggering the same incident
    setCurrentTime(prev => {
      const advanceFrames = 10; // Advance by 10 frames (about 1 minute at 10fps)
      const newTime = Math.min(prev + advanceFrames, timelineLengthRef.current - 1);
      return newTime;
    });
    
    // Start playing after advancing
    setTimeout(() => {
      setIsPlaying(true);
    }, 100); // Small delay to ensure state updates are processed
  };


  // Don't render if not visible or no data
  if (!isVisible || timelineData.length === 0 || !timelineRange) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 z-[1000] w-[calc(100%-170px)]">
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-2 sm:p-4 shadow-2xl border border-slate-700">
        {/* Timeline Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-xs sm:text-sm font-semibold text-white">Vessel Timeline</h3>
            <div className="text-xs text-slate-400 hidden sm:block">
              {timelineData.length} frames • {timelineRange.start.split('T')[0]} to {timelineRange.end.split('T')[0]}
            </div>
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Time Range Control */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 text-slate-400" />
              <select 
                value={timeRangeFilter} 
                onChange={(e) => handleTimeRangeChange(e.target.value as '48h' | '7d' | '2w' | 'all')}
                className="bg-slate-800 text-white text-xs px-1 sm:px-2 py-1 rounded border border-slate-600 hover:bg-slate-700"
                title="Select time range"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Speed:</span>
              <select 
                value={playbackSpeed} 
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="bg-slate-800 text-white text-xs px-1 sm:px-2 py-1 rounded border border-slate-600 hover:bg-slate-700"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Playback Controls and Timeline */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* Control Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={skipToStart}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded transition-colors"
              title="Skip to start"
            >
              <SkipBack className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-2 sm:p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
              )}
            </button>
            
            <button
              onClick={skipToEnd}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded transition-colors"
              title="Skip to end"
            >
              <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </button>
            
            <button
              onClick={resetTimeline}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex-1 relative">
            {/* Timeline Track */}
            <div className="h-6 sm:h-8 bg-slate-800 rounded-lg relative overflow-hidden">
              {/* Time Markers */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex-1 border-r border-slate-700 relative">
                    
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div 
                className="absolute top-0 left-0 h-full bg-blue-600/30 transition-all duration-100"
                style={{ width: `${(currentTime / (timelineData.length - 1)) * 100}%` }}
              />
              
              {/* Scrubber Handle */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-3 h-4 sm:w-4 sm:h-6 bg-blue-500 rounded-sm shadow-lg cursor-pointer hover:bg-blue-400 transition-colors z-10"
                style={{ left: `calc(${(currentTime / (timelineData.length - 1)) * 100}% - 6px)` }}
              />
            </div>
            
            {/* Incident Markers - Outside timeline track container */}
            {incidents.map((incident, index) => {
              const position = getIncidentPosition(incident.timestamp_utc);
              if (position === -1) {
                return null; // Skip incidents outside timeline range
              }
              
              return (
                <div key={`incident-${index}`} className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>
                  {/* Dashed vertical line - positioned relative to timeline track */}
                  <div 
                    className="absolute w-0.5 border-l-2 border-dashed border-red-500 pointer-events-none"
                    style={{ 
                      left: `${position}%`, 
                      top: '0px',
                      height: '32px', // h-8 = 32px
                      marginLeft: '-1px',
                      zIndex: 90
                    }}
                  />
                  
                  {/* Circle with icon at top - positioned above timeline track */}
                  <button
                    onClick={() => handleIncidentClick(incident)}
                    className={`absolute w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 ${getSeverityColor(incident.severity)} flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer pointer-events-auto`}
                    style={{ 
                      left: `${position}%`, 
                      top: '-8px', // Position above the timeline track
                      transform: 'translateX(-50%)',
                      zIndex: 100
                    }}
                    title={`${incident.title} - ${incident.severity} (Click for details)`}
                  >
                    {getIncidentIcon(incident.icon)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Time Display */}
        <div className="text-left sm:text-center">
          <div className="text-xs text-slate-400">
            Frame: {Math.floor(currentTime)} / {timelineData.length - 1}
          </div>
          {timelineData[Math.floor(currentTime)] && (
            <div className="text-xs text-white font-mono">
              {new Date(timelineData[Math.floor(currentTime)].timestamp).toLocaleString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'UTC'
              })}
            </div>
          )}
        </div>
        
        {/* Version Number */}
        <div className="absolute bottom-2 right-2 text-xs text-slate-500">
          v.{packageJson.version}
        </div>
      </div>

      {/* Incident Popup */}
      <IncidentPopup
        incident={selectedIncident!}
        isVisible={!!selectedIncident}
        onClose={handlePopupClose}
        showContinueButton={!isManualPopup && isPlaybackPaused}
        onContinue={handleContinuePlayback}
      />
      <div className="z-[1000] text-slate-400 px-3 py-1.5 text-xs text-center">
        Developed by <a href="https://www.mapim.org" className="text-blue-500">MAPIM MALAYSIA</a>
      </div>
    </div>
  );
}
