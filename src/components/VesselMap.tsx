"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { ArrowLeft, Ship, SquareArrowOutUpRight, LocateFixed, Info, Scale } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useVessels, useVesselPositions } from '@/hooks/queries/useVessels';
import { useAnalytics } from '@/hooks/useAnalytics';
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

// Function to create vessel icon using custom ship SVG
function createVesselIcon(origin: string | null, size: number = 22): L.Icon {
  const color = getOriginColor(origin);
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Vessel circle -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <!-- Ship icon -->
        <g transform="translate(${size/2 - 6}, ${size/2 - 6})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10 1C8.89543 1 8 1.89543 8 3V6H6C4.89543 6 4 6.89543 4 8V13C4 13.0335 4.00164 13.0666 4.00486 13.0993C3.72437 13.0809 3.43557 13.0509 3.13755 13.0095C2.78898 12.9611 2.44062 13.0995 2.22027 13.3739C1.99992 13.6483 1.94003 14.0183 2.06256 14.3482L4.53315 20.9998L4.49998 21C3.45179 21 2.99998 20.3556 2.99998 20C2.99998 19.4477 2.55227 19 1.99998 19C1.4477 19 0.999985 19.4477 0.999985 20C0.999985 21.8536 2.78675 23 4.49998 23C5.40393 23 6.32835 22.6808 6.99999 22.1071C7.67162 22.6808 8.59604 23 9.49998 23C10.4039 23 11.3283 22.6808 12 22.1071C12.6716 22.6808 13.596 23 14.5 23C15.4039 23 16.3283 22.6808 17 22.1071C17.6716 22.6808 18.596 23 19.5 23C21.2132 23 23 21.8536 23 20C23 19.4477 22.5523 19 22 19C21.4477 19 21 19.4477 21 20C21 20.3556 20.5482 21 19.5 21L19.4668 20.9998L21.9374 14.3482C22.0599 14.0183 22 13.6483 21.7797 13.3739C21.5594 13.0995 21.211 12.9611 20.8624 13.0095C20.5644 13.0509 20.2756 13.0809 19.9951 13.0993C19.9984 13.0666 20 13.0335 20 13V8C20 6.89543 19.1046 6 18 6H16V3C16 1.89543 15.1046 1 14 1H10ZM14 6V3H10V6H14ZM9 8H6V13L5.99997 13.0079C6.50436 12.9192 6.98319 12.7776 7.44451 12.5804C8.70387 12.0423 9.92703 11.05 11.2082 9.3892C11.3975 9.14376 11.69 9 12 9C12.31 9 12.6024 9.14376 12.7918 9.3892C14.0729 11.05 15.2961 12.0423 16.5555 12.5804C17.0168 12.7776 17.4956 12.9192 18 13.0079L18 13V8H15H9ZM17.8807 19.526L19.5174 15.1195C18.2039 15.1386 16.9623 14.9293 15.7695 14.4196C14.4111 13.839 13.1782 12.8954 12 11.5693C10.8218 12.8954 9.5889 13.839 8.23046 14.4196C7.03765 14.9293 5.79609 15.1386 4.48254 15.1195L6.11925 19.526C6.28815 19.2128 6.61922 19 6.99998 19C7.55227 19 7.99998 19.4477 7.99998 20C7.99998 20.3556 8.45179 21 9.49998 21C10.5482 21 11 20.3556 11 20C11 19.4477 11.4477 19 12 19C12.5523 19 13 19.4477 13 20C13 20.3556 13.4518 21 14.5 21C15.5482 21 16 20.3556 16 20C16 19.4477 16.4477 19 17 19C17.3808 19 17.7118 19.2128 17.8807 19.526Z" fill="#ffffff"/>
            </g>
          </svg>
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

// Function to create selected vessel icon with green border and pulsing effect
function createSelectedVesselIcon(origin: string | null, size: number = 22): L.Icon {
  const color = getOriginColor(origin);
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Pulsing background circle -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 + 4}" fill="#10b981" opacity="0.2">
          <animate attributeName="r" values="${size/2 + 4};${size/2 + 8};${size/2 + 4}" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.2;0.1;0.2" dur="2s" repeatCount="indefinite"/>
        </circle>
        <!-- Vessel circle with green border -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="#10b981" stroke-width="3"/>
        <!-- Ship icon -->
        <g transform="translate(${size/2 - 6}, ${size/2 - 6})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10 1C8.89543 1 8 1.89543 8 3V6H6C4.89543 6 4 6.89543 4 8V13C4 13.0335 4.00164 13.0666 4.00486 13.0993C3.72437 13.0809 3.43557 13.0509 3.13755 13.0095C2.78898 12.9611 2.44062 13.0995 2.22027 13.3739C1.99992 13.6483 1.94003 14.0183 2.06256 14.3482L4.53315 20.9998L4.49998 21C3.45179 21 2.99998 20.3556 2.99998 20C2.99998 19.4477 2.55227 19 1.99998 19C1.4477 19 0.999985 19.4477 0.999985 20C0.999985 21.8536 2.78675 23 4.49998 23C5.40393 23 6.32835 22.6808 6.99999 22.1071C7.67162 22.6808 8.59604 23 9.49998 23C10.4039 23 11.3283 22.6808 12 22.1071C12.6716 22.6808 13.596 23 14.5 23C15.4039 23 16.3283 22.6808 17 22.1071C17.6716 22.6808 18.596 23 19.5 23C21.2132 23 23 21.8536 23 20C23 19.4477 22.5523 19 22 19C21.4477 19 21 19.4477 21 20C21 20.3556 20.5482 21 19.5 21L19.4668 20.9998L21.9374 14.3482C22.0599 14.0183 22 13.6483 21.7797 13.3739C21.5594 13.0995 21.211 12.9611 20.8624 13.0095C20.5644 13.0509 20.2756 13.0809 19.9951 13.0993C19.9984 13.0666 20 13.0335 20 13V8C20 6.89543 19.1046 6 18 6H16V3C16 1.89543 15.1046 1 14 1H10ZM14 6V3H10V6H14ZM9 8H6V13L5.99997 13.0079C6.50436 12.9192 6.98319 12.7776 7.44451 12.5804C8.70387 12.0423 9.92703 11.05 11.2082 9.3892C11.3975 9.14376 11.69 9 12 9C12.31 9 12.6024 9.14376 12.7918 9.3892C14.0729 11.05 15.2961 12.0423 16.5555 12.5804C17.0168 12.7776 17.4956 12.9192 18 13.0079L18 13V8H15H9ZM17.8807 19.526L19.5174 15.1195C18.2039 15.1386 16.9623 14.9293 15.7695 14.4196C14.4111 13.839 13.1782 12.8954 12 11.5693C10.8218 12.8954 9.5889 13.839 8.23046 14.4196C7.03765 14.9293 5.79609 15.1386 4.48254 15.1195L6.11925 19.526C6.28815 19.2128 6.61922 19 6.99998 19C7.55227 19 7.99998 19.4477 7.99998 20C7.99998 20.3556 8.45179 21 9.49998 21C10.5482 21 11 20.3556 11 20C11 19.4477 11.4477 19 12 19C12.5523 19 13 19.4477 13 20C13 20.3556 13.4518 21 14.5 21C15.5482 21 16 20.3556 16 20C16 19.4477 16.4477 19 17 19C17.3808 19 17.7118 19.2128 17.8807 19.526Z" fill="#ffffff"/>
            </g>
          </svg>
        </g>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

// Function to create pulsing location marker icon with label
function createPulsingLocationIconWithLabel(cityName: string, countryName: string, color: string = '#3B82F6') {
  const size = 20;
  const padding = 8;
  const textWidth = Math.max(cityName.length, countryName.length) * 7 + 16; // Better text width calculation
  const totalWidth = size + textWidth + padding * 2;
  const totalHeight = size + padding * 2;
  
  const svg = `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <!-- Semi-transparent background with better positioning -->
      <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="rgba(0,0,0,0.7)" rx="6" ry="6" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      
      <!-- Pulsing circle -->
      <circle cx="${padding + size/2}" cy="${padding + size/2}" r="${size/2 - 2}" fill="${color}" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${padding + size/2}" cy="${padding + size/2}" r="${size/2 - 6}" fill="white" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>
      
      <!-- City name -->
      <text x="${padding + size + 6}" y="${padding + size/2 - 1}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">
        ${cityName}
      </text>
      
      <!-- Country name -->
      <text x="${padding + size + 6}" y="${padding + size/2 + 9}" font-family="Arial, sans-serif" font-size="9" fill="#E5E7EB">
        ${countryName}
      </text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-pulsing-marker-with-label',
    iconSize: [totalWidth, totalHeight],
    iconAnchor: [totalWidth/2, totalHeight/2],
  });
}

// Function to create green pulsing marker for Gaza with label
function createGreenPulsingIconWithLabel(cityName: string, countryName: string) {
  const size = 24;
  const padding = 8;
  const textWidth = Math.max(cityName.length, countryName.length) * 7 + 16;
  const totalWidth = size + textWidth + padding * 2;
  const totalHeight = size + padding * 2;
  
  const svg = `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <!-- Semi-transparent background with better positioning -->
      <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="rgba(0,0,0,0.7)" rx="6" ry="6" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      
      <!-- Pulsing circle -->
      <circle cx="${padding + size/2}" cy="${padding + size/2}" r="${size/2 - 2}" fill="#10B981" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${padding + size/2}" cy="${padding + size/2}" r="${size/2 - 6}" fill="white" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>
      
      <!-- City name -->
      <text x="${padding + size + 6}" y="${padding + size/2 - 1}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">
        ${cityName}
      </text>
      
      <!-- Country name -->
      <text x="${padding + size + 6}" y="${padding + size/2 + 9}" font-family="Arial, sans-serif" font-size="9" fill="#E5E7EB">
        ${countryName}
      </text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-pulsing-marker-with-label',
    iconSize: [totalWidth, totalHeight],
    iconAnchor: [totalWidth/2, totalHeight/2],
  });
}

// Function to create red interception marker with vessel name
function createRedInterceptionMarker(vesselName: string, date: string) {
  const size = 20;
  const padding = 8;
  const textWidth = Math.max(vesselName.length, date.length) * 7 + 16;
  const totalWidth = size + textWidth + padding * 2;
  const totalHeight = size + padding * 2;
  
  const svg = `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <!-- Semi-transparent background with better positioning -->
      <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="rgba(0,0,0,0.7)" rx="6" ry="6" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      
      <!-- Red circle -->
      <circle cx="${padding + size/2}" cy="${padding + size/2}" r="${size/2 - 2}" fill="#DC2626" opacity="0.9"/>
      <circle cx="${padding + size/2}" cy="${padding + size/2}" r="${size/2 - 6}" fill="white" opacity="0.9"/>
      
      <!-- Vessel name -->
      <text x="${padding + size + 6}" y="${padding + size/2 - 1}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">
        ${vesselName}
      </text>
      
      <!-- Date -->
      <text x="${padding + size + 6}" y="${padding + size/2 + 9}" font-family="Arial, sans-serif" font-size="9" fill="#FCA5A5">
        ${date}
      </text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-interception-marker',
    iconSize: [totalWidth, totalHeight],
    iconAnchor: [totalWidth/2, totalHeight/2],
  });
}

// Function to calculate offset position for course triangle (DEPRECATED - kept for backward compatibility)

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
      zIndexOffset={500}
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
  const analytics = useAnalytics();
  const [latestDataTimestamp, setLatestDataTimestamp] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<{ id: number; latitude?: number; longitude?: number; name?: string; origin?: string; course?: number; status?: string; speed_knots?: number; speed_kmh?: number; timestamp_utc?: string } | null>(null);
  const [selectedInterception, setSelectedInterception] = useState<{ 
    name: string; 
    date: string; 
    coordinates: [number, number]; 
    details: {
      mission: string;
      cargo: string;
      location: string;
      distance: string;
      outcome: string;
      casualties: string;
      status: string;
    }
  } | null>(null);
  
  // Get historical position data for selected vessel
  const { positions: selectedVesselPositions, loading: positionsLoading } = useVesselPositions(selectedVessel?.id);

  const loading = vesselsLoading;
  const error = vesselsError;

  // Function to handle vessel click - zoom to vessel and close drawer
  const handleVesselClick = (vessel: { id: number; latitude?: number; longitude?: number; name?: string; origin?: string; course?: number; status?: string; speed_knots?: number; speed_kmh?: number; timestamp_utc?: string }) => {
    if (mapRef && vessel.latitude && vessel.longitude) {
      // Track vessel click in analytics
      analytics.trackVesselClick(vessel.name || `Vessel ${vessel.id}`, vessel.id);
      
      // Set selected vessel
      setSelectedVessel(vessel);
      
      // Close drawer
      setIsDrawerOpen(false);
      
      // Fly to vessel location with smooth animation
      const vesselLatLng = L.latLng(vessel.latitude, vessel.longitude);
      mapRef.flyTo(vesselLatLng, 12, { 
        animate: true, 
        duration: 1.5,
        easeLinearity: 0.1
      });
    }
  };

  // Function to handle closing vessel info and returning to default view
  const handleCloseVesselInfo = () => {
    if (selectedVessel) {
      analytics.trackVesselInfoClose(selectedVessel.name || `Vessel ${selectedVessel.id}`);
    }
    setSelectedVessel(null);
    if (mapRef) {
      // Return to default center and zoom
      mapRef.flyTo([35.0, 0.0], 5, { 
        animate: true, 
        duration: 1.5,
        easeLinearity: 0.1
      });
    }
  };

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

      {/* About Button */}
      <Link 
        href="/about-sumudnusantara" 
        onClick={() => analytics.trackNavigationClick('about_sumudnusantara')}
        className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
      >
        <Info className="w-4 h-4" />
      </Link>

      {/* Development Timestamp */}
      {process.env.NODE_ENV === 'development' && latestDataTimestamp && (
        <div className="absolute top-4 right-18 z-[1000] bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700">
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
        zoom={5}
        minZoom={5}
        maxZoom={15}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        ref={setMapRef}
        maxBounds={[[25, -9], [46, 42]]}
        maxBoundsViscosity={1.0}
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
                icon={selectedVessel?.name === vessel.name && selectedVessel?.latitude === vessel.lat && selectedVessel?.longitude === vessel.lng ? createSelectedVesselIcon(vessel.origin) : createVesselIcon(vessel.origin)}
                zIndexOffset={selectedVessel?.name === vessel.name && selectedVessel?.latitude === vessel.lat && selectedVessel?.longitude === vessel.lng ? 1000 : 0}
                eventHandlers={{
                  click: () => onVesselClick?.({
                    id: index,
                    name: vessel.name,
                    origin: vessel.origin
                  })
                }}
              >
              <Popup>
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-green-500/30 rounded-lg shadow-2xl backdrop-blur-sm p-2 min-w-[200px]">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-600/20 to-green-500/10 border-b border-green-500/30 px-2 py-1 rounded-t-lg mb-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <h3 className="text-green-400 font-mono text-xs font-bold tracking-wider uppercase">
                        VESSEL STATUS
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    {/* Vessel Name */}
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">IDENTIFICATION</div>
                      <div className="text-xs font-bold text-white font-mono tracking-wide">{vessel.name}</div>
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">ORIGIN</div>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-1.5 h-1.5 rounded-full border border-slate-600" 
                            style={{ backgroundColor: getOriginColor(vessel.origin) }}
                          ></div>
                          <span className="text-green-300 font-mono text-xs">{vessel.origin || 'UNKNOWN'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">STATUS</div>
                        <div className="text-green-300 font-mono text-xs">ANIMATED</div>
                      </div>
                    </div>

                    {/* Technical Data */}
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">NAVIGATION</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500 font-mono">COURSE</div>
                          <div className="text-blue-300 font-mono text-xs">
                            {vessel.course ? `${vessel.course.toFixed(1)}°` : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500 font-mono">POSITION</div>
                          <div className="text-blue-300 font-mono text-xs">
                            {vessel.lat.toFixed(2)}, {vessel.lng.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">SYSTEM</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-400 font-mono text-xs">TRACKING</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-400 font-mono text-xs">GPS</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-0.5 border-t border-slate-700/50">
                      <div className="text-xs text-slate-500 font-mono text-center space-y-1">
                        <div>TIMELINE DATA</div>
                        {vessel.name === 'Shireen' && (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <Scale className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" /> LEGAL SUPPORT
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
                icon={selectedVessel?.id === vessel.id ? createSelectedVesselIcon(vessel.origin || null) : createVesselIcon(vessel.origin || null)}
                zIndexOffset={selectedVessel?.id === vessel.id ? 1000 : 0}
                eventHandlers={{
                  click: () => onVesselClick?.(vessel)
                }}
              >
              <Popup>
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-green-500/30 rounded-lg shadow-2xl backdrop-blur-sm p-2 min-w-[200px]">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-600/20 to-green-500/10 border-b border-green-500/30 px-2 py-1 rounded-t-lg mb-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <h3 className="text-green-400 font-mono text-xs font-bold tracking-wider uppercase">
                        VESSEL STATUS
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    {/* Vessel Name */}
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">IDENTIFICATION</div>
                      <div className="text-xs font-bold text-white font-mono tracking-wide">{vessel.name}</div>
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">ORIGIN</div>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-1.5 h-1.5 rounded-full border border-slate-600" 
                            style={{ backgroundColor: getOriginColor(vessel.origin || null) }}
                          ></div>
                          <span className="text-green-300 font-mono text-xs">{vessel.origin || 'UNKNOWN'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">STATUS</div>
                        <div className="text-green-300 font-mono text-xs">{vessel.vessel_status || 'ACTIVE'}</div>
                      </div>
                    </div>

                    {/* Technical Data */}
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">NAVIGATION</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500 font-mono">COURSE</div>
                          <div className="text-blue-300 font-mono text-xs">
                            {vessel.course ? `${vessel.course.toFixed(1)}°` : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500 font-mono">SPEED</div>
                          <div className="text-blue-300 font-mono text-xs">
                            {vessel.speed_knots ? `${vessel.speed_knots.toFixed(1)} kts` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Position Data */}
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">POSITION</div>
                      <div className="text-blue-300 font-mono text-xs">
                        {vessel.latitude?.toFixed(2)}, {vessel.longitude?.toFixed(2)}
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">SYSTEM</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-400 font-mono text-xs">TRACKING</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-400 font-mono text-xs">GPS</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-0.5 border-t border-slate-700/50">
                      <div className="text-xs text-slate-500 font-mono text-center space-y-1">
                        <div>
                          {vessel.timestamp_utc ? 
                            new Date(vessel.timestamp_utc).toISOString().replace('T', ' ').substring(0, 19) + ' UTC' :
                            'NO DATA'
                          }
                        </div>
                        {vessel.name === 'Shireen' && (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              LEGAL SUPPORT
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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

        {/* Pulsing Location Markers */}
        {/* Barcelona, Spain */}
        <Marker position={[41.3851, 2.1734]} icon={createPulsingLocationIconWithLabel('Barcelona', 'Spain', '#3B82F6')} />

        {/* Tunis, Tunisia */}
        <Marker position={[36.8065, 10.1815]} icon={createPulsingLocationIconWithLabel('Tunis', 'Tunisia', '#3B82F6')} />

        {/* Augusta, Sicily */}
        <Marker position={[37.2056, 15.2203]} icon={createPulsingLocationIconWithLabel('Augusta', 'Sicily, Italy', '#3B82F6')} />

        {/* Ermoupoli, Greece */}
        <Marker position={[37.4414, 24.9347]} icon={createPulsingLocationIconWithLabel('Ermoupoli', 'Greece', '#3B82F6')} />

        {/* Gaza (Green Marker) */}
        <Marker position={[31.3547, 34.3088]} icon={createGreenPulsingIconWithLabel('Gaza', 'Palestine')} />

        {/* Previous Interception Markers */}
        {/* Madleen - 9 Jun 2025 */}
        <Marker 
          position={[31.95236, 32.38880]} 
          icon={createRedInterceptionMarker('Madleen', '9 Jun 2025')}
          eventHandlers={{
            click: () => {
              setSelectedInterception({
                name: 'Madleen',
                date: '9 Jun 2025',
                coordinates: [31.95236, 32.38880],
                details: {
                  mission: 'Freedom Flotilla Coalition 2025',
                  cargo: 'Humanitarian aid',
                  location: 'International waters off Gaza',
                  distance: 'Approximately 50-70 NM from Gaza',
                  outcome: 'Intercepted by Israeli forces',
                  casualties: 'No casualties reported',
                  status: 'Vessel and crew detained'
                }
              });
            }
          }}
        />

        {/* Handala - 26-27 Jul 2025 */}
        <Marker 
          position={[31.990316, 32.802406]} 
          icon={createRedInterceptionMarker('Handala', '26-27 Jul 2025')}
          eventHandlers={{
            click: () => {
              setSelectedInterception({
                name: 'Handala',
                date: '26-27 Jul 2025',
                coordinates: [31.990316, 32.802406],
                details: {
                  mission: 'Freedom Flotilla Coalition 2025',
                  cargo: 'Humanitarian aid',
                  location: 'International waters off Gaza',
                  distance: 'Approximately 50-70 NM from Gaza',
                  outcome: 'Intercepted by Israeli forces',
                  casualties: 'No casualties reported',
                  status: 'Vessel and crew detained'
                }
              });
            }
          }}
        />

        {/* Mavi Marmara - 31 May 2010 */}
        <Marker 
          position={[32.64113, 33.56727]} 
          icon={createRedInterceptionMarker('Mavi Marmara', '31 May 2010')}
          eventHandlers={{
            click: () => {
              setSelectedInterception({
                name: 'Mavi Marmara',
                date: '31 May 2010',
                coordinates: [32.64113, 33.56727],
                details: {
                  mission: 'Gaza Freedom Flotilla',
                  cargo: 'Humanitarian aid and construction materials',
                  location: 'International waters off Gaza',
                  distance: 'Approximately 70-80 NM from Gaza',
                  outcome: 'Intercepted by Israeli forces',
                  casualties: '9 activists killed, 10 wounded',
                  status: 'Vessel seized, crew detained'
                }
              });
            }
          }}
        />

        {/* MV Rachel Corrie - 5 Jun 2010 (Estimated Location) */}
        <Marker 
          position={[31.6, 33.8]} 
          icon={createRedInterceptionMarker('MV Rachel Corrie', '5 Jun 2010 (Est.)')}
          eventHandlers={{
            click: () => {
              setSelectedInterception({
                name: 'MV Rachel Corrie',
                date: '5 Jun 2010',
                coordinates: [31.6, 33.8],
                details: {
                  mission: 'Gaza Freedom Flotilla',
                  cargo: 'Humanitarian aid, medical supplies, construction materials',
                  location: 'International waters off Gaza',
                  distance: 'Approximately 30 km (16 NM) from Gaza',
                  outcome: 'Intercepted by Israeli forces',
                  casualties: 'No casualties',
                  status: 'Vessel escorted to Ashdod, crew deported'
                }
              });
            }
          }}
        />

      </MapContainer>

      {/* Donate Button */}
      <div className="absolute bottom-[260px] left-4 z-[1000] w-[120px]">
        <a 
          href="https://mapim.berisalam.net/form/kecemasanpalestin"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => analytics.trackDonationClick('map_tracker')}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg shadow-lg transition-colors text-sm block text-center"
        >
          Donate 🇵🇸
        </a>
      </div>

      {/* Animated Legend */}
        <div 
          className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-[120px] cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
          onClick={() => {
            analytics.trackDrawerOpen();
            setIsDrawerOpen(true);
          }}
        >
        {/* Top right corner icon */}
        <div className="absolute top-1 right-1">
          <SquareArrowOutUpRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </div>
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

      {/* Vessel List Drawer */}
      <>
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 ${
            isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => {
            analytics.trackDrawerClose();
            setIsDrawerOpen(false);
          }}
        />
        
        {/* Drawer */}
        <div className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-800 shadow-xl z-[2001] transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
            <div className="p-4 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Active Vessels ({vessels.length})
                </h2>
                <button
                  onClick={() => {
                    analytics.trackDrawerClose();
                    setIsDrawerOpen(false);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Vessel List */}
              <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {(() => {
                  // Group vessels by origin
                  const groupedVessels = vessels.reduce((groups, vessel) => {
                    const origin = vessel.origin || 'Unknown';
                    if (!groups[origin]) {
                      groups[origin] = [];
                    }
                    groups[origin].push(vessel);
                    return groups;
                  }, {} as Record<string, typeof vessels>);

                  return Object.entries(groupedVessels).map(([origin, originVessels]) => (
                    <div key={origin} className="space-y-2">
                      {/* Origin Header */}
                      <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getOriginColor(origin) }}
                        />
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300 capitalize">
                          {origin} ({originVessels.length})
                        </span>
                      </div>
                      
                      {/* Vessels in this origin */}
                      <div className="space-y-1 pl-4">
                        {originVessels.map((vessel) => (
                          <div 
                            key={vessel.id}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer"
                            onClick={() => handleVesselClick(vessel)}
                          >
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getOriginColor(vessel.origin || null) }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                                {vessel.name || `Vessel ${vessel.id}`}
                                {vessel.name === 'Shireen' && (
                                  <Scale className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                              {vessel.status}
                            </div>
                            <LocateFixed className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
      </>

      {/* Interception Details Drawer */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-red-500/30 shadow-2xl z-[2003] transform transition-transform duration-300 ease-in-out ${
        selectedInterception ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border-b border-red-500/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="text-red-400 font-mono text-sm font-bold tracking-wider uppercase">
                  INTERCEPTION DETAILS
                </h3>
              </div>
              <button
                onClick={() => setSelectedInterception(null)}
                className="text-slate-400 hover:text-red-400 transition-colors duration-200 font-mono text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Vessel Name */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">VESSEL</div>
              <div className="text-lg font-bold text-white">{selectedInterception?.name}</div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">DATE</div>
              <div className="text-sm text-slate-300">{selectedInterception?.date}</div>
            </div>

            {/* Coordinates */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">COORDINATES</div>
              <div className="text-sm text-slate-300 font-mono">
                {selectedInterception?.coordinates[0].toFixed(6)}°N, {selectedInterception?.coordinates[1].toFixed(6)}°E
              </div>
            </div>

            {/* Mission */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">MISSION</div>
              <div className="text-sm text-slate-300">{selectedInterception?.details.mission}</div>
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">CARGO</div>
              <div className="text-sm text-slate-300">{selectedInterception?.details.cargo}</div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">LOCATION</div>
              <div className="text-sm text-slate-300">{selectedInterception?.details.location}</div>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">DISTANCE FROM GAZA</div>
              <div className="text-sm text-slate-300">{selectedInterception?.details.distance}</div>
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">OUTCOME</div>
              <div className="text-sm text-red-300">{selectedInterception?.details.outcome}</div>
            </div>

            {/* Casualties */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">CASUALTIES</div>
              <div className="text-sm text-slate-300">{selectedInterception?.details.casualties}</div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">STATUS</div>
              <div className="text-sm text-slate-300">{selectedInterception?.details.status}</div>
            </div>

            {/* Additional Context */}
            <div className="space-y-2 pt-4 border-t border-slate-700/50">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">CONTEXT</div>
              <div className="text-sm text-slate-400 leading-relaxed">
                {selectedInterception?.name === 'Mavi Marmara' && 
                  "The Mavi Marmara incident was the deadliest confrontation in the Gaza flotilla operations, resulting in international condemnation and UN investigations. The vessel was carrying humanitarian aid and activists from various countries."
                }
                {selectedInterception?.name === 'MV Rachel Corrie' && 
                  "Named after American activist Rachel Corrie, who was killed by an Israeli bulldozer in Gaza in 2003, this vessel carried humanitarian aid including medical supplies and construction materials."
                }
                {(selectedInterception?.name === 'Madleen' || selectedInterception?.name === 'Handala') && 
                  "Part of the Freedom Flotilla Coalition's ongoing efforts to break the illegal blockade of Gaza and deliver humanitarian aid to the Palestinian people."
                }
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-700/50 px-4 pb-4">
            <div className="text-xs text-slate-500 font-mono text-center">
              Data sourced from Freedom Flotilla Coalition and international reports
            </div>
          </div>
        </div>
      </div>

      {/* Vessel Info Box */}
      {selectedVessel && (
        <div className="fixed top-4 right-4 z-[2002] w-72 sm:w-80">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-green-500/30 rounded-lg shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600/20 to-green-500/10 border-b border-green-500/30 px-3 py-2 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="text-green-400 font-mono text-xs font-bold tracking-wider uppercase">
                    VESSEL STATUS
                  </h3>
                  {selectedVessel?.name === 'Shireen' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Scale className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0 mr-2" /> LEGAL SUPPORT
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCloseVesselInfo}
                  className="text-slate-400 hover:text-red-400 transition-colors duration-200 font-mono text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Vessel Name */}
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">IDENTIFICATION</div>
                <div className="text-sm font-bold text-white font-mono tracking-wide truncate">{selectedVessel.name || `Vessel ${selectedVessel.id}`}</div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">ORIGIN</div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full border border-slate-600" 
                      style={{ backgroundColor: getOriginColor(selectedVessel.origin || null) }}
                    ></div>
                    <span className="text-green-300 font-mono text-xs">{selectedVessel.origin || 'UNKNOWN'}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">STATUS</div>
                  <div className="text-green-300 font-mono text-xs">{selectedVessel.status || 'ACTIVE'}</div>
                </div>
              </div>

              {/* Speed Graph */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">SPEED PROFILE</div>
                <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 font-mono">KNOTS</span>
                    <span className="text-xs text-red-400 font-mono">
                      {(() => {
                        // Use most recent speed from historical data if available
                        let currentSpeed;
                        if (selectedVesselPositions && selectedVesselPositions.length > 0) {
                          const latestPosition = selectedVesselPositions[0]; // Most recent first
                          currentSpeed = latestPosition.speed_knots || (latestPosition.speed_kmh ? latestPosition.speed_kmh / 1.852 : 0);
                        } else {
                          currentSpeed = selectedVessel.speed_knots || (selectedVessel.speed_kmh ? selectedVessel.speed_kmh / 1.852 : 0);
                        }
                        return `${currentSpeed.toFixed(1)} kts`;
                      })()}
                    </span>
                  </div>
                  <div className="relative h-8 bg-slate-800 rounded overflow-hidden">
                    {positionsLoading ? (
                      /* Loading state */
                      <div className="flex items-center justify-center h-full">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          <span className="text-xs text-slate-400 font-mono ml-2">LOADING...</span>
                        </div>
                      </div>
                    ) : (
                      /* Speed Line Graph */
                      <svg className="w-full h-full" viewBox="0 0 100 32">
                        {/* Grid lines */}
                        <line x1="0" y1="16" x2="100" y2="16" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
                        <line x1="0" y1="8" x2="100" y2="8" stroke="#374151" strokeWidth="0.5" opacity="0.2"/>
                        <line x1="0" y1="24" x2="100" y2="24" stroke="#374151" strokeWidth="0.5" opacity="0.2"/>
                        
                        {/* Speed line - use actual historical data */}
                        {(() => {
                          if (!selectedVesselPositions || selectedVesselPositions.length === 0) {
                            // Fallback to current speed if no historical data
                            const currentSpeed = selectedVessel.speed_knots || (selectedVessel.speed_kmh ? selectedVessel.speed_kmh / 1.852 : 0);
                            const maxSpeed = Math.max(currentSpeed, 15);
                            const normalizedCurrent = Math.min(currentSpeed / maxSpeed, 1);
                            const y = 32 - (normalizedCurrent * 24);
                            return (
                              <polyline
                                points={`0,${y} 20,${y} 40,${y} 60,${y} 80,${y} 100,${y}`}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1"
                                opacity="0.7"
                              />
                            );
                          }

                          // Get last 6 speed readings (most recent first, so reverse)
                          const recentPositions = selectedVesselPositions.slice(0, 6).reverse();
                          const speeds = recentPositions.map(pos => pos.speed_knots || (pos.speed_kmh ? pos.speed_kmh / 1.852 : 0));
                          const maxSpeed = Math.max(...speeds, 15); // Ensure minimum scale
                          
                          const points = speeds.map((speed, i) => {
                            const x = (i / (speeds.length - 1)) * 100;
                            const normalizedSpeed = Math.min(speed / maxSpeed, 1);
                            const y = 32 - (normalizedSpeed * 24);
                            return `${x},${y}`;
                          });
                          
                          return (
                            <polyline
                              points={points.join(' ')}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="1"
                              opacity="0.7"
                            />
                          );
                        })()}
                        
                        {/* Current speed indicator */}
                        <circle
                          cx="100"
                          cy={(() => {
                            // Use most recent speed from historical data if available
                            let currentSpeed;
                            if (selectedVesselPositions && selectedVesselPositions.length > 0) {
                              const latestPosition = selectedVesselPositions[0]; // Most recent first
                              currentSpeed = latestPosition.speed_knots || (latestPosition.speed_kmh ? latestPosition.speed_kmh / 1.852 : 0);
                            } else {
                              currentSpeed = selectedVessel.speed_knots || (selectedVessel.speed_kmh ? selectedVessel.speed_kmh / 1.852 : 0);
                            }
                            
                            const maxSpeed = Math.max(currentSpeed, 15);
                            const normalizedCurrent = Math.min(currentSpeed / maxSpeed, 1);
                            return 32 - (normalizedCurrent * 24);
                          })()}
                          r="2"
                          fill="#ef4444"
                          opacity="1"
                        >
                          <animate
                            attributeName="opacity"
                            values="1;0.3;1"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Data */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">NAVIGATION</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-mono">COURSE</div>
                    <div className="text-blue-300 font-mono text-xs">
                      {selectedVessel.course ? `${selectedVessel.course.toFixed(1)}°` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-mono">POSITION</div>
                    <div className="text-blue-300 font-mono text-xs">
                      {selectedVessel.latitude?.toFixed(2)}, {selectedVessel.longitude?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">SYSTEM</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-mono text-xs">TRACKING</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-400 font-mono text-xs">GPS</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-1 border-t border-slate-700/50">
                <div className="text-xs text-slate-500 font-mono text-center space-y-1">
                  <div>
                    {selectedVessel.timestamp_utc ? 
                      new Date(selectedVessel.timestamp_utc).toISOString().replace('T', ' ').substring(0, 19) + ' UTC' :
                      'NO DATA'
                    }
                  </div>
                  <div className="text-slate-600">
                    <a 
                      href="https://forensic-architecture.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-green-400 transition-colors duration-200"
                    >
                      Vessel tracking data provided by Forensic Architecture
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

