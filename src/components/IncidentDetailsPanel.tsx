'use client';

import { useEffect, useState } from 'react';
import { FaTimes, FaExclamationTriangle, FaWater, FaCloudRain, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import WaterLevelChart from './WaterLevelChart';
import RainfallLevelChart from './RainfallLevelChart';
import { getSeverityBadge } from '../utils/getSeverityBadge';
import { 
  sanitizeStationId,
  sanitizeUrl 
} from '@/utils/security';

interface Alert {
  station_id: string;
  station_name: string;
  state: string;
  wl_severity_level: string;
  wl_date_timeAlert?: string;
  rf_date_timeAlert?: string;
  clean_water_level?: string;
  trend?: string;
  rf1hour?: string;
  rf_severity_level?: string;
  latitude?: string;
  longitude?: string;
}

interface ChartData {
  values: { dt: string; clean1: string }[];
  info: {
    normal: string;
    alert: string;
    warning: string;
    danger: string;
  };
}

interface IncidentDetailsPanelProps {
  alert: Alert | null;
  isVisible: boolean;
  onClose: () => void;
  top?: number;
}

// Helper type guard for rainfall info
function isRainfallInfo(info: unknown): info is { light: string; moderate: string; heavy: string; veryheavy: string } {
  if (typeof info !== 'object' || info === null) return false;
  const obj = info as Record<string, unknown>;
  return (
    typeof obj.light === 'string' &&
    typeof obj.moderate === 'string' &&
    typeof obj.heavy === 'string' &&
    typeof obj.veryheavy === 'string'
  );
}

export default function IncidentDetailsPanel({ alert, isVisible, onClose, }: IncidentDetailsPanelProps) {
  const [fetched, setFetched] = useState<Alert | ChartData | null>(null);
  const [rainFetched, setRainFetched] = useState<Alert | ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'water' | 'rain'>('water');

  useEffect(() => {
    if (!alert || !isVisible) return;
    
    // Sanitize station ID before making API calls
    const sanitizedStationId = sanitizeStationId(alert.station_id);
    if (!sanitizedStationId) {
      setError('Invalid station ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    setFetched(null);
    setRainFetched(null);
    
    // Sanitize URLs before fetching
    const waterUrl = sanitizeUrl(`https://n8n.drhafizhanif.net/webhook/water-lvl-query?stationID=${sanitizedStationId}`);
    const rainUrl = sanitizeUrl(`https://n8n.drhafizhanif.net/webhook/rainfall-lvl-query?stationID=${sanitizedStationId}`);
    
    if (!waterUrl || !rainUrl) {
      setError('Invalid API endpoint');
      setLoading(false);
      return;
    }
    
    // Fetch both endpoints in parallel
    Promise.all([
      fetch(waterUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch incident details');
          return res.json();
        })
        .then(data => {
          if (!data || (Array.isArray(data) && data.length === 0)) return null;
          const result = Array.isArray(data) ? data[0] : data;
          setFetched(result);
        })
        .catch(() => setFetched(null)),
      fetch(rainUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch rainfall details');
          return res.json();
        })
        .then(data => {
          if (!data || (Array.isArray(data) && data.length === 0)) return null;
          const result = Array.isArray(data) ? data[0] : data;
          setRainFetched(result);
        })
        .catch(() => setRainFetched(null)),
    ]).finally(() => setLoading(false));
  }, [alert?.station_id, isVisible]);

  if (!alert) return null;

  // Check if fetched data is chart data or alert data
  const isChartData = fetched && 'values' in fetched && 'info' in fetched;
  const isRainChartData = rainFetched && 'values' in rainFetched && 'info' in rainFetched;
  const display = (fetched && !isChartData ? fetched : alert) as Alert;
  const chartData = isChartData ? (fetched as ChartData) : null;
  const rainChartData = isRainChartData ? (rainFetched as ChartData) : null;

  return (
    <div
      className={`z-50 w-[500px] max-w-full bg-gray-900/70 backdrop-blur-md rounded-sm border border-gray-800 shadow-2xl transition-all duration-500 ease-in-out hidden md:block ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-1 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <FaExclamationTriangle className="text-red-500 text-2xl" />
          <h2 className="text-white font-bold text-xl tracking-tight">Incident Details</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-700/40 rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Close incident details"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-3">
        {loading && <div className="text-gray-400 text-center">Loading...</div>}
        {error && <div className="text-red-400 text-center">{error}</div>}
        {!loading && !error && (
          <>
            {/* Station Info */}
            <div className="flex flex-wrap gap-x-8 gap-y-1 items-center text-sm text-gray-300 mb-1">
              <div className="flex items-center gap-2 text-blue-300">
                <FaMapMarkerAlt className="text-base" />
                <span className="font-semibold">{display.station_name}</span>
              </div>
              <span className="text-gray-400">{display.state}</span>
            </div>

            {/* Timestamp & Coordinates Row */}
            <div className="flex flex-wrap gap-x-8 gap-y-1 items-center text-xs text-gray-400 mb-2">
              <div className="flex items-center gap-2 text-yellow-300">
                <FaClock className="text-base" />
                <span className="font-semibold">Last Updated:</span>
                <span className="text-white font-normal ml-1">
                  {display.wl_date_timeAlert || display.rf_date_timeAlert || 'No timestamp available'}
                </span>
              </div>
              <div className="ml-auto flex gap-4">
                <span>Lat: <span className="text-white">{display.latitude || 'N/A'}</span></span>
                <span>Lng: <span className="text-white">{display.longitude || 'N/A'}</span></span>
              </div>
            </div>

            {/* Water Level & Rainfall Side by Side */}
            <div className="flex flex-row gap-3 w-full">
              {/* Water Level */}
              <div className="flex-1 min-w-0 bg-gradient-to-br from-blue-900/60 to-blue-800/40 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                <div className="flex items-center gap-2 text-blue-200 mb-1">
                  <FaWater className="text-base" />
                  <span className="text-sm font-semibold">Water Level (m)</span>
                </div>
                <div className="text-blue-100 text-2xl font-bold leading-tight truncate">{display.clean_water_level || 'N/A'}</div>
                <div className="flex justify-between text-xs text-blue-300">
                  <span>Trend: <span className="font-semibold">{display.trend || 'N/A'}</span></span>
                  <span>Severity: <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(display.wl_severity_level || '')}`}>{display.wl_severity_level || 'N/A'}</span></span>
                </div>
              </div>
              {/* Rainfall */}
              <div className="flex-1 min-w-0 bg-gradient-to-br from-purple-900/60 to-purple-800/40 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                <div className="flex items-center gap-2 text-purple-200 mb-1">
                  <FaCloudRain className="text-base" />
                  <span className="text-sm font-semibold">Rainfall (mm)</span>
                </div>
                <div className="text-purple-100 text-2xl font-bold leading-tight truncate">{display.rf1hour || 'N/A'}</div>
                <div className="flex justify-between text-xs text-purple-300">
                  <span>Severity: <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(display.rf_severity_level || '')}`}>{display.rf_severity_level || 'N/A'}</span></span>
                </div>
              </div>
            </div>

            {/* Tabs for Water Level and Rainfall Charts */}
            <div className="mt-2">
              <div className="flex gap-2">
                <button
                  className={`flex items-center gap-2 px-5 py-2 rounded-t text-base font-semibold focus:outline-none transition-colors duration-200
                    ${activeTab === 'water'
                      ? 'text-blue-300 bg-gray-700 border-b-2 border-blue-400 shadow font-bold'
                      : 'text-gray-400 bg-gray-800 border-b-2 border-transparent'}
                  `}
                  onClick={() => setActiveTab('water')}
                >
                  <FaWater className={`text-lg ${activeTab === 'water' ? 'text-blue-400' : 'text-gray-500'}`} />
                  Water Level
                </button>
                <button
                  className={`flex items-center gap-2 px-5 py-2 rounded-t text-base font-semibold focus:outline-none transition-colors duration-200
                    ${activeTab === 'rain'
                      ? 'text-purple-300 bg-gray-700 border-b-2 border-purple-400 shadow font-bold'
                      : 'text-gray-400 bg-gray-800 border-b-2 border-transparent'}
                  `}
                  onClick={() => setActiveTab('rain')}
                >
                  <FaCloudRain className={`text-lg ${activeTab === 'rain' ? 'text-purple-300' : 'text-gray-500'}`} />
                  Rainfall
                </button>
              </div>
              <div className="bg-gray-800 rounded-b p-3 min-h-[240px] flex items-center justify-center">
                {activeTab === 'water' ? (
                  chartData ? (
                    <WaterLevelChart
                      values={chartData.values}
                      thresholds={{
                        normal: parseFloat(chartData.info.normal),
                        alert: parseFloat(chartData.info.alert),
                        warning: parseFloat(chartData.info.warning),
                        danger: parseFloat(chartData.info.danger),
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center w-full">No data</div>
                  )
                ) : (
                  (rainChartData && isRainfallInfo(rainChartData.info)) ? (
                    <RainfallLevelChart
                      values={rainChartData.values.map((v: { dt: string; clean?: number; clean1?: string }) => ({ dt: v.dt, clean: Number(v.clean ?? v.clean1 ?? 0) }))}
                      thresholds={{
                        light: parseFloat(rainChartData.info.light),
                        moderate: parseFloat(rainChartData.info.moderate),
                        heavy: parseFloat(rainChartData.info.heavy),
                        veryheavy: parseFloat(rainChartData.info.veryheavy),
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center w-full">No data</div>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 