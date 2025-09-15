'use client';

import Link from 'next/link';
import Script from 'next/script';
import { FaArrowLeft, FaRedo, FaHome, FaExpand, FaCompress, FaPlay, FaPause, FaNewspaper, FaTimes, FaShip, FaInfo } from 'react-icons/fa';
import { MapProvider, useMap, Vessel } from '@/contexts/MapContext';
import { useVessels } from '@/hooks/useVessels';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import FlotillaMap from '../../components/FlotillaMap';
import { useAnalytics, usePerformanceMonitoring } from '@/hooks/useAnalytics';
import Breadcrumbs, { generateFAQSchema, generateBreadcrumbSchema } from '../../components/SEOComponents';
import SocialShare from '../../components/SocialShare';
import EnhancedVesselDetailsPanel from '../../components/EnhancedVesselDetailsPanel';
import AboutMissionModal from '../../components/AboutMissionModal';
import VesselListDrawer from '../../components/VesselListDrawer';
import VesselListBottomSheet from '../../components/VesselListBottomSheet';
import { EnhancedVessel, TimelineEvent } from '@/types/vessel';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { getEventIcon } from '@/utils/eventIcons';
import { useVesselStatus } from '@/hooks/useVesselStatus';
import IncidentModal from '../../components/IncidentModal';
import { getAppVersion } from '@/utils/version';

// Tweet interface
interface Tweet {
  DATE: string;
  USERNAME: string;
  TWEET: string;
  URL: string;
  ORIGINAL: string;
}


// News Panel Component with Tweet Embedding
const NewsPanel = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedTweets, setDisplayedTweets] = useState<Tweet[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadedEmbeds, setLoadedEmbeds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const BATCH_SIZE = 10;
  const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

  // Load Twitter embed script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Extract tweet ID from URL
  const extractTweetId = (url: string) => {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  };

  // Parse date string to Date object for sorting
  const parseDateForSorting = (dateString: string): Date => {
    try {
      // Handle different date formats from the CSV
      if (dateString.includes('September') && dateString.includes('2025')) {
        // Format: "September 05 2025 at 03:45PM"
        const cleanDate = dateString.replace(' at ', ' ').replace('AM', ' AM').replace('PM', ' PM');
        return new Date(cleanDate);
      } else {
        return new Date(dateString);
      }
    } catch {
      // Return a very old date if parsing fails to put it at the end
      return new Date('1900-01-01');
    }
  };

  // Load Twitter embed for a specific tweet
  const loadTweetEmbed = useCallback((tweetId: string, index: number) => {
    if (loadedEmbeds.has(tweetId)) return;
    
    const container = document.getElementById(`tweet-embed-${index}`);
    if (!container) return;

    // Mark as loading to prevent duplicate attempts
    setLoadedEmbeds(prev => new Set(prev).add(tweetId));

    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.createTweet(tweetId, container, {
        theme: 'light',
        width: '100%',
        align: 'center',
        dnt: true
      }).catch((error: unknown) => {
        console.error('Error embedding tweet:', error);
        // Remove from loaded set on error so it can be retried
        setLoadedEmbeds(prev => {
          const newSet = new Set(prev);
          newSet.delete(tweetId);
          return newSet;
        });
        container.innerHTML = `<div class="text-red-500 text-sm p-4">Failed to load tweet</div>`;
      });
    }
  }, [loadedEmbeds]);

  // Fetch tweets from Google Sheet
  const fetchTweets = useCallback(async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // First, get the URL from the webhook endpoint
      const webhookResponse = await fetch('https://flotillatracker.siagax.com/webhook/newslink');
      
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
        throw new Error(`Failed to fetch tweets: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      // Parse CSV data with proper CSV parsing
      const tweetData: Tweet[] = [];
      
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
          if (values.length >= 5) {
            const tweet = {
              DATE: values[0] || '',
              USERNAME: values[1] || '',
              TWEET: values[2] || '',
              URL: values[3] || '',
              ORIGINAL: values[4] || ''
            };
            tweetData.push(tweet);
          }
        }
      }
      
      // Sort by date (newest first)
      tweetData.sort((a, b) => {
        const dateA = parseDateForSorting(a.DATE);
        const dateB = parseDateForSorting(b.DATE);
        return dateB.getTime() - dateA.getTime();
      });
      
      setTweets(tweetData);
      setDisplayedTweets(tweetData.slice(0, BATCH_SIZE));
      setCurrentBatch(1);
      setHasMore(tweetData.length > BATCH_SIZE);
      setLastRefresh(new Date());
      
    } catch (err) {
      console.error('Error fetching tweets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tweets');
    } finally {
      if (isAutoRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Load more tweets
  const loadMoreTweets = useCallback(() => {
    if (!hasMore || loading) return;
    
    const startIndex = currentBatch * BATCH_SIZE;
    const endIndex = startIndex + BATCH_SIZE;
    const newTweets = tweets.slice(startIndex, endIndex);
    
    if (newTweets.length > 0) {
      setDisplayedTweets(prev => [...prev, ...newTweets]);
      setCurrentBatch(prev => prev + 1);
      setHasMore(endIndex < tweets.length);
    }
  }, [currentBatch, hasMore, loading, tweets]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loadingRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMoreTweets();
          }
        },
        { threshold: 0.1 }
      );
      
      observerRef.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreTweets, hasMore]);

  // Initialize lastRefresh time after mount to avoid hydration mismatch
  useEffect(() => {
    setLastRefresh(new Date());
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  // Set up automatic refresh every 2 minutes
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval
    refreshIntervalRef.current = setInterval(() => {
      console.log('Auto-refreshing tweets...');
      fetchTweets(true);
    }, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchTweets, REFRESH_INTERVAL]);

  // Load embeds when tweets are displayed
  useEffect(() => {
    displayedTweets.forEach((tweet, index) => {
      const tweetId = extractTweetId(tweet.URL);
      if (tweetId && !loadedEmbeds.has(tweetId)) {
        // Delay loading to ensure DOM is ready
        setTimeout(() => {
          loadTweetEmbed(tweetId, index);
        }, 100);
      }
    });
  }, [displayedTweets, loadTweetEmbed, loadedEmbeds]);

  // Cleanup effect to prevent DOM conflicts
  useEffect(() => {
    return () => {
      // Clean up any Twitter widgets when component unmounts
      if (window.twttr && window.twttr.widgets) {
        try {
          window.twttr.widgets.load();
        } catch (error) {
          console.warn('Error cleaning up Twitter widgets:', error);
        }
      }
    };
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = parseDateForSorting(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime()) || date.getFullYear() === 1900) {
        return dateString; // Return original if parsing fails
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get tweet category color
  const getTweetCategory = (tweet: string) => {
    if (tweet.includes('#SumudFlotilla') || tweet.includes('Sumud Flotilla')) {
      return { color: 'blue', label: 'Flotilla Update' };
    }
    if (tweet.includes('Greta Thunberg') || tweet.includes('Nelson Mandela')) {
      return { color: 'green', label: 'Celebrity Support' };
    }
    if (tweet.includes('Tunisia') || tweet.includes('Tunis')) {
      return { color: 'purple', label: 'Tunisia Updates' };
    }
    if (tweet.includes('Gaza') || tweet.includes('Palestine')) {
      return { color: 'red', label: 'Gaza Mission' };
    }
    return { color: 'gray', label: 'General' };
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      {/* News Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Flotilla News</h2>
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <div className="flex items-center gap-1 text-blue-600 text-xs">
                <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                Refreshing...
              </div>
            )}
            <div className="text-xs text-gray-500">
              Last updated: {lastRefresh?.toLocaleTimeString() || 'Loading...'}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Latest tweets about Global Sumud Flotilla and Sumud Nusantara</p>
        {loading && (
          <div className="mt-2 text-sm text-blue-600">Loading tweets...</div>
        )}
        {error && (
          <div className="mt-2 text-sm text-red-600">Error: {error}</div>
        )}
      </div>
      
      {/* News Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {displayedTweets.map((tweet, index) => {
          const category = getTweetCategory(tweet.TWEET);
          const tweetId = extractTweetId(tweet.URL);
          
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              {/* Category Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 bg-${category.color}-500 rounded-full shadow-sm`}></div>
                    <span className={`text-sm font-semibold text-${category.color}-700`}>{category.label}</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{formatDate(tweet.DATE)}</span>
                </div>
              </div>
              
              {/* Tweet Content */}
              <div className="p-0">
                {/* Tweet Embed */}
                {tweetId ? (
                  <div className="relative">
                    <div 
                      id={`tweet-embed-${index}`}
                      className="min-h-[300px] w-full"
                      suppressHydrationWarning={true}
                    >
                      {tweetId && !loadedEmbeds.has(tweetId) && (
                        <div className="flex items-center justify-center h-[300px] bg-gray-50">
                          <div className="text-center">
                            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                            <div className="text-sm text-gray-600 font-medium">Loading tweet...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Fallback for tweets without valid URLs */
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">
                          {tweet.USERNAME.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-base">{tweet.USERNAME}</span>
                          <span className="text-gray-500 text-sm">@{tweet.USERNAME.toLowerCase()}</span>
                        </div>
                        <div className="text-gray-600 text-sm">{formatDate(tweet.DATE)}</div>
                      </div>
                    </div>
                    
                    <div className="text-gray-900 text-base leading-relaxed mb-4 whitespace-pre-wrap">
                      {tweet.TWEET}
                    </div>
                    
                    {tweet.URL && (
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <a 
                          href={tweet.URL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          View Original Tweet
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Additional context */}
                {tweet.ORIGINAL && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Context:</span> 
                      <a 
                        href={tweet.ORIGINAL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {tweet.ORIGINAL.substring(0, 60)}...
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Loading indicator for infinite scroll */}
        {hasMore && (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {!hasMore && displayedTweets.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            No more tweets to load
          </div>
        )}
      </div>
    </div>
  );
};

// Timeline Component
const Timeline = ({ vessels, onVesselListOpen, onEventClick }: { 
  vessels: Vessel[], 
  onVesselListOpen: () => void,
  onEventClick: (event: TimelineEvent) => void
}) => {
  const { currentTime, setCurrentTime } = useMap();
  const { trackTimelineInteraction } = useAnalytics();
  const { events: timelineEvents, isLoading: eventsLoading, error: eventsError } = useTimelineEvents();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Calculate time range from vessel positions
  const timeRange = useMemo(() => {
    if (!vessels.length) {
      // Return a default range if no vessels
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { start: oneDayAgo, end: now };
    }
    
    let earliest: Date | null = null;
    let latest: Date | null = null;
    
    vessels.forEach(vessel => {
      // Check both positions array and individual vessel timestamp
      if (vessel.positions && vessel.positions.length > 0) {
        vessel.positions.forEach(pos => {
          const posTime = new Date(pos.timestamp_utc);
          if (!isNaN(posTime.getTime())) { // Check if date is valid
            if (earliest === null || posTime < earliest) {
              earliest = posTime;
            }
            if (latest === null || posTime > latest) {
              latest = posTime;
            }
          }
        });
      }
      
      // Also check the vessel's main timestamp
      if (vessel.timestamp) {
        const vesselTime = new Date(vessel.timestamp);
        if (!isNaN(vesselTime.getTime())) {
          if (earliest === null || vesselTime < earliest) {
            earliest = vesselTime;
          }
          if (latest === null || vesselTime > latest) {
            latest = vesselTime;
          }
        }
      }
    });
    
    // If no valid timestamps found, return a reasonable default range
    if (earliest === null || latest === null || earliest >= latest) {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { start: oneDayAgo, end: now };
    }
    
    // FORCE TIMELINE TO START AT SEP 1, 07:00 PM
    const timelineStart = new Date('2025-09-01T19:00:00.000Z'); // Sep 1, 07:00 PM UTC
    const actualStart = (earliest && (earliest as Date) > timelineStart) ? (earliest as Date) : timelineStart;
    
    // Ensure we have a reasonable time range (at least 1 hour)
    const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    if (latest && actualStart && (latest as Date).getTime() - actualStart.getTime() < minDuration) {
      const center = new Date((actualStart.getTime() + (latest as Date).getTime()) / 2);
      const newEarliest = new Date(center.getTime() - minDuration / 2);
      const newLatest = new Date(center.getTime() + minDuration / 2);
      return { start: newEarliest, end: newLatest };
    } else {
      return { start: actualStart, end: (latest as Date) || actualStart };
    }
  }, [vessels]);

  // Initialize current time to LATEST (show current vessel positions on load)
  useEffect(() => {
    if (!currentTime && timeRange.end > timeRange.start) {
      // Show latest vessel positions on page load
      setCurrentTime(timeRange.end);
    }
  }, [timeRange, setCurrentTime, currentTime]);

  // Playback animation
  useEffect(() => {
    if (isPlaying && currentTime && timeRange.end > timeRange.start) {
      const duration = timeRange.end.getTime() - timeRange.start.getTime();
      const stepTime = duration / 1000; // 1000 steps for smooth animation
      const stepDuration = stepTime * playbackSpeed; // Higher speed = faster animation
      
      const animate = () => {
        if (!currentTime) {
          // Don't override the initialization - just stop animation
          setIsPlaying(false);
          return;
        }
        
        const newTime = new Date(currentTime.getTime() + stepDuration);
        if (newTime >= timeRange.end) {
          setIsPlaying(false);
          setCurrentTime(timeRange.end);
        } else {
          setCurrentTime(newTime);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, timeRange, currentTime, setCurrentTime]);

  // Count-up animation effect
  useEffect(() => {
    const targetCount = vessels.length;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    
    const animateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOutCubic * targetCount);
      
      setAnimatedCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    
    // Start animation after a short delay
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animateCount);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [vessels.length]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || !currentTime) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    
    const timeRangeMs = timeRange.end.getTime() - timeRange.start.getTime();
    const newTime = new Date(timeRange.start.getTime() + (timeRangeMs * percentage));
    
    setCurrentTime(newTime);
    setIsPlaying(false); // Stop playback when manually scrubbing
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPlaying(false); // Stop playback when dragging
    handleTimelineClick(e);
  };

  // Add global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!timelineRef.current || !currentTime) return;
        
        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        
        const timeRangeMs = timeRange.end.getTime() - timeRange.start.getTime();
        const newTime = new Date(timeRange.start.getTime() + (timeRangeMs * percentage));
        
        setCurrentTime(newTime);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, currentTime, timeRange, setCurrentTime]);

  const togglePlayback = () => {
    trackTimelineInteraction(isPlaying ? 'pause' : 'play');
    if (!isPlaying) {
      // When starting playback, reset to start position
      setCurrentTime(timeRange.start);
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  const getCurrentTimePercentage = () => {
    if (!currentTime || timeRange.end <= timeRange.start) return 0;
    const totalMs = timeRange.end.getTime() - timeRange.start.getTime();
    const currentMs = currentTime.getTime() - timeRange.start.getTime();
    return (currentMs / totalMs) * 100;
  };

  const getEventMarkerPercentage = (eventTimeString: string) => {
    if (!timeRange.end || timeRange.end <= timeRange.start) return 0;
    const eventTime = new Date(eventTimeString);
    const totalMs = timeRange.end.getTime() - timeRange.start.getTime();
    const eventMs = eventTime.getTime() - timeRange.start.getTime();
    return Math.max(0, Math.min(100, (eventMs / totalMs) * 100));
  };

  // Event click handler
  const handleEventClick = (event: TimelineEvent) => {
    onEventClick(event);
    trackTimelineInteraction('event_click', event.event_type);
  };

  // Get event color based on severity
  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      case 'success': return 'bg-green-500';
      case 'info': 
      default: return 'bg-blue-500';
    }
  };


  return (
    <div className="absolute bottom-20 md:bottom-12 left-4 right-4 z-40 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg">
      {/* Vessel Count */}
      <div className="absolute -top-48 md:-top-48 left-0 z-50">
        <div className="bg-black/90 backdrop-blur-sm text-white rounded-lg shadow-xl border border-gray-600 p-3 w-[140px] relative">
          <button
            onClick={onVesselListOpen}
            className="w-full hover:bg-black/95 hover:border-gray-500 transition-all duration-200 cursor-pointer group"
            aria-label="View vessel list"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                {animatedCount}
              </div>
              <div className="flex items-center justify-center gap-1 text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                <FaShip className="w-3 h-3 text-white group-hover:text-blue-300 transition-colors" />
                <span>Vessels</span>
              </div>
            </div>
            {/* Info Icon */}
            <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 group-hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors duration-200">
              <FaInfo className="w-2.5 h-2.5 text-white" />
            </div>
          </button>
          
          {/* Color Legend */}
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400 mb-1 text-center">Origin Countries</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">Spain</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Italy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300">Tunisia</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">Greece</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Donate Button */}
      <div className="absolute -top-20 md:-top-20 right-0 z-50">
        <button
          onClick={() => {
            // Add donation functionality here
            window.open('https://mapim.berisalam.net/form/kecemasanpalestin', '_blank');
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-full shadow-lg transition-colors duration-200 border-2 border-yellow-400 hover:border-yellow-500"
        >
          Donate Now
        </button>
      </div>
      
      <div className="px-4 py-3">
        {/* Timeline Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            >
              {isPlaying ? <FaPause className="w-3 h-3" /> : <FaPlay className="w-3 h-3" />}
            </button>
            
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
            
            {/* Events Loading/Error Indicator */}
            {eventsLoading && (
              <div className="flex items-center gap-1 text-blue-400 text-xs">
                <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
                Loading events...
              </div>
            )}
            {eventsError && (
              <div className="text-red-400 text-xs">
                Events unavailable
              </div>
            )}
          </div>
          
          <div className="text-white text-sm">
            {currentTime && formatTime(currentTime)}
          </div>
        </div>

        {/* Timeline Track */}
        <div className="relative">
          <div
            ref={timelineRef}
            className="w-full h-8 bg-gray-800 rounded cursor-pointer relative overflow-visible select-none z-30"
            onClick={handleTimelineClick}
            onMouseDown={handleMouseDown}
          >
            {/* Time markers */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-gray-600 relative"
                >
                  <div className="absolute top-1 left-1 text-xs text-gray-400">
                    {i % 2 === 0 ? formatTime(new Date(timeRange.start.getTime() + (timeRange.end.getTime() - timeRange.start.getTime()) * (i / 9))).split(' ')[0] : ''}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Current time indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-red-500 z-50"
              style={{ left: `${getCurrentTimePercentage()}%` }}
            >
              <div 
                className="absolute -top-4 -left-4 w-8 h-8 bg-red-500 rounded-full border-3 border-white z-50 shadow-xl hover:bg-red-600 hover:scale-110 transition-all duration-200 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
              ></div>
            </div>
            
            {/* Dynamic Timeline Event Markers */}
            {timelineEvents.map((event, index) => {
              const eventId = `${event.event_type}-${index}`;
              const EventIconComponent = getEventIcon(event.icon);
              const eventColor = getEventColor(event.severity);
              
              return (
                <div
                  key={eventId}
                  className="absolute z-40 cursor-pointer group"
                  style={{ left: `${getEventMarkerPercentage(event.timestamp_utc)}%` }}
                  onClick={() => handleEventClick(event)}
                  title={`Click to view details: ${event.title}`}
                >
                  {/* Extended clickable area - positioned above timeline */}
                  <div className="absolute -top-16 -left-4 w-8 h-16 z-40"></div>
                  
                  {/* Timeline marker line - extends from top to bottom */}
                  <div className={`absolute -top-16 bottom-0 w-1 ${eventColor} z-30`}></div>
                  
                  {/* Event marker icon - positioned above timeline */}
                  <div className={`absolute -top-16 -left-3 w-6 h-6 ${eventColor} rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-all duration-200 z-40 flex items-center justify-center`}>
                    <EventIconComponent className="w-3 h-3 text-white" />
                  </div>
                  
                  {/* Hover tooltip */}
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {event.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

function AppContent() {
  const { currentVessel, isVesselPanelVisible, hideVesselDetails, showVesselDetails, zoomToLocation, mapRef, currentTime } = useMap();
  const { vessels, isInitialLoad, isBackgroundLoading, loadFullData } = useVessels();
  const { getVesselStatus, isInitialized: isVesselStatusInitialized } = useVesselStatus();
  const { trackMapInteraction } = useAnalytics();
  usePerformanceMonitoring();
  const [leftWidth, setLeftWidth] = useState(80); // Percentage - Start with more map space
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isVesselListOpen, setIsVesselListOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle vessel selection from list
  const handleVesselSelect = useCallback((vessel: Vessel) => {
    // Close the vessel list
    setIsVesselListOpen(false);
    
    // Show vessel details panel
    showVesselDetails(vessel);
    
    // Get current position for zooming
    if (vessel.positions && vessel.positions.length > 0) {
      const currentPosition = vessel.positions[vessel.positions.length - 1];
      zoomToLocation(currentPosition.latitude, currentPosition.longitude, 10);
    }
    
    // Track the interaction
    trackMapInteraction('vessel_select_from_list');
  }, [showVesselDetails, zoomToLocation, trackMapInteraction]);

  // Handle vessel list close - also close vessel details panel
  const handleVesselListClose = useCallback(() => {
    setIsVesselListOpen(false);
    hideVesselDetails();
  }, [hideVesselDetails]);

  // Incident modal handlers
  const handleEventClick = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event);
    setIsIncidentModalOpen(true);
  }, []);

  const closeIncidentModal = useCallback(() => {
    setIsIncidentModalOpen(false);
    setSelectedEvent(null);
  }, []);

  // Determine vessel status based on current time
  const getTimelineVesselStatus = useCallback((vessel: Vessel, currentTime: Date) => {
    if (!vessel.positions || vessel.positions.length === 0) {
      return 'no-data';
    }
    
    const firstDataTime = new Date(vessel.positions[0].timestamp_utc);
    const lastDataTime = new Date(vessel.positions[vessel.positions.length - 1].timestamp_utc);
    
    if (currentTime < firstDataTime) {
      return 'preparing';
    } else if (currentTime > lastDataTime) {
      // Check if vessel has reached Gaza (within ~50km of Gaza coordinates)
      const lastPosition = vessel.positions[vessel.positions.length - 1];
      const gazaLat = 31.3547;
      const gazaLng = 34.3088;
      
      // Calculate distance to Gaza (simple approximation)
      const latDiff = Math.abs(lastPosition.latitude - gazaLat);
      const lngDiff = Math.abs(lastPosition.longitude - gazaLng);
      const distanceToGaza = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion
      
      // If within 50km of Gaza, consider mission completed
      if (distanceToGaza <= 0.45) { // ~50km in degrees
        return 'completed';
      } else {
        return 'sailing'; // Still sailing towards Gaza
      }
    } else {
      return 'active';
    }
  }, []);

  // Filter vessels to show only positions up to current timeline time
  const getVesselsAtTime = useCallback((time: Date | null) => {
    if (!time || !vessels.length || !isVesselStatusInitialized) {
      return vessels;
    }

    return vessels.map(vessel => {
      const webhookStatus = getVesselStatus(vessel.mmsi, time);
      
      if (!vessel.positions || vessel.positions.length === 0) {
        // For vessels with no position data, check if they should be visible based on their static timestamp
        if (vessel.timestamp) {
          const vesselTimestamp = new Date(vessel.timestamp);
          if (time < vesselTimestamp) {
            // Hide vessel if current time is before its static timestamp
            return { ...vessel, positions: [], latitude: '', longitude: '', vessel_status: webhookStatus || 'sailing' };
          }
        }
        // Show vessel with static coordinates if time is after its timestamp
        return vessel;
      }

      const timelineStatus = getTimelineVesselStatus(vessel, time);

      // Use webhook status as the only source of truth for UI display
      // Default to 'sailing' if no webhook data available
      const finalStatus = webhookStatus || 'sailing';
      

      // Use timeline status for vessel visibility and position filtering logic
      // Use webhook status only for UI display (marker icon, status text, etc.)
      switch (timelineStatus) {
        case 'preparing':
          // Hide vessel completely until they start transmitting data
          return { ...vessel, positions: [], latitude: '', longitude: '', vessel_status: finalStatus };

        case 'active':
          // Filter positions up to current time
          let validPositions = vessel.positions
            .filter(pos => new Date(pos.timestamp_utc) <= time)
            .sort((a, b) => new Date(a.timestamp_utc).getTime() - new Date(b.timestamp_utc).getTime());

          // Special handling for Longhaul vessel
          if (vessel.name === 'Longhaul') {
            const cutoffTime = new Date('2025-09-04T08:39:00.000Z');
            const correctPositionTime = new Date('2025-09-04T12:13:45.000Z');
            
            // Filter out positions before cutoff time
            validPositions = validPositions.filter(pos => new Date(pos.timestamp_utc) >= cutoffTime);
            
            // If current time is before Sep 4, 12:14 PM, show correct Menorca port position
            if (time < correctPositionTime) {
              validPositions = [{
                latitude: 39.87904071807861, // Correct Menorca port position
                longitude: 4.3077778816223145,
                timestamp_utc: time.toISOString()
              }];
            } else if (validPositions.length > 0) {
              // If we have positions before 12:14 PM, replace them with the correct port position
              const firstPosition = validPositions[0];
              if (new Date(firstPosition.timestamp_utc) < correctPositionTime) {
                validPositions[0] = {
                  ...firstPosition,
                  latitude: 39.87904071807861, // Correct Menorca port position
                  longitude: 4.3077778816223145,
                  timestamp_utc: firstPosition.timestamp_utc // Keep the original timestamp
                };
              }
            }
          }

          if (validPositions.length === 0) {
            return { ...vessel, positions: [], vessel_status: finalStatus };
          }

          // Check if this is the vessel's first appearance (spawn animation)
          const firstDataTime = new Date(vessel.positions[0].timestamp_utc);
          const timeDiff = Math.abs(time.getTime() - firstDataTime.getTime());
          const isSpawning = timeDiff <= 5 * 60 * 1000; // 5 minutes tolerance

          const latestPosition = validPositions[validPositions.length - 1];
          return {
            ...vessel,
            positions: validPositions, // Keep ALL positions for path drawing
            latitude: latestPosition.latitude.toString(),
            longitude: latestPosition.longitude.toString(),
            timestamp: latestPosition.timestamp_utc,
            vessel_status: finalStatus, // Use webhook status for UI display
            isSpawning: isSpawning, // Flag to trigger spawn animation
            // Update course data from the latest position
            course: latestPosition.course || null,
            speed_kmh: latestPosition.speed_kmh || null,
            speed_knots: latestPosition.speed_knots || null
          };

        case 'completed':
          // Show vessel at last known position - reached Gaza
          const lastPosition = vessel.positions[vessel.positions.length - 1];
          return {
            ...vessel,
            positions: vessel.positions,
            latitude: lastPosition.latitude.toString(),
            longitude: lastPosition.longitude.toString(),
            timestamp: lastPosition.timestamp_utc,
            vessel_status: finalStatus, // Use webhook status for UI display
            // Update course data from the last position
            course: lastPosition.course || null,
            speed_kmh: lastPosition.speed_kmh || null,
            speed_knots: lastPosition.speed_knots || null
          };

        case 'sailing':
          // Show vessel at last known position - still sailing towards Gaza
          const lastSailingPosition = vessel.positions[vessel.positions.length - 1];
          return {
            ...vessel,
            positions: vessel.positions,
            latitude: lastSailingPosition.latitude.toString(),
            longitude: lastSailingPosition.longitude.toString(),
            timestamp: lastSailingPosition.timestamp_utc,
            vessel_status: finalStatus, // Use webhook status for UI display
            // Update course data from the last position
            course: lastSailingPosition.course || null,
            speed_kmh: lastSailingPosition.speed_kmh || null,
            speed_knots: lastSailingPosition.speed_knots || null
          };

        case 'no-data':
        default:
          return { ...vessel, positions: [], vessel_status: finalStatus };
      }
    });
  }, [vessels, getVesselStatus, getTimelineVesselStatus, isVesselStatusInitialized]);

  // Get vessels filtered by current timeline time
  const vesselsAtCurrentTime = useMemo(() => {
    return getVesselsAtTime(currentTime);
  }, [getVesselsAtTime, currentTime]);

  // Show map immediately when vessels are loaded
  const isDataReady = vessels.length > 0;
  const isStatusReady = isVesselStatusInitialized;

  // Handle mobile responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Control button functions
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const refreshPage = () => {
    trackMapInteraction('refresh_data');
    // Dispatch a custom event to refresh data without exiting fullscreen
    window.dispatchEvent(new CustomEvent('refresh-map-data'));
    
    // Show a brief visual feedback
    const button = document.querySelector('[data-refresh-button]') as HTMLButtonElement;
    if (button) {
      button.classList.add('animate-spin');
      setTimeout(() => {
        button.classList.remove('animate-spin');
      }, 1000);
    }
  };

  const resetMapView = () => {
    trackMapInteraction('reset_view');
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) return;
    
    // Reset to Mediterranean view
    map.easeTo({
      center: [15, 35], // Mediterranean center
      zoom: 5,
      duration: 1000,
      essential: true
    });
    
    // Show a brief visual feedback
    const button = document.querySelector('[data-reset-button]') as HTMLButtonElement;
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => {
        button.classList.remove('animate-pulse');
      }, 1000);
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Don't allow dragging on mobile
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || isMobile) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Enforce minimum widths (20% for news, 80% max for map)
    const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
    setLeftWidth(clampedWidth);
  }, [isDragging, isMobile]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Back Button and Controls */}
      <header className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-semibold rounded-lg shadow-lg hover:bg-white transition-colors border border-gray-200"
        >
          <FaArrowLeft className="mr-2" />
          Back to MAGIC
        </Link>
        
        {/* Breadcrumbs */}
        <div className="hidden md:block">
          <Breadcrumbs items={[
            { label: "SiagaX Sumud Nusantara", href: "/sumudnusantara" }
          ]} />
        </div>
        
        {/* Social Share */}
        <div className="hidden md:block">
          <SocialShare />
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPage}
            className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-lg p-2 shadow-lg border border-gray-200 hover:shadow-xl"
            title="Refresh Data"
            data-refresh-button
          >
            <FaRedo className="w-4 h-4" />
          </button>
          <button
            onClick={resetMapView}
            className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-lg p-2 shadow-lg border border-gray-200 hover:shadow-xl"
            title="Reset Map View"
            data-reset-button
          >
            <FaHome className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-lg p-2 shadow-lg border border-gray-200 hover:shadow-xl"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <FaCompress className="w-4 h-4" />
            ) : (
              <FaExpand className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={containerRef} className="flex-1 flex relative overflow-hidden">
        <h1 className="sr-only">Global Sumud Flotilla Tracker - Sumud Nusantara Vessel Tracking</h1>
        {/* Map Section */}
        <div 
          className="relative overflow-hidden"
          style={{ width: isMobile ? '100%' : `${leftWidth}%` }}
        >
          {!isDataReady ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vessel data...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vessels: {vessels.length > 0 ? '✓' : '⏳'} | 
                  Status: {isStatusReady ? '✓' : '⏳'}
                </p>
                {isInitialLoad && (
                  <p className="text-xs text-blue-600 mt-1">Loading recent data for faster display...</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <FlotillaMap vessels={vesselsAtCurrentTime} onAboutClick={() => setIsAboutModalOpen(true)} />
              {/* Status loading indicator */}
              {!isStatusReady && (
                <div className="absolute top-4 left-4 z-50 bg-yellow-500/90 backdrop-blur-sm text-black text-xs px-3 py-2 rounded-lg shadow-lg border border-yellow-400">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border border-black border-t-transparent rounded-full"></div>
                    <span>Loading real-time status updates...</span>
                  </div>
                </div>
              )}
              {/* Background loading indicator */}
              {isBackgroundLoading && (
                <div className="absolute top-4 right-4 z-50 bg-green-500/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-green-400">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                    <span>Loading complete pathways...</span>
                  </div>
                </div>
              )}
              {/* Initial load indicator */}
              {isInitialLoad && !isBackgroundLoading && (
                <div className="absolute top-4 right-4 z-50 bg-blue-500/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-blue-400">
                  <div className="flex items-center gap-2">
                    <span>📊 Latest positions loaded</span>
                    <button 
                      onClick={loadFullData}
                      className="underline hover:no-underline"
                    >
                      Load full data now
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Enhanced Vessel Details Panel - Inside Map Container */}
          <div className={`absolute z-50 ${isMobile ? 'top-16 right-4' : 'top-4 right-4'}`}>
            <EnhancedVesselDetailsPanel
              vessel={currentVessel as EnhancedVessel}
              isVisible={isVesselPanelVisible}
              onClose={hideVesselDetails}
            />
          </div>
          
          {/* Timeline - Inside Map Container */}
          {isDataReady && (
            <Timeline 
              vessels={vessels} 
              onVesselListOpen={() => setIsVesselListOpen(true)}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {/* Draggable Divider - Hidden on mobile */}
        {!isMobile && (
          <div
            className={`w-3 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0 transition-all duration-200 ${
              isDragging ? 'bg-gray-400' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}

        {/* News Section - Hidden on mobile */}
        {!isMobile && (
          <div 
            className="relative overflow-hidden"
            style={{ width: `${100 - leftWidth}%` }}
          >
            <NewsPanel />
          </div>
        )}
      </main>

      {/* Mobile News Drawer */}
      {isMobile && (
        <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-[60] ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="h-full flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Flotilla News</h3>
              <button
                onClick={toggleDrawer}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            {/* Drawer Content */}
            <div className="flex-1 overflow-hidden">
              <NewsPanel />
            </div>
          </div>
        </div>
      )}

      {/* Mobile News Toggle Button - Right Edge */}
      {isMobile && (
        <button
          onClick={toggleDrawer}
          className={`fixed right-0 top-1/2 transform -translate-y-1/2 z-[65] bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-all duration-300 ease-in-out rounded-l-lg p-3 shadow-lg border border-gray-200 hover:shadow-xl ${
            isDrawerOpen ? 'translate-x-80' : 'translate-x-0'
          }`}
          title={isDrawerOpen ? 'Close News' : 'Open News'}
        >
          <FaNewspaper className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobile && isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[55]"
          onClick={toggleDrawer}
        />
      )}

      {/* Vessel List Components */}
      {!isMobile && isDataReady && (
        <VesselListDrawer
          isOpen={isVesselListOpen}
          onClose={handleVesselListClose}
          vessels={vesselsAtCurrentTime}
          onVesselSelect={handleVesselSelect}
          currentTime={currentTime || new Date()}
        />
      )}
      
      {isMobile && isDataReady && (
        <VesselListBottomSheet
          isOpen={isVesselListOpen}
          onClose={handleVesselListClose}
          vessels={vesselsAtCurrentTime}
          onVesselSelect={handleVesselSelect}
          currentTime={currentTime || new Date()}
        />
      )}

      {/* About Mission Modal */}
      <AboutMissionModal 
        isOpen={isAboutModalOpen} 
        onClose={() => setIsAboutModalOpen(false)} 
      />

      {/* Incident Modal */}
      <IncidentModal 
        isOpen={isIncidentModalOpen} 
        onClose={closeIncidentModal}
        event={selectedEvent}
      />
    </div>
  );
}


export default function FlotillaClient() {
  // Console ASCII Art
  useEffect(() => {
    const version = getAppVersion();
    console.log(`
░▒▓█▓▒░░▒▓███████▓▒░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓████████▓▒░▒▓█▓▒░              ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                        
░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                        
░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                        
░▒▓█▓▒░░▒▓██████▓▒░░▒▓███████▓▒░░▒▓████████▓▒░▒▓██████▓▒░ ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓███████▓▒░░▒▓█▓▒░                                        
░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                        
░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░                                              
░▒▓█▓▒░▒▓███████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓████████▓▒░       ░▒▓██████▓▒░ ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                        
                                                                                                                                                                                 
                                                                                                                                                                                 
░▒▓███████▓▒░░▒▓███████▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓█▓▒░▒▓███████▓▒░░▒▓████████▓▒░▒▓█▓▒░                                                                                       
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░                                                                                       
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░                                                                                       
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░ ░▒▓█▓▒░                                                                                       
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░                                                                                       
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                                                                                    
░▒▓███████▓▒░░▒▓███████▓▒░  ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░▒▓███████▓▒░░▒▓█▓▒░      ░▒▓█▓▒░                                                                                       
                                                                                                                                                                                 
                                                                                                                                                                                 
░▒▓████████▓▒░▒▓███████▓▒░░▒▓████████▓▒░▒▓████████▓▒░      ░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓█▓▒░      ░▒▓████████▓▒░░▒▓███████▓▒░▒▓████████▓▒░▒▓█▓▒░▒▓███████▓▒░░▒▓████████▓▒░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░ 
░▒▓██████▓▒░ ░▒▓███████▓▒░░▒▓██████▓▒░ ░▒▓██████▓▒░        ░▒▓███████▓▒░░▒▓████████▓▒░▒▓█▓▒░      ░▒▓██████▓▒░  ░▒▓██████▓▒░   ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░ ░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░              
░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓████████▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓███████▓▒░   ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓█▓▒░ 
                                                                                                                                                                                 
                                                                                                                                                                                 
    
    ╔══════════════════════════════════════════════════════════╗
    ║                🚢 FLOTILLA TRACKER 🚢                     ║
    ║              Sumud Nusantara Mission                     ║
    ║                   Version: ${version.padEnd(8)} ║
    ╚══════════════════════════════════════════════════════════╝
    `);
  }, []);

  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-HQQT36B90R"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HQQT36B90R');
        `}
      </Script>
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Global Sumud Flotilla Tracker",
            "description": "Real-time vessel tracking system for Global Sumud Flotilla and Sumud Nusantara humanitarian mission to Gaza",
            "url": "https://magic.mapim.dev/sumudnusantara",
            "applicationCategory": "NavigationApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Organization",
              "name": "MAPIM - Malaysian Consultative Council of Islamic Organizations",
              "url": "https://mapim.org"
            },
            "about": {
              "@type": "Event",
              "name": "Global Sumud Flotilla Humanitarian Mission",
              "description": "Humanitarian mission to Gaza by sea",
              "startDate": "2025-09-01",
              "location": {
                "@type": "Place",
                "name": "Gaza",
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": 31.3547,
                  "longitude": 34.3088
                }
              }
            }
          })
        }}
      />
      
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema([
            {
              question: "What is the Global Sumud Flotilla?",
              answer: "The Global Sumud Flotilla is a humanitarian mission organized to deliver aid to Gaza by sea. It consists of multiple vessels carrying essential supplies and humanitarian aid to support the people of Gaza."
            },
            {
              question: "How often is the tracking data updated?",
              answer: "The vessel tracking data is updated every 10 minutes with real-time positions, ensuring you can monitor the progress of the humanitarian mission continuously."
            },
            {
              question: "What vessels are part of the Sumud Nusantara mission?",
              answer: "The Sumud Nusantara mission includes multiple vessels from different countries, all coordinated to deliver humanitarian aid to Gaza. Each vessel's progress can be tracked individually on this platform."
            },
            {
              question: "How can I support the mission?",
              answer: "You can support the mission by sharing this tracker, spreading awareness about the humanitarian situation in Gaza, and supporting organizations involved in humanitarian aid efforts."
            },
            {
              question: "Is the tracking data accurate?",
              answer: "Yes, the tracking data comes from official maritime tracking systems and is updated regularly. However, please note that vessel positions may have slight delays due to satellite communication constraints."
            },
            {
              question: "What does 'Sumud' mean?",
              answer: "'Sumud' is an Arabic word meaning 'steadfastness' or 'resilience'. It represents the determination and perseverance of the Palestinian people and their supporters in the face of adversity."
            }
          ]))
        }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema([
            { label: "SiagaX Sumud Nusantara", href: "/sumudnusantara" }
          ]))
        }}
      />
      <MapProvider>
        <AppContent />
      </MapProvider>
    </>
  );
}