'use client';

import { useEffect } from 'react';

// Enhanced Analytics Hook
export function useAnalytics() {
  useEffect(() => {
    // Initialize Google Analytics with enhanced configuration
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-HQQT36B90R', {
        page_title: 'Global Sumud Flotilla Tracker',
        page_location: window.location.href,
        custom_map: {
          'custom_parameter_1': 'flotilla_tracker',
          'custom_parameter_2': 'sumud_nusantara'
        }
      });
    }
  }, []);

  // Track page views
  const trackPageView = (pageName: string, additionalData?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        ...additionalData
      });
    }
  };

  // Track user interactions
  const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'user_interaction',
        event_label: 'flotilla_tracker',
        ...parameters
      });
    }
  };

  // Track vessel interactions
  const trackVesselInteraction = (vesselName: string, action: string) => {
    trackEvent('vessel_interaction', {
      vessel_name: vesselName,
      action: action,
      event_category: 'vessel_tracking'
    });
  };

  // Track map interactions
  const trackMapInteraction = (action: string, details?: string) => {
    trackEvent('map_interaction', {
      action: action,
      details: details,
      event_category: 'map_usage'
    });
  };

  // Track social sharing
  const trackSocialShare = (platform: string, content: string) => {
    trackEvent('social_share', {
      platform: platform,
      content_type: content,
      event_category: 'social_engagement'
    });
  };

  // Track timeline interactions
  const trackTimelineInteraction = (action: string, timeValue?: string) => {
    trackEvent('timeline_interaction', {
      action: action,
      time_value: timeValue,
      event_category: 'timeline_usage'
    });
  };

  // Track news engagement
  const trackNewsEngagement = (action: string, tweetId?: string) => {
    trackEvent('news_engagement', {
      action: action,
      tweet_id: tweetId,
      event_category: 'news_interaction'
    });
  };

  return {
    trackPageView,
    trackEvent,
    trackVesselInteraction,
    trackMapInteraction,
    trackSocialShare,
    trackTimelineInteraction,
    trackNewsEngagement
  };
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined') {
      // Track page load performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation && window.gtag) {
            // Track page load time
            window.gtag('event', 'timing_complete', {
              name: 'page_load',
              value: Math.round(navigation.loadEventEnd - navigation.fetchStart),
              event_category: 'performance'
            });

            // Track First Contentful Paint
            const fcp = performance.getEntriesByName('first-contentful-paint')[0];
            if (fcp && window.gtag) {
              window.gtag('event', 'timing_complete', {
                name: 'first_contentful_paint',
                value: Math.round(fcp.startTime),
                event_category: 'performance'
              });
            }
          }
        }, 0);
      });

      // Track user engagement time
      let startTime = Date.now();
      let isActive = true;

      const trackEngagement = () => {
        if (isActive && window.gtag) {
          const engagementTime = Date.now() - startTime;
          window.gtag('event', 'user_engagement', {
            engagement_time_msec: engagementTime,
            event_category: 'engagement'
          });
        }
      };

      // Track when user becomes inactive
      const handleVisibilityChange = () => {
        if (document.hidden) {
          trackEngagement();
          isActive = false;
        } else {
          startTime = Date.now();
          isActive = true;
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Track engagement on page unload
      window.addEventListener('beforeunload', trackEngagement);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', trackEngagement);
      };
    }
  }, []);
}

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}
