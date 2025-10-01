'use client';

import { useCallback } from 'react';
import { event } from '@/lib/gtag';

export const useAnalytics = () => {
  const trackEvent = useCallback((
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    event({
      action,
      category,
      label,
      value,
    });
  }, []);

  // Predefined tracking functions for common actions
  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    trackEvent('button_click', 'engagement', `${buttonName}${location ? `_${location}` : ''}`);
  }, [trackEvent]);

  const trackPageView = useCallback((pageName: string) => {
    trackEvent('page_view', 'navigation', pageName);
  }, [trackEvent]);

  const trackVesselClick = useCallback((vesselName: string, vesselId: number) => {
    trackEvent('vessel_click', 'interaction', `${vesselName}_${vesselId}`);
  }, [trackEvent]);

  const trackDonationClick = useCallback((source: string) => {
    trackEvent('donation_click', 'conversion', source);
  }, [trackEvent]);

  const trackNavigationClick = useCallback((destination: string) => {
    trackEvent('navigation_click', 'engagement', destination);
  }, [trackEvent]);

  const trackDrawerOpen = useCallback(() => {
    trackEvent('drawer_open', 'interaction', 'vessel_list');
  }, [trackEvent]);

  const trackDrawerClose = useCallback(() => {
    trackEvent('drawer_close', 'interaction', 'vessel_list');
  }, [trackEvent]);

  const trackVesselInfoOpen = useCallback((vesselName: string) => {
    trackEvent('vessel_info_open', 'interaction', vesselName);
  }, [trackEvent]);

  const trackVesselInfoClose = useCallback((vesselName: string) => {
    trackEvent('vessel_info_close', 'interaction', vesselName);
  }, [trackEvent]);

  const trackInterceptionClick = useCallback((interceptionName: string) => {
    trackEvent('interception_click', 'interaction', interceptionName);
  }, [trackEvent]);

  const trackInterceptionDrawerOpen = useCallback((interceptionName: string) => {
    trackEvent('interception_drawer_open', 'interaction', interceptionName);
  }, [trackEvent]);

  const trackInterceptionDrawerClose = useCallback((interceptionName: string) => {
    trackEvent('interception_drawer_close', 'interaction', interceptionName);
  }, [trackEvent]);

  const trackLocationMarkerClick = useCallback((locationName: string) => {
    trackEvent('location_marker_click', 'interaction', locationName);
  }, [trackEvent]);

  const trackLivestreamClick = useCallback((source: string) => {
    trackEvent('livestream_click', 'engagement', source);
  }, [trackEvent]);

  return {
    trackEvent,
    trackButtonClick,
    trackPageView,
    trackVesselClick,
    trackDonationClick,
    trackNavigationClick,
    trackDrawerOpen,
    trackDrawerClose,
    trackVesselInfoOpen,
    trackVesselInfoClose,
    trackInterceptionClick,
    trackInterceptionDrawerOpen,
    trackInterceptionDrawerClose,
    trackLocationMarkerClick,
    trackLivestreamClick,
  };
};
