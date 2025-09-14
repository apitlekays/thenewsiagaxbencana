'use client';

import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect } from 'react';
import { FaShip } from 'react-icons/fa';
import { useMap } from '@/contexts/MapContext';
import { getAppVersion } from '@/utils/version';
import { Marker, Source, Layer } from 'react-map-gl/maplibre';
import { Vessel } from '@/contexts/MapContext';
import { 
  getVesselStatusIcon, 
  getVesselStatusColor, 
  getVesselStatusDisplay, 
  shouldStatusPulse, 
  getPulsingColor,
  PULSING_STATUSES
} from '@/utils/vesselStatus';
import { VesselStatus } from '@/types/vessel';

interface FlotillaMapProps {
  vessels?: Vessel[];
}

const MEDITERRANEAN_BOUNDS: [number, number, number, number] = [-10, 25, 40, 50]; // Mediterranean Sea bounds: Spain to Syria (moved north)
const MEDITERRANEAN_CENTER = [15, 35]; // [lng, lat] - centered on Mediterranean (moved north)

// Copyright Footer Component
const CopyrightFooter = ({ onAboutClick }: { onAboutClick: () => void }) => {
  const currentYear = new Date().getFullYear();
  const appVersion = getAppVersion();
  
  return (
    <div className="fixed bottom-2 right-2 z-40 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded shadow-lg border border-gray-200 hidden md:flex items-center gap-2">
      <span className="font-semibold text-gray-800">© {currentYear} SiagaX Flotilla & MAPIM Malaysia</span>
      <span className="text-gray-400">•</span>
      <span className="text-gray-500">v{appVersion}</span>
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
      <span className="text-gray-400">•</span>
      <button 
        onClick={onAboutClick}
        className="hover:text-blue-600 hover:underline transition-colors"
      >
        About
      </button>
    </div>
  );
};

// Port Markers Component
const PortMarkers = () => {
  const ports = [
    { name: 'Barcelona', lng: 2.177432, lat: 41.385064, color: 'blue' },
    { name: 'Tunis', lng: 10.181532, lat: 36.806495, color: 'blue' },
    { name: 'Catania', lng: 15.087269, lat: 37.507877, color: 'blue' },
    { name: 'Gaza', lng: 34.308825, lat: 31.354676, color: 'green' }
  ];

  return (
    <>
      {ports.map((port, index) => (
        <Marker
          key={`port-${index}`}
          longitude={port.lng}
          latitude={port.lat}
        >
          <div className="relative">
            {/* Glowing effect */}
            <div className={`absolute inset-0 rounded-full animate-ping ${
              port.color === 'blue' ? 'bg-blue-400' : 'bg-green-400'
            } opacity-75`}></div>
            <div className={`absolute inset-0 rounded-full animate-pulse ${
              port.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
            } opacity-50`}></div>
            
            {/* Main dot */}
            <div className={`relative w-4 h-4 rounded-full border-2 border-white shadow-lg ${
              port.color === 'blue' ? 'bg-blue-600' : 'bg-green-600'
            }`}></div>
            
            {/* Port label */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {port.name}
            </div>
          </div>
        </Marker>
      ))}
    </>
  );
};

// Vessel Paths Component
const VesselPaths = ({ vessels }: { vessels: Vessel[] }) => {
  const { currentVessel } = useMap();

  // Create GeoJSON features for each vessel's path
  const vesselPaths = vessels.map((vessel) => {
    if (!vessel.positions || vessel.positions.length < 2) return null;

    // Convert positions to GeoJSON LineString coordinates
    const coordinates = vessel.positions.map(pos => [pos.longitude, pos.latitude]);
    
    return {
      type: 'Feature' as const,
      properties: {
        vesselId: vessel.id,
        vesselName: vessel.name,
        vesselStatus: vessel.vessel_status,
        isSelected: currentVessel?.id === vessel.id
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: coordinates
      }
    };
  }).filter((feature): feature is NonNullable<typeof feature> => feature !== null);

  const geojsonData = {
    type: 'FeatureCollection' as const,
    features: vesselPaths
  };

  return (
    <Source id="vessel-paths" type="geojson" data={geojsonData}>
      <Layer
        id="vessel-path-lines"
        type="line"
        paint={{
          'line-color': [
            'case',
            ['get', 'isSelected'],
            '#fbbf24', // Yellow for selected vessel
            '#7c2d12'  // Dark maroon for unselected vessels
          ],
          'line-width': [
            'case',
            ['get', 'isSelected'],
            4, // Thicker line for selected vessel
            3  // Normal width for unselected vessels
          ],
          'line-opacity': [
            'case',
            ['get', 'isSelected'],
            1.0, // Full opacity for selected vessel
            0.7  // Reduced opacity for unselected vessels
          ],
          'line-dasharray': [2, 2] // Dashed line pattern
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round'
        }}
      />
    </Source>
  );
};

// Helper function to render individual vessel marker
const renderVesselMarker = (vessel: Vessel, showVesselDetails: (vessel: Vessel) => void, isHighPriority: boolean = false) => {
  if (!vessel.latitude || !vessel.longitude) return null;
  
  const lat = parseFloat(vessel.latitude);
  const lng = parseFloat(vessel.longitude);
  
  if (isNaN(lat) || isNaN(lng)) return null;

  // Get vessel status styling
  const statusIcon = getVesselStatusIcon(vessel.vessel_status as VesselStatus);
  const statusColor = getVesselStatusColor(vessel.vessel_status as VesselStatus);
  const statusDisplay = getVesselStatusDisplay(vessel.vessel_status as VesselStatus);
  const shouldPulse = shouldStatusPulse(vessel.vessel_status as VesselStatus);
  const pulsingColor = getPulsingColor(vessel.vessel_status as VesselStatus);

  const StatusIconComponent = statusIcon;

  return (
    <Marker
      key={vessel.id}
      longitude={lng}
      latitude={lat}
      onClick={() => showVesselDetails(vessel)}
    >
      <div className={`cursor-pointer group ${isHighPriority ? 'z-50' : 'z-10'}`}>
        {/* Pulsing effect for certain statuses */}
        {shouldPulse && (
          <div className={`absolute inset-0 ${pulsingColor} rounded-full animate-ping opacity-75`}></div>
        )}
        
        {/* Main marker */}
        <div className={`relative w-6 h-6 ${statusColor} rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors ${
          isHighPriority ? 'shadow-2xl ring-2 ring-yellow-400 ring-opacity-50' : ''
        }`}>
          <StatusIconComponent className="w-3 h-3 text-white" />
        </div>
        
        {/* Hover tooltip */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {vessel.name} ({statusDisplay})
        </div>
      </div>
    </Marker>
  );
};

// Vessel Markers Component with layered rendering
const VesselMarkers = ({ vessels }: { vessels: Vessel[] }) => {
  const { showVesselDetails } = useMap();

  // Separate vessels into regular and high-priority (special status) markers
  const regularVessels = vessels.filter(vessel => 
    !PULSING_STATUSES.has(vessel.vessel_status as VesselStatus)
  );
  
  const highPriorityVessels = vessels.filter(vessel => 
    PULSING_STATUSES.has(vessel.vessel_status as VesselStatus)
  );


  return (
    <>
      {/* Render regular vessels first (lower z-index) */}
      {regularVessels.map((vessel) => renderVesselMarker(vessel, showVesselDetails, false))}
      
      {/* Render high-priority vessels on top (higher z-index) */}
      {highPriorityVessels.map((vessel) => renderVesselMarker(vessel, showVesselDetails, true))}
    </>
  );
};

// Mobile Overlay Component
const MobileOverlay = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-black/70 backdrop-blur-sm text-white p-4 border-t border-gray-600">
        <div className="flex items-center justify-center gap-3">
          <div className="flex-shrink-0">
            <FaShip className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">View on larger screens for vessel tracking controls</p>
            <p className="text-xs text-gray-300 mt-1">Real-time flotilla tracking available on desktop</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FlotillaMap({ vessels = [], onAboutClick }: FlotillaMapProps & { onAboutClick: () => void }) {
  const { setMapLoaded, mapRef } = useMap();

  // Calculate center of flotilla and pan to it
  useEffect(() => {
    if (!mapRef.current || vessels.length === 0) return;
    
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) return;

    // Get all vessel positions
    const positions = vessels
      .filter(vessel => vessel.latitude && vessel.longitude)
      .map(vessel => ({
        lat: parseFloat(vessel.latitude),
        lng: parseFloat(vessel.longitude)
      }))
      .filter(pos => !isNaN(pos.lat) && !isNaN(pos.lng));

    if (positions.length === 0) return;

    // Calculate bounds to fit all vessels
    const minLat = Math.min(...positions.map(pos => pos.lat));
    const maxLat = Math.max(...positions.map(pos => pos.lat));
    const minLng = Math.min(...positions.map(pos => pos.lng));
    const maxLng = Math.max(...positions.map(pos => pos.lng));

    // Add padding to bounds
    const latPadding = (maxLat - minLat) * 0.2;
    const lngPadding = (maxLng - minLng) * 0.2;

    const bounds = [
      [minLng - lngPadding, minLat - latPadding],
      [maxLng + lngPadding, maxLat + latPadding]
    ] as [[number, number], [number, number]];

    // Pan to flotilla center with appropriate zoom
    setTimeout(() => {
      map.fitBounds(bounds, {
        padding: 50,
        duration: 2000, // 2 second animation
        maxZoom: 8 // Don't zoom in too much
      });
    }, 1000); // Wait 1 second after vessels load

  }, [mapRef, vessels]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) return;
    const handler = () => {
      const event = new Event('maplibregl-map-click');
      window.dispatchEvent(event);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [mapRef]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: MEDITERRANEAN_CENTER[0],
          latitude: MEDITERRANEAN_CENTER[1],
          zoom: 5,
        }}
        minZoom={1}
        maxZoom={15}
        maxBounds={MEDITERRANEAN_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"
        attributionControl={false}
        scrollZoom={true}
        doubleClickZoom={true}
        dragPan={true}
        touchZoomRotate={true}
        keyboard={false}
        onLoad={() => setMapLoaded(true)}
      >
        <VesselPaths vessels={vessels} />
        <PortMarkers />
        <VesselMarkers vessels={vessels} />
      </Map>
      <CopyrightFooter onAboutClick={onAboutClick} />
      <MobileOverlay />
    </div>
  );
}
