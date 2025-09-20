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
  };
};
