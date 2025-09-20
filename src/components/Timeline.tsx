"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

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
  isVisible?: boolean;
  onFrameUpdate?: (frame: TimelineFrame, frameIndex: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function Timeline({ 
  timelineData, 
  timelineRange, 
  isVisible = true,
  onFrameUpdate,
  onPlayStateChange 
}: TimelineProps) {
  // Timeline state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.5);
  const playbackSpeedRef = useRef(1.5);
  const timelineLengthRef = useRef(0);

  // Update refs when values change
  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    timelineLengthRef.current = timelineData.length;
  }, [timelineData.length]);

  // Initialize timeline position to end when data loads
  useEffect(() => {
    if (timelineData.length > 0) {
      setCurrentTime(timelineData.length - 1);
    }
  }, [timelineData.length]);

  // Animation using direct useEffect approach
  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      setCurrentTime(prev => {
        const nextTime = prev + playbackSpeedRef.current;
        if (nextTime >= timelineLengthRef.current - 1) {
          // Stop playing
          setIsPlaying(false);
          return timelineLengthRef.current - 1;
        }
        return nextTime;
      });
    }, 100); // 10fps for smoother, less jittery playback

    return () => clearInterval(intervalId);
  }, [isPlaying]); // Only depend on isPlaying, not the animate function

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
          
          {/* Speed Control */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Speed:</span>
            <select 
              value={playbackSpeed} 
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="bg-slate-800 text-white text-xs px-1 sm:px-2 py-1 rounded border border-slate-600"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
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
                    <div className="absolute top-0.5 left-0.5 text-xs text-slate-500 hidden sm:block">
                      {i === 0 ? 'Start' : i === 9 ? 'End' : ''}
                    </div>
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
                className="absolute top-1/2 transform -translate-y-1/2 w-3 h-4 sm:w-4 sm:h-6 bg-blue-500 rounded-sm shadow-lg cursor-pointer hover:bg-blue-400 transition-colors"
                style={{ left: `calc(${(currentTime / (timelineData.length - 1)) * 100}% - 6px)` }}
              />
            </div>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="text-center">
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
      </div>
    </div>
  );
}
