'use client';

import { useEffect, useState, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useCurrentAlerts } from '@/hooks/useCurrentAlerts';
import { FaWater, FaCloudRain, FaMapMarkerAlt } from 'react-icons/fa';
import L, { Marker as LeafletMarker } from 'leaflet';
import { getSeverityBadge } from '../utils/getSeverityBadge';

function formatWaterLevel(waterLevel: string | undefined): string {
  if (!waterLevel) return 'N/A';
  if (waterLevel === '-9999') return 'Error';
  return waterLevel;
}

interface Alert {
  station_id: string;
  station_name: string;
  state: string;
  wl_severity_level: string;
  rf_severity_level?: string;
  wl_date_timeAlert?: string;
  rf_date_timeAlert?: string;
  clean_water_level?: string;
  trend?: string;
  rf1hour?: string;
  latitude?: string;
  longitude?: string;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Warning':
      return '#ef4444'; // red-500
    case 'Alert':
      return '#f59e0b'; // amber-500
    case 'Danger':
      return '#dc2626'; // red-600
    default:
      return '#05df72'; // gray-500
  }
}

export default function AlertMarkers() {
  const alerts = useCurrentAlerts(60000);
  const [markers, setMarkers] = useState<Alert[]>([]);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({});

  useEffect(() => {
    // Filter alerts that have valid coordinates
    const validAlerts = alerts.filter(alert => {
      if (!alert.latitude || !alert.longitude) return false;
      const lat = parseFloat(alert.latitude);
      const lng = parseFloat(alert.longitude);
      return !isNaN(lat) && !isNaN(lng);
    });
    setMarkers(validAlerts);
  }, [alerts]);

  useEffect(() => {
    if (openPopupId && markerRefs.current[openPopupId]) {
      markerRefs.current[openPopupId]?.openPopup();
    }
  }, [openPopupId]);

  return (
    <>
      {markers.map((alert) => {
        const lat = parseFloat(alert.latitude!);
        const lng = parseFloat(alert.longitude!);
        const severityColor = getSeverityColor(alert.wl_severity_level);

        return (
          <Marker
            key={alert.station_id}
            position={[lat, lng]}
            icon={L.divIcon({
              className: 'custom-alert-marker',
              html: `<div style="
                width: 10px;
                height: 10px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
              ">
                <div style="
                  position: absolute;
                  inset: 0;
                  border-radius: 50%;
                  background-color: ${severityColor};
                  opacity: 0.3;
                  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>
                <div style="
                  position: absolute;
                  inset: 2px;
                  border-radius: 50%;
                  background-color: ${severityColor};
                "></div>
              </div>`,
              iconSize: [10, 10],
              iconAnchor: [5, 5],
            })}
            zIndexOffset={9999}
            eventHandlers={{
              click: () => setOpenPopupId(alert.station_id),
              popupclose: () => setOpenPopupId(null),
            }}
            ref={ref => {
              // For React-Leaflet v4+, ref is the underlying Leaflet marker instance
              markerRefs.current[alert.station_id] = ref as LeafletMarker | null;
            }}
          >
            <Popup>
              <div style={{ position: 'relative' }}>
                {/* Custom close button */}
                <button
                  onClick={() => {
                    setOpenPopupId(null);
                    markerRefs.current[alert.station_id]?.closePopup();
                  }}
                  className="absolute -top-5 -right-5 z-[10000] bg-gray-800 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition"
                  aria-label="Close"
                  type="button"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <div className="p-3 min-w-[300px] bg-gray-900/75 backdrop-blur-sm rounded-sm border border-gray-700/50">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FaMapMarkerAlt className="text-blue-400 text-xs flex-shrink-0" />
                        <h3 className="text-white font-semibold text-sm truncate">{alert.station_name}</h3>
                      </div>
                      <div className="text-gray-400 text-xs">{alert.state}</div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(alert.wl_severity_level)}`}>{alert.wl_severity_level}</div>
                  </div>
                  {/* Data Section */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Water Level */}
                    <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                      <div className="flex items-center gap-1 mb-1">
                        <FaWater className="text-blue-400 text-xs" />
                        <span className="text-blue-300 text-xs font-medium">Water Level</span>
                      </div>
                      <div className="text-blue-100 text-sm font-bold">{formatWaterLevel(alert.clean_water_level)}</div>
                    </div>
                    {/* Rainfall */}
                    <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                      <div className="flex items-center gap-1 mb-1">
                        <FaCloudRain className="text-purple-400 text-xs" />
                        <span className="text-purple-300 text-xs font-medium">Rainfall</span>
                      </div>
                      <div className="text-purple-100 text-sm font-bold">{alert.rf1hour || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
} 