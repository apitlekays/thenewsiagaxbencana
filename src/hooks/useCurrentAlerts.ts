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

export function useCurrentAlerts(intervalMs: number = 60000) {
  const [alerts, setAlerts] = useState<WaterRainAlert[]>([]);

  async function fetchAlerts() {
    try {
      const res = await fetch('https://n8n.drhafizhanif.net/webhook/current-alerts');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setAlerts(data);
      else setAlerts([]);
    } catch {
      setAlerts([]);
    }
  }

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchAlerts();
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  return alerts;
} 