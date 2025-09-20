"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { ArrowLeft, Ship, Clock, Navigation, Route } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useVessels } from '@/hooks/queries/useVessels';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Color scheme for vessel origins
const ORIGIN_COLORS: Record<string, string> = {
  'barcelona': '#3b82f6',    // Blue
  'sicily': '#8b5cf6',       // Purple
  'tunis': '#10b981',        // Green
  'greece': '#f59e0b',       // Orange
  'libya': '#ef4444',        // Red
  'unknown': '#6b7280',      // Gray for null/unknown origins
};

// Function to get color based on origin
function getOriginColor(origin: string | null): string {
  if (!origin) return ORIGIN_COLORS['unknown'];
  const normalizedOrigin = origin.toLowerCase();
  return ORIGIN_COLORS[normalizedOrigin] || ORIGIN_COLORS['unknown'];
}

// Function to create vessel icon (boat only, no course triangle)
function createVesselIcon(origin: string | null, size: number = 25): L.Icon {
  const color = getOriginColor(origin);
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Vessel circle -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <!-- Boat icon -->
        <g transform="translate(${size/2 - 6}, ${size/2 - 6}) scale(0.5)">
          <!-- Simple boat shape -->
          <path d="M4 8 L20 8 L18 12 L6 12 Z" fill="white"/>
          <path d="M6 4 L18 4 L16 8 L8 8 Z" fill="white"/>
          <path d="M12 2 L12 4" stroke="white" stroke-width="1"/>
          <path d="M12 2 L14 3 L12 4 Z" fill="white"/>
        </g>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

// Function to create course direction triangle icon
function createCourseTriangleIcon(origin: string | null, course: number, size: number = 16): L.Icon {
  const color = getOriginColor(origin);
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${course} ${size/2} ${size/2})">
          <polygon 
            points="${size/2},2 ${size/2 - size/3},${size - 2} ${size/2 + size/3},${size - 2}"
            fill="${color}"
          />
        </g>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

// Function to calculate offset position for course triangle (DEPRECATED - kept for backward compatibility)
function calculateTriangleOffset(lat: number, lng: number, course: number, offsetDistance: number = 0.02): [number, number] {
  // Convert course from degrees to radians
  const courseRad = (course * Math.PI) / 180;
  
  // Calculate offset coordinates
  const offsetLat = lat + offsetDistance * Math.cos(courseRad);
  const offsetLng = lng + offsetDistance * Math.sin(courseRad);
  
  return [offsetLat, offsetLng];
}

// Component to render course triangle with zoom-independent positioning
function CourseTriangle({ vesselLat, vesselLng, course, origin }: { 
  vesselLat: number; 
  vesselLng: number; 
  course: number; 
  origin: string | null; 
}) {
  const map = useMap();
  const [trianglePosition, setTrianglePosition] = useState<[number, number]>([vesselLat, vesselLng]);

  useEffect(() => {
    // Function to update triangle position based on zoom level
    const updateTrianglePosition = () => {
      const vesselPoint = map.latLngToContainerPoint([vesselLat, vesselLng]);
      
      // Calculate pixel offset (zoom-independent)
      const pixelOffset = 20; // Fixed pixel distance from vessel center
      const courseRad = (course * Math.PI) / 180;
      
      // Calculate offset in pixels
      const offsetX = pixelOffset * Math.sin(courseRad);
      const offsetY = -pixelOffset * Math.cos(courseRad); // Negative Y because screen coordinates are inverted
      
      // Convert back to lat/lng
      const trianglePoint = L.point(vesselPoint.x + offsetX, vesselPoint.y + offsetY);
      const triangleLatLng = map.containerPointToLatLng(trianglePoint);
      
      setTrianglePosition([triangleLatLng.lat, triangleLatLng.lng]);
    };

    // Update position when map view changes (zoom, pan)
    const handleViewChange = () => {
      updateTrianglePosition();
    };

    // Initial position calculation
    updateTrianglePosition();

    // Listen for map view changes
    map.on('viewreset zoomend moveend', handleViewChange);

    return () => {
      map.off('viewreset zoomend moveend', handleViewChange);
    };
  }, [map, vesselLat, vesselLng, course]);

  return (
    <Marker
      position={trianglePosition}
      icon={createCourseTriangleIcon(origin, course)}
      interactive={false}
    />
  );
}

// Function to calculate actual vessel pathway up to current timeline frame
function calculateActualVesselPathway(
  vesselName: string,
  timelineData: Array<{
    timestamp: string;
    vessels: Array<{
      name: string;
      lat: number;
      lng: number;
      origin: string | null;
    }>;
  }>,
  currentFrame: number
): Array<[number, number]> {
  if (currentFrame < 0 || currentFrame >= timelineData.length) {
    return [];
  }

  // Get actual vessel positions up to current frame
  const vesselPositions: Array<[number, number]> = [];
  
  for (let i = 0; i <= currentFrame; i++) {
    const frame = timelineData[i];
    const vesselInFrame = frame.vessels.find(v => v.name === vesselName);
    
    if (vesselInFrame) {
      vesselPositions.push([vesselInFrame.lat, vesselInFrame.lng]);
    }
  }

  return vesselPositions;
}

// Component to handle map recentering based on vessel positions
function MapRecenter({ vessels }: { vessels: Array<{ latitude?: number | null; longitude?: number | null }> }) {
  const map = useMap();
  const [hasRecentered, setHasRecentered] = useState(false);

  useEffect(() => {
    // Only recenter once when vessels are loaded and we haven't recentered yet
    if (vessels.length > 0 && !hasRecentered) {
      const validVessels = vessels.filter(vessel => 
        vessel.latitude && vessel.longitude && 
        !isNaN(parseFloat(vessel.latitude.toString())) && 
        !isNaN(parseFloat(vessel.longitude.toString()))
      );

      if (validVessels.length > 0) {
        // Calculate bounds of all vessel positions
        const positions = validVessels.map(vessel => [
          parseFloat(vessel.latitude!.toString()),
          parseFloat(vessel.longitude!.toString())
        ] as [number, number]);

        // Create bounds from all positions
        const bounds = L.latLngBounds(positions);
        
        // Add some padding to the bounds
        const paddedBounds = bounds.pad(0.1); // 10% padding
        
        // Fit the map to show all vessels with padding
        map.fitBounds(paddedBounds, {
          padding: [20, 20], // Additional padding in pixels
          maxZoom: 8 // Don't zoom in too close
        });

        setHasRecentered(true);
      }
    }
  }, [vessels, map, hasRecentered]);

  return null; // This component doesn't render anything
}

// Animated count component
function AnimatedCount({ count }: { count: number }) {
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = count / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newCount = Math.min(Math.floor(increment * currentStep), count);
      setDisplayCount(newCount);

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayCount(count);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [count]);

  return <>{displayCount}</>;
}

interface VesselMapProps {
  onVesselClick?: (vessel: { id: number; name: string; origin?: string | null }) => void;
  showPathways?: boolean;
  vesselPositions?: Record<string, Array<{
    latitude: number;
    longitude: number;
    timestamp_utc: string;
  }>>;
  animatedVessels?: Array<{name: string, lat: number, lng: number, origin: string | null, course: number | null}> | null;
  timelineData?: Array<{
    timestamp: string;
    vessels: Array<{
      name: string;
      lat: number;
      lng: number;
      origin: string | null;
      course: number | null;
    }>;
  }>;
  currentTimelineFrame?: number;
}

export default function VesselMap({ onVesselClick, showPathways = true, vesselPositions = {}, animatedVessels, timelineData, currentTimelineFrame }: VesselMapProps) {
  const { vessels, loading: vesselsLoading, error: vesselsError } = useVessels();
  const [latestDataTimestamp, setLatestDataTimestamp] = useState<string | null>(null);

  const loading = vesselsLoading;
  const error = vesselsError;

  // Fetch latest timestamp from cron job (development only)
  useEffect(() => {
    async function fetchLatestTimestamp() {
      try {
        const response = await fetch('/api/cron/fetch-vessel-data?timestamp=true');
        if (response.ok) {
          const data = await response.json();
          if (data.latestTimestamp) {
            setLatestDataTimestamp(data.latestTimestamp);
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest timestamp:', error);
      }
    }

    // Only fetch in development
    if (process.env.NODE_ENV === 'development') {
      fetchLatestTimestamp();
    }
  }, []);

  // Process vessel pathways for display
  const vesselPathways = showPathways ? Object.entries(vesselPositions).reduce((acc, [vesselName, positions]) => {
    const validPositions = positions.filter(position => {
      const lat = parseFloat(position.latitude.toString());
      const lng = parseFloat(position.longitude.toString());
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });

    if (validPositions.length > 0) {
      acc[vesselName] = validPositions.map(position => [
        parseFloat(position.latitude.toString()),
        parseFloat(position.longitude.toString())
      ] as [number, number]);
    }

    return acc;
  }, {} as Record<string, [number, number][]>) : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Error Loading Map</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-[1000] bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>

      {/* Development Timestamp */}
      {process.env.NODE_ENV === 'development' && latestDataTimestamp && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <div className="font-medium mb-1">Latest Data:</div>
            <div className="font-mono text-xs">
              {new Date(latestDataTimestamp).toLocaleString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'UTC'
              })}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[35.0, 0.0]}
        zoom={3}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abc"
          maxZoom={20}
        />
        
        {/* Map Recenter Component */}
        <MapRecenter vessels={vessels} />
        
        {/* Vessel Pathways */}
        {showPathways && (() => {
          // If we're in timeline mode with timeline data, show actual vessel pathways up to current frame
          if (timelineData && currentTimelineFrame !== undefined && animatedVessels) {
            return Object.entries(vesselPathways).map(([vesselName, pathway]) => {
              if (pathway.length === 0) return null;
              
              const vessel = vessels.find(v => v.name === vesselName);
              const color = getOriginColor(vessel?.origin || null);
              
              // Calculate actual pathway based on where the vessel has been in timeline
              const actualPathway = calculateActualVesselPathway(
                vesselName,
                timelineData,
                currentTimelineFrame
              );
              
              if (actualPathway.length === 0) return null;
              
              return (
                <Polyline
                  key={`actual-pathway-${vesselName}`}
                  positions={actualPathway}
                  color={color}
                  weight={2}
                  opacity={0.8}
                  dashArray="5, 5"
                />
              );
            });
          } else {
            // Static pathways for normal mode
            return Object.entries(vesselPathways).map(([vesselName, pathway]) => {
              if (pathway.length === 0) return null;
              
              const vessel = vessels.find(v => v.name === vesselName);
              const color = getOriginColor(vessel?.origin || null);
              
              return (
                <Polyline
                  key={`pathway-${vesselName}`}
                  positions={pathway}
                  color={color}
                  weight={2}
                  opacity={0.7}
                  dashArray="5, 5"
                />
              );
            });
          }
        })()}
        
        {/* Vessel Markers */}
        {animatedVessels ? (
          // Show animated vessels from timeline
          animatedVessels.map((vessel, index) => (
            <React.Fragment key={`${vessel.name}-${index}`}>
              {/* Vessel Marker */}
              <Marker
                position={[vessel.lat, vessel.lng]}
                icon={createVesselIcon(vessel.origin)}
                eventHandlers={{
                  click: () => onVesselClick?.({
                    id: index,
                    name: vessel.name,
                    origin: vessel.origin
                  })
                }}
              >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
                    {vessel.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">Animated Position</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-slate-600 dark:text-slate-400">
                        Lat: {vessel.lat.toFixed(4)}, Lng: {vessel.lng.toFixed(4)}
                      </span>
                    </div>
                    
                    {vessel.origin && (
                      <div className="text-slate-600 dark:text-slate-400">
                        Origin: {vessel.origin}
                      </div>
                    )}
                    
                    {vessel.course && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Course: {vessel.course}°
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
              </Marker>
              
              {/* Course Direction Triangle for Animated Vessels */}
              {vessel.course && (
                <CourseTriangle
                  vesselLat={vessel.lat}
                  vesselLng={vessel.lng}
                  course={vessel.course}
                  origin={vessel.origin}
                />
              )}
            </React.Fragment>
          ))
        ) : (
          // Show static vessels
          vessels.filter(vessel => vessel.latitude && vessel.longitude).map((vessel) => (
            <React.Fragment key={vessel.id}>
              {/* Vessel Marker */}
              <Marker
                position={[parseFloat(vessel.latitude!.toString()), parseFloat(vessel.longitude!.toString())]}
                icon={createVesselIcon(vessel.origin || null)}
                eventHandlers={{
                  click: () => onVesselClick?.(vessel)
                }}
              >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
                    {vessel.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">GSF ID: {vessel.gsf_id}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {vessel.timestamp_utc ? new Date(vessel.timestamp_utc).toLocaleString('en-GB', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'UTC'
                        }) : 'No timestamp'}
                      </span>
                    </div>
                    
                    {vessel.speed_knots && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {vessel.speed_knots.toFixed(1)} knots
                          {vessel.course && ` • Course: ${vessel.course}°`}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-slate-600 dark:text-slate-400 capitalize">
                        {vessel.vessel_status}
                      </span>
                    </div>
                    
                    {vessel.origin && (
                      <div className="text-slate-600 dark:text-slate-400">
                        Origin: {vessel.origin}
                      </div>
                    )}
                    
                    {vesselPositions[vessel.name] && vesselPositions[vessel.name].length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                        <div className={`flex items-center gap-2 ${
                          vessel.name === 'Spectre' ? 'text-blue-600' :
                          vessel.name === 'Adara' ? 'text-purple-600' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          <Route className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Pathway: {vesselPositions[vessel.name].length} positions
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          From {new Date(vesselPositions[vessel.name][0]?.timestamp_utc).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC'
                          })} 
                          to {new Date(vesselPositions[vessel.name][vesselPositions[vessel.name].length - 1]?.timestamp_utc).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
              </Marker>
              
              {/* Course Direction Triangle for Static Vessels */}
              {vessel.course && (
                <CourseTriangle
                  vesselLat={parseFloat(vessel.latitude!.toString())}
                  vesselLng={parseFloat(vessel.longitude!.toString())}
                  course={parseFloat(vessel.course.toString())}
                  origin={vessel.origin || null}
                />
              )}
            </React.Fragment>
          ))
        )}
      </MapContainer>

      {/* Donate Button */}
      <div className="absolute bottom-[260px] left-4 z-[1000] w-[120px]">
        <a 
          href="https://mapim.berisalam.net/form/kecemasanpalestin"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg shadow-lg transition-colors text-sm block text-center"
        >
          Donate
        </a>
      </div>

      {/* Animated Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-[120px]">
        <div className="space-y-2">
          {/* Vessel Count */}
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-800 dark:text-slate-200 mb-1">
              <AnimatedCount count={vessels.length} />
            </div>
            <div className="flex items-center justify-center gap-1">
              <Ship className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Vessels</span>
            </div>
          </div>

          {/* Origin Legend */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Origins</h4>
            {Object.entries(ORIGIN_COLORS).map(([origin, color]) => {
              const vesselCount = vessels.filter(v => 
                origin === 'unknown' ? !v.origin : v.origin?.toLowerCase() === origin
              ).length;
              
              if (vesselCount === 0) return null;
              
              return (
                <div key={origin} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {origin === 'unknown' ? 'Unknown' : origin}
                  </span>
                  <span className="text-slate-500 dark:text-slate-500 ml-auto">
                    {vesselCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

