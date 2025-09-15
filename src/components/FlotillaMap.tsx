'use client';

import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect } from 'react';
import { FaShip, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useMap } from '@/contexts/MapContext';
import { getAppVersion } from '@/utils/version';
import { Marker, Source, Layer } from 'react-map-gl/maplibre';
import { Vessel } from '@/contexts/MapContext';
import { 
  getVesselStatusIcon, 
  getVesselStatusDisplay, 
  shouldStatusPulse, 
  getPulsingColor,
  PULSING_STATUSES
} from '@/utils/vesselStatus';
import { getVesselMarkerColorClass, getVesselMarkerBorderClass } from '@/utils/vesselOrigin';
import { VesselStatus } from '@/types/vessel';
import { useState } from 'react';

interface FlotillaMapProps {
  vessels?: Vessel[];
}

const MEDITERRANEAN_BOUNDS: [number, number, number, number] = [-10, 25, 40, 50]; // Mediterranean Sea bounds: Spain to Syria (moved north)
const MEDITERRANEAN_CENTER = [15, 35]; // [lng, lat] - centered on Mediterranean (moved north)

// Historical vessel interceptions data
interface HistoricalInterception {
  id: string;
  vesselName: string;
  date: string;
  coordinates: { lat: number; lng: number };
  description: string;
  sources: string[];
  distanceFromGaza?: string;
}

const HISTORICAL_INTERCEPTIONS: HistoricalInterception[] = [
  {
    id: 'madleen-2025',
    vesselName: 'Madleen',
    date: '9 Jun 2025',
    coordinates: { lat: 31.95236, lng: 32.38880 },
    description: 'Exact position at the time of interception (03:02 CEST) published by the Freedom Flotilla Coalition; corroborated by independent reports.',
    sources: ['FFC press note (exact coords)', 'CODEPINK recap citing FFC', 'MarineInsight recap citing the same coords'],
    distanceFromGaza: '~50-70 NM'
  },
  {
    id: 'handala-2025',
    vesselName: 'Handala',
    date: '26–27 Jul 2025',
    coordinates: { lat: 31.990316, lng: 32.802406 },
    description: 'Last coordinates publicly posted by the FFC shortly before boarding (drone overhead; minutes to interception). NGOs report the boarding ~50–70 NM from Gaza but did not publish a boarding fix.',
    sources: ['FFC X post with coords', 'Adalah update (intercepted in international waters)', 'Al Jazeera/others on distance'],
    distanceFromGaza: '~50-70 NM'
  },
  {
    id: 'mavi-marmara-2010',
    vesselName: 'Mavi Marmara',
    date: '31 May 2010 (pre-dawn)',
    coordinates: { lat: 32.64113, lng: 33.56727 },
    description: 'Widely cited interception fix (≈70–80 NM from Gaza) used in multiple secondary references; UN/Palmer & UNHRC reports confirm international waters & distance but do not print a numeric coordinate.',
    sources: ['Veterans For Peace resolution quoting the fix', 'Wikipedia/Military-history mirror the same figure', 'UN/Palmer & UNHRC for distances/intl waters'],
    distanceFromGaza: '~70-80 NM'
  },
  {
    id: 'rachel-corrie-2010',
    vesselName: 'MV Rachel Corrie',
    date: '5 Jun 2010 (around noon)',
    coordinates: { lat: 31.5, lng: 34.0 }, // Approximate position ~16 NM offshore from Gaza
    description: 'Intercepted in international waters about 30 km (≈16 NM) off Gaza; no precise coordinate published in NGO/UN or major-press docs.',
    sources: ['Guardian contemporaneous report', 'UN site summary of UNHRC material'],
    distanceFromGaza: '~16 NM'
  }
];

// Historical Interception Modal Component
const HistoricalInterceptionModal = ({ 
  interception, 
  isOpen, 
  onClose 
}: { 
  interception: HistoricalInterception | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  if (!isOpen || !interception) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-hidden mb-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">Historical Interception</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <FaTimes className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
          <div className="space-y-4">
            {/* Vessel Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">{interception.vesselName}</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{interception.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Coordinates:</span>
                  <span>{interception.coordinates.lat.toFixed(6)}° N, {interception.coordinates.lng.toFixed(6)}° E</span>
                </div>
                {interception.distanceFromGaza && (
                  <div className="flex justify-between">
                    <span className="font-medium">Distance from Gaza:</span>
                    <span>{interception.distanceFromGaza}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-red-800 mb-2">Interception Details</h3>
              <p className="text-sm text-red-700 leading-relaxed">
                {interception.description}
              </p>
            </div>
            
            {/* Sources */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-blue-800 mb-2">Sources</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                {interception.sources.map((source, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Legal Note */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="text-base font-semibold text-yellow-800 mb-2">Legal Context</h3>
              <p className="text-sm text-yellow-700 leading-relaxed">
                All interceptions occurred in <strong>international waters</strong>, which constitutes a violation of international maritime law. 
                The right to freedom of navigation in international waters is protected under the United Nations Convention on the Law of the Sea (UNCLOS).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <span className="text-gray-500">Vessels Data: Forensic Architecture</span>
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

// Historical Interception Markers Component
const HistoricalInterceptionMarkers = ({ 
  onInterceptionClick 
}: { 
  onInterceptionClick: (interception: HistoricalInterception) => void; 
}) => {
  return (
    <>
      {HISTORICAL_INTERCEPTIONS.map((interception) => (
        <Marker
          key={interception.id}
          longitude={interception.coordinates.lng}
          latitude={interception.coordinates.lat}
        >
          <div className="cursor-pointer group z-20">
            {/* Pulsing red effect */}
            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-50"></div>
            
            {/* Main marker */}
            <div className="relative w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <FaExclamationTriangle className="w-3 h-3 text-white" />
            </div>
            
            {/* Hover tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {interception.vesselName} ({interception.date})
            </div>
            
            {/* Click handler */}
            <div 
              className="absolute inset-0"
              onClick={() => onInterceptionClick(interception)}
            />
          </div>
        </Marker>
      ))}
    </>
  );
};

// Port Markers Component
const PortMarkers = () => {
  const ports = [
    { name: 'Barcelona', lng: 2.177432, lat: 41.385064, color: 'blue' },
    { name: 'Tunis', lng: 10.181532, lat: 36.806495, color: 'blue' },
    { name: 'Porto Xiphonio Augusta', lng: 15.225000, lat: 37.232000, color: 'blue' },
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
  const statusDisplay = getVesselStatusDisplay(vessel.vessel_status as VesselStatus);
  const shouldPulse = shouldStatusPulse(vessel.vessel_status as VesselStatus);
  const pulsingColor = getPulsingColor(vessel.vessel_status as VesselStatus);

  // Get vessel origin-based colors
  const originColorClass = getVesselMarkerColorClass(vessel);
  const originBorderClass = getVesselMarkerBorderClass(vessel);

  const StatusIconComponent = statusIcon;

  return (
    <Marker
      key={vessel.id}
      longitude={lng}
      latitude={lat}
      onClick={() => showVesselDetails(vessel)}
    >
      <div className={`cursor-pointer group ${isHighPriority ? 'z-50' : 'z-10'}`}>
        {/* Spawn animation - boink effect */}
        {vessel.isSpawning && (
          <div className="absolute inset-0 animate-bounce">
            <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-30 animate-ping"></div>
          </div>
        )}
        
        {/* Pulsing effect for certain statuses */}
        {shouldPulse && (
          <div className={`absolute inset-0 ${pulsingColor} rounded-full animate-ping opacity-75`}></div>
        )}
        
        {/* Main marker */}
        <div className={`relative w-6 h-6 ${originColorClass} rounded-full border-2 ${originBorderClass} shadow-lg flex items-center justify-center transition-all duration-300 ${
          isHighPriority ? 'shadow-2xl ring-2 ring-yellow-400 ring-opacity-50' : ''
        } ${vessel.isSpawning ? 'animate-bounce scale-110' : ''}`}>
          <StatusIconComponent className="w-3 h-3 text-white" />
        </div>
        
        {/* Compass arrow - shows vessel heading direction */}
        {vessel.course !== null && vessel.course !== undefined && (
          <div 
            className="absolute w-0 h-0 border-l-6 border-r-6 border-b-12 border-transparent border-b-current"
            style={{
              color: originColorClass.includes('yellow') ? '#fbbf24' : 
                     originColorClass.includes('green') ? '#10b981' : 
                     originColorClass.includes('purple') ? '#8b5cf6' : 
                     originColorClass.includes('blue') ? '#3b82f6' : '#6b7280',
              // Position triangle centered on the circumference of the circle
              // Convert course to radians and calculate position on circle edge
              left: `${12 + 21 * Math.cos((vessel.course - 90) * Math.PI / 180)}px`,
              top: `${12 + 21 * Math.sin((vessel.course - 90) * Math.PI / 180)}px`,
              transform: `translate(-50%, -50%) rotate(${vessel.course}deg)`,
              transformOrigin: 'center',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              zIndex: 20
            }}
          />
        )}
        
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
  const [selectedInterception, setSelectedInterception] = useState<HistoricalInterception | null>(null);
  const [isInterceptionModalOpen, setIsInterceptionModalOpen] = useState(false);

  const handleInterceptionClick = (interception: HistoricalInterception) => {
    setSelectedInterception(interception);
    setIsInterceptionModalOpen(true);
  };

  const closeInterceptionModal = () => {
    setIsInterceptionModalOpen(false);
    setSelectedInterception(null);
  };

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
        <HistoricalInterceptionMarkers onInterceptionClick={handleInterceptionClick} />
        <VesselMarkers vessels={vessels} />
      </Map>
      <CopyrightFooter onAboutClick={onAboutClick} />
      <MobileOverlay />
      <HistoricalInterceptionModal 
        interception={selectedInterception}
        isOpen={isInterceptionModalOpen}
        onClose={closeInterceptionModal}
      />
    </div>
  );
}
