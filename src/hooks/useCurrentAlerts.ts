import { useEffect, useState } from 'react';

export interface WaterRainAlert {
  station_id: string;
  station_name: string;
  district: string;
  state: string;
  latitude: string;
  longitude: string;
  main_basin: string;
  clean_water_level: string;
  wl_severity_level: string;
  level: string;
  wl_diff: string;
  wl_date_time: string;
  trend: string;
  wl_type: string;
  clean_rainfall: string;
  cum_daily: string;
  rf_severity_level: string;
  rf1hour: string;
  rf3hours: string;
  rftoday: string;
  rf24hours: string;
  rf3days: string;
  rf_date_time: string;
  wl1_status: string;
  rf_type: string;
  rf_status: string;
  alert_hour: string;
  wl2status: string;
  wl3status: string;
  stateAlert: string;
  wl_date_timeAlert: string;
  rf_date_timeAlert: string;
  rf_midnight: string;
}

// Global state to prevent multiple instances from conflicting
let globalAlerts: WaterRainAlert[] = [];
let globalInterval: NodeJS.Timeout | null = null;
const globalListeners: Set<() => void> = new Set();

export function useCurrentAlerts(intervalMs: number = 60000) {
  const [alerts, setAlerts] = useState<WaterRainAlert[]>(globalAlerts);
  const [isInitialized, setIsInitialized] = useState(false);

  async function fetchAlerts() {
    try {
      const res = await fetch('https://n8n.drhafizhanif.net/webhook/current-alerts');
      if (!res.ok) {
        console.warn('Failed to fetch alerts:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        console.log('Fetched alerts:', data.length);
        globalAlerts = data;
        setAlerts(data);
        // Notify all listeners
        globalListeners.forEach(listener => listener());
      } else {
        console.warn('Alerts data is not an array:', data);
        globalAlerts = [];
        setAlerts([]);
        globalListeners.forEach(listener => listener());
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      globalAlerts = [];
      setAlerts([]);
      globalListeners.forEach(listener => listener());
    }
  }

  useEffect(() => {
    // Only initialize once globally
    if (!isInitialized) {
      setIsInitialized(true);
      
      // If no global interval exists, create one
      if (!globalInterval) {
        console.log('Initializing global alerts fetch with interval:', intervalMs);
        fetchAlerts(); // Initial fetch
        globalInterval = setInterval(fetchAlerts, intervalMs);
      }
    }

    // Add this component as a listener
    const updateListener = () => setAlerts(globalAlerts);
    globalListeners.add(updateListener);

    // Cleanup
    return () => {
      globalListeners.delete(updateListener);
    };
  }, [isInitialized, intervalMs]);

  useEffect(() => {
    const handleRefresh = () => {
      console.log('Manual refresh triggered');
      fetchAlerts();
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  return alerts;
} 