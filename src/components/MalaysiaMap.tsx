'use client';

import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaWater, FaCloudRain, FaExpand, FaCompress, FaRedo } from 'react-icons/fa';
import { useCurrentAlerts } from '@/hooks/useCurrentAlerts';
import { getSeverityBadge } from '../utils/getSeverityBadge';
import { useMap } from '@/contexts/MapContext';
import type { Alert } from '@/contexts/MapContext';

const MALAYSIA_BOUNDS: [number, number, number, number] = [90, -9, 130, 15]; // [west, south, east, north] - covers ASEAN countries
const MALAYSIA_CENTER = [103.5, 4.5]; // [lng, lat] - centered on Peninsular Malaysia

function getSeverityColor(alert: Alert): string {
  // First check wl_severity_level
  const wlSeverity = alert.wl_severity_level;
  if (wlSeverity === 'Warning' || wlSeverity === 'Alert' || wlSeverity === 'Danger') {
    switch (wlSeverity) {
      case 'Warning':
        return '#eab308'; // yellow-500
      case 'Alert':
        return '#f97316'; // orange-500
      case 'Danger':
        return '#dc2626'; // red-600
    }
  }
  
  // If wl_severity_level doesn't match expected levels, check rf_severity_level
  const rfSeverity = alert.rf_severity_level;
  if (rfSeverity) {
    switch (rfSeverity.toLowerCase()) {
      case 'very heavy':
        return '#dc2626'; // red-600 (Danger equivalent)
      case 'heavy':
        return '#f97316'; // orange-500 (Alert equivalent)
      case 'moderate':
        return '#eab308'; // yellow-500 (Warning equivalent)
    }
  }
  
  // Default to green if neither severity level matches
  return '#05df72'; // green
}

function AlertMarkers() {
  const alerts: Alert[] = useCurrentAlerts(60000);
  const [popupInfo, setPopupInfo] = useState<Alert | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    const handleMapClick = () => setPopupInfo(null);
    window.addEventListener('maplibregl-map-click', handleMapClick);
    return () => window.removeEventListener('maplibregl-map-click', handleMapClick);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  // Listen for marker selection events
  useEffect(() => {
    const handleMarkerSelect = (event: CustomEvent) => {
      setSelectedMarkerId(event.detail.stationId);
    };

    const handleMarkerDeselect = () => {
      setSelectedMarkerId(null);
    };

    window.addEventListener('marker-select', handleMarkerSelect as EventListener);
    window.addEventListener('marker-deselect', handleMarkerDeselect);
    
    return () => {
      window.removeEventListener('marker-select', handleMarkerSelect as EventListener);
      window.removeEventListener('marker-deselect', handleMarkerDeselect);
    };
  }, []);

  return (
    <>
      {alerts.map(alert => {
        if (!alert.latitude || !alert.longitude) return null;
        const lat = parseFloat(alert.latitude);
        const lng = parseFloat(alert.longitude);
        const color = getSeverityColor(alert);
        const isSelected = selectedMarkerId === alert.station_id;
        
        return (
          <Marker
            key={alert.station_id}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(alert);
            }}
          >
            <div 
              style={{ 
                width: 15, 
                height: 15, 
                position: 'relative', 
                zIndex: 9999, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                animation: isRefreshing ? 'pulse 1s ease-in-out' : 'none'
              }}
            >
              {/* Pulsing ring for selected marker */}
              {isSelected && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    inset: -8, 
                    borderRadius: '50%', 
                    border: '2px solid white',
                    animation: 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
                    zIndex: 9998
                  }} 
                />
              )}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: color, opacity: 0.3, animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />
              <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', backgroundColor: color }} />
            </div>
          </Marker>
        );
      })}
      {popupInfo && popupInfo.latitude && popupInfo.longitude && (
        <Popup
          longitude={parseFloat(popupInfo.longitude)}
          latitude={parseFloat(popupInfo.latitude)}
          anchor="top"
          onClose={() => setPopupInfo(null)}
          closeOnClick={true}
          closeButton={true}
        >
          <div className="p-3 min-w-[300px] bg-gray-900/75 backdrop-blur-sm rounded-sm border border-gray-700/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FaMapMarkerAlt className="text-blue-400 text-xs flex-shrink-0" />
                  <h3 className="text-white font-semibold text-sm truncate">{popupInfo.station_name}</h3>
                </div>
                <div className="text-gray-400 text-xs">{popupInfo.state}</div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(popupInfo.wl_severity_level)}`}>{popupInfo.wl_severity_level}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <FaWater className="text-blue-400 text-xs" />
                  <span className="text-blue-300 text-xs font-medium">Water Level</span>
                </div>
                <div className="text-blue-100 text-sm font-bold">{popupInfo.clean_water_level || 'N/A'}</div>
              </div>
              <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <FaCloudRain className="text-purple-400 text-xs" />
                  <span className="text-purple-300 text-xs font-medium">Rainfall</span>
                </div>
                <div className="text-purple-100 text-sm font-bold">{popupInfo.rf1hour || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

function PPSMarkers() {
  const [points, setPoints] = useState<Array<{ id: number; longi: number; latti: number; [key: string]: unknown }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPPSData = () => {
    fetch('https://n8n.drhafizhanif.net/webhook/pps-buka')
      .then(res => res.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) { setPoints([]); return; }
        const allPoints = (data as Array<{ points?: Array<{ id: number; longi: number; latti: number; [key: string]: unknown }> }>).flatMap((item) => item.points || []);
        setPoints(allPoints);
      });
  };

  useEffect(() => {
    fetchPPSData();
  }, [refreshKey]);

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  return (
    <>
      {points.map(p => (
        <Marker
          key={p.id}
          longitude={p.longi}
          latitude={p.latti}
          anchor="bottom"
        >
          <div style={{ animation: isRefreshing ? 'bounce 1s ease-in-out' : 'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 L22 21 Q23 23 20 23 H15 Q14 23 13.5 22 L12 19 L10.5 22 Q10 23 9 23 H4 Q1 23 2 21 L12 3 Z" fill="#3B82F6" />
            </svg>
          </div>
        </Marker>
      ))}
    </>
  );
}

// Map Control Buttons Component
const MapControls = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-3">
      <button
        onClick={refreshPage}
        className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl"
        title="Refresh Data"
        data-refresh-button
      >
        <FaRedo className="w-5 h-5" />
      </button>
      <button
        onClick={toggleFullscreen}
        className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <FaCompress className="w-5 h-5" />
        ) : (
          <FaExpand className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

// Copyright Footer Component
const CopyrightFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="fixed bottom-2 right-2 z-40 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded shadow-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800">© {currentYear} SiagaX & MAPIM Malaysia</span>
        <span className="text-gray-400">•</span>
        <a 
          href="/privacy" 
          className="hover:text-blue-600 hover:underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        <span className="text-gray-400">•</span>
        <a 
          href="/disclaimer" 
          className="hover:text-blue-600 hover:underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Disclaimer
        </a>
      </div>
    </div>
  );
};

export default function MalaysiaMap() {
  const { setMapLoaded, mapRef } = useMap();

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) return;
    
    const handler = () => {
      const event = new Event('maplibregl-map-click');
      window.dispatchEvent(event);
    };
    
    const zoomHandler = () => {
      const zoom = map.getZoom();
      
      // Hide marker ring when zooming out below level 7
      if (zoom < 7) {
        window.dispatchEvent(new CustomEvent('marker-deselect'));
      }
    };
    
    map.on('click', handler);
    map.on('zoom', zoomHandler);
    
    return () => {
      map.off('click', handler);
      map.off('zoom', zoomHandler);
    };
  }, [mapRef]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: MALAYSIA_CENTER[0],
          latitude: MALAYSIA_CENTER[1],
          zoom: 6,
        }}
        minZoom={6}
        maxZoom={15}
        maxBounds={MALAYSIA_BOUNDS}
        style={{ width: '100vw', height: '100vh' }}
        mapStyle="https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"
        attributionControl={false}
        scrollZoom={true}
        doubleClickZoom={true}
        dragPan={true}
        touchZoomRotate={true}
        keyboard={false}
        onLoad={() => setMapLoaded(true)}
      >
        <AlertMarkers />
        <PPSMarkers />
      </Map>
      <MapControls />
      <CopyrightFooter />
    </div>
  );
} 