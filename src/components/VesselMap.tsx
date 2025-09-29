"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { ArrowLeft, Ship, SquareArrowOutUpRight, LocateFixed, Info, Scale, Maximize, Minimize, Share2, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useVessels, useVesselPositions } from '@/hooks/queries/useVessels';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAttackStatus } from '@/hooks/useAttackStatus';
import { createPulsingVesselIcon } from './PulsingVesselIcon';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computationCache } from '@/lib/computationCache';
import MeasuringTool from './MeasuringTool';
import MeasuringOverlay from './MeasuringOverlay';

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
  'malta': '#06b6d4',        // Cyan
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

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      console.log(`Map clicked at: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      
      if (onMapClick) {
        onMapClick(lat, lng);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

// Component to calculate and display flotilla forward vessel, distance to Gaza, and ETA
function FlotillaCenter({ 
  vessels, 
  timelineData, 
  currentTimelineFrame 
}: { 
  vessels: Array<{ latitude?: number | null; longitude?: number | null; speed_knots?: number | null; name: string }>;
  timelineData?: Array<{
    timestamp: string;
    vessels: Array<{
      name: string;
      lat: number;
      lng: number;
      origin: string | null;
      course: number | null;
      speed_knots?: number | null;
      speed_kmh?: number | null;
    }>;
  }>;
  currentTimelineFrame?: number;
}) {
  const [flotillaData, setFlotillaData] = useState<{
    forwardVessel: { lat: number; lng: number; name: string } | null;
    distance: number | null;
    eta: { days: number; hours: number } | null;
    averageSpeed: number | null;
  } | null>(null);

  // Gaza port coordinates - memoized for performance
  const GAZA_PORT = useMemo(() => ({ lat: 31.522727, lng: 34.431667 }), []);

  // Haversine formula to calculate distance in nautical miles
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Function to calculate a point at a given distance along a line
  const calculatePointAtDistance = (lat1: number, lng1: number, lat2: number, lng2: number, distanceNm: number): { lat: number; lng: number } => {
    const totalDistance = calculateDistance(lat1, lng1, lat2, lng2);
    
    // If the distance is greater than the total distance, return the end point
    if (distanceNm >= totalDistance) {
      return { lat: lat2, lng: lng2 };
    }
    
    // If the distance is 0 or negative, return the start point
    if (distanceNm <= 0) {
      return { lat: lat1, lng: lng1 };
    }
    
    const ratio = distanceNm / totalDistance;
    
    const lat = lat1 + (lat2 - lat1) * ratio;
    const lng = lng1 + (lng2 - lng1) * ratio;
    
    return { lat, lng };
  };

  // Calculate flotilla forward vessel and related data
  useEffect(() => {
    // Determine which data source to use: timeline data (preferred) or vessels table (fallback)
    let validVessels: Array<{ latitude?: number | null; longitude?: number | null; speed_knots?: number | null; name: string }> = [];
    
    if (timelineData && timelineData.length > 0) {
      // Use timeline data to get latest positions
      const latestIndex = typeof currentTimelineFrame === 'number' && currentTimelineFrame >= 0 && currentTimelineFrame < timelineData.length
        ? currentTimelineFrame
        : timelineData.length - 1;

      // Build last-known position per vessel across all frames up to the chosen index
      const lastKnownByName = new Map<string, { name: string; lat: number; lng: number; origin: string | null; course: number | null; speed_knots?: number | null; speed_kmh?: number | null }>();
      for (let i = 0; i <= latestIndex; i++) {
        const frame = timelineData[i];
        if (!frame || !frame.vessels) continue;
        frame.vessels.forEach(v => {
          // Always overwrite so the latest encountered wins
          lastKnownByName.set(v.name, v);
        });
      }

      // Convert timeline data to vessels format for compatibility
      // Enrich with speed data from vessels table (same as TestPulsingAnimation.tsx)
      validVessels = Array.from(lastKnownByName.values()).map(vessel => {
        const vesselFromTable = vessels.find(v => v.name === vessel.name);
        return {
          name: vessel.name,
          latitude: vessel.lat,
          longitude: vessel.lng,
          speed_knots: vessel.speed_knots || vesselFromTable?.speed_knots || null
        };
      });
    } else {
      // Fallback to vessels table data
      validVessels = vessels.filter(vessel => 
      vessel.latitude && vessel.longitude && 
      !isNaN(parseFloat(vessel.latitude.toString())) && 
      !isNaN(parseFloat(vessel.longitude.toString()))
    );
    }

    if (validVessels.length === 0) {
      setFlotillaData(null);
      return;
    }

    // Find the most forward vessel from the main group (not outliers)
    // Use cached distance calculation
    const vesselDistances = computationCache.computeFlotillaDistances(validVessels, GAZA_PORT);

    // Sort by distance to find the main group
    vesselDistances.sort((a, b) => a.distance - b.distance);

    // Find the main group by looking for vessels within a reasonable distance of each other
    // Use the median distance as a reference point for the main group
    const medianIndex = Math.floor(vesselDistances.length / 2);
    const medianDistance = vesselDistances[medianIndex].distance;
    
    // Consider vessels within 50nm of the median as part of the main group
    const mainGroupVessels = vesselDistances.filter(vd => 
      Math.abs(vd.distance - medianDistance) <= 50
    );

    // From the main group, find the one closest to Gaza (most forward)
    const forwardVessel = mainGroupVessels[0].vessel;

    // Calculate distance to Gaza port from the forward vessel
    const distance = calculateDistance(
      parseFloat(forwardVessel.latitude!.toString()), 
      parseFloat(forwardVessel.longitude!.toString()), 
      GAZA_PORT.lat, 
      GAZA_PORT.lng
    );

    // Calculate average speed (only vessels with speed data)
    const vesselsWithSpeed = validVessels.filter(vessel => 
      vessel.speed_knots && !isNaN(parseFloat(vessel.speed_knots.toString())) && parseFloat(vessel.speed_knots.toString()) > 0
    );

    let averageSpeed: number | null = null;
    let eta: { days: number; hours: number } | null = null;

    if (vesselsWithSpeed.length > 0) {
      const totalSpeed = vesselsWithSpeed.reduce((sum, vessel) => 
        sum + parseFloat(vessel.speed_knots!.toString()), 0
      );
      averageSpeed = totalSpeed / vesselsWithSpeed.length;

      // Calculate ETA
      const timeInHours = distance / averageSpeed;
      const days = Math.floor(timeInHours / 24);
      const hours = Math.floor(timeInHours % 24);

      eta = { days, hours };
    }

    setFlotillaData({
      forwardVessel: {
        lat: parseFloat(forwardVessel.latitude!.toString()),
        lng: parseFloat(forwardVessel.longitude!.toString()),
        name: forwardVessel.name
      },
      distance,
      eta,
      averageSpeed
    });


  }, [vessels, timelineData, currentTimelineFrame, GAZA_PORT]);

  // Render the green line and distance/ETA display
  if (!flotillaData || !flotillaData.forwardVessel) {
    return null;
  }

  // Calculate distance marker positions along the line from Gaza to forward vessel
  const totalDistanceToGaza = flotillaData.distance || 0;
  
  // Only show dots if the flotilla is far enough from Gaza
  const redDotPosition = totalDistanceToGaza > 100 ? calculatePointAtDistance(
    GAZA_PORT.lat, GAZA_PORT.lng,
    flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
    100
  ) : null;
  
  const yellowDotPosition = totalDistanceToGaza > 300 ? calculatePointAtDistance(
    GAZA_PORT.lat, GAZA_PORT.lng,
    flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
    300
  ) : null;

  // Debug logging to verify calculations

  // Calculate distances from forward vessel to each dot
  const distanceToRedDot = redDotPosition ? calculateDistance(
    flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
    redDotPosition.lat, redDotPosition.lng
  ) : 0;
  
  const distanceToYellowDot = yellowDotPosition ? calculateDistance(
    flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
    yellowDotPosition.lat, yellowDotPosition.lng
  ) : 0;

  // Calculate ETAs to each dot
  const redDotETA = redDotPosition && flotillaData.averageSpeed && flotillaData.averageSpeed > 0 ? {
    hours: distanceToRedDot / flotillaData.averageSpeed,
    days: Math.floor(distanceToRedDot / flotillaData.averageSpeed / 24),
    hoursRemainder: Math.floor((distanceToRedDot / flotillaData.averageSpeed) % 24)
  } : null;

  const yellowDotETA = yellowDotPosition && flotillaData.averageSpeed && flotillaData.averageSpeed > 0 ? {
    hours: distanceToYellowDot / flotillaData.averageSpeed,
    days: Math.floor(distanceToYellowDot / flotillaData.averageSpeed / 24),
    hoursRemainder: Math.floor((distanceToYellowDot / flotillaData.averageSpeed) % 24)
  } : null;

  return (
    <>
      {/* Transparent circle with yellow dashed border centered at Gaza port */}
      <Circle
        center={[GAZA_PORT.lat, GAZA_PORT.lng]}
        radius={555600} // 300nm radius (300 * 1852 meters)
        pathOptions={{
          color: '#eab308',
          weight: 2,
          opacity: 0.6,
          fillColor: 'transparent',
          fillOpacity: 0,
          dashArray: '10, 5'
        }}
      />
      
      {/* Transparent circle with red dashed border centered at Gaza port */}
      <Circle
        center={[GAZA_PORT.lat, GAZA_PORT.lng]}
        radius={185200} // 100nm radius (100 * 1852 meters)
        pathOptions={{
          color: '#ef4444',
          weight: 2,
          opacity: 0.6,
          fillColor: 'transparent',
          fillOpacity: 0,
          dashArray: '10, 5'
        }}
      />
      
      {/* Zoom-dependent inner circles */}
      <ZoomDependentCircles gazaPort={GAZA_PORT} />
      
      {/* Green line from forward vessel to Gaza port */}
      <Polyline
        positions={[
          [flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng],
          [GAZA_PORT.lat, GAZA_PORT.lng]
        ]}
        color="#10b981"
        weight={3}
        opacity={0.8}
        dashArray="10, 5"
      />
      
      {/* Progress dots along green line - only show at zoom level 8 and above */}
      <ZoomDependentProgressDots 
        flotillaData={flotillaData}
        GAZA_PORT={GAZA_PORT}
        calculatePointAtDistance={calculatePointAtDistance}
        calculateDistance={calculateDistance}
      />
      
      {/* Red dot at 100nm from Gaza - hidden at zoom level 8 and above */}
      <ZoomDependentRedDot 
        redDotPosition={redDotPosition}
        redDotETA={redDotETA}
      />
      
      {/* Yellow dot at 300nm from Gaza */}
      {yellowDotPosition && (
        <Marker
          position={[yellowDotPosition.lat, yellowDotPosition.lng]}
        icon={L.divIcon({
          html: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background: #eab308;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
              "></div>
              <div style="
                background: rgba(0, 0, 0, 0.7);
                color: #ffffff;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 8px;
                font-weight: 600;
                text-align: center;
                white-space: nowrap;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                line-height: 1.1;
              ">
                <div>Yellow Zone</div>
                <div>300nm</div>
                ${yellowDotETA ? `<div>ETA: ${yellowDotETA.days}d ${yellowDotETA.hoursRemainder}h</div>` : '<div>ETA: N/A</div>'}
              </div>
            </div>
          `,
          className: 'distance-marker',
          iconSize: [60, 40],
          iconAnchor: [30, 20]
        })}
        />
      )}
      
    </>
  );
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
      <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="rgba(0,0,0,0.7)" rx="6" ry="6"/>
      
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
    iconAnchor: [0, totalHeight/2],
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
      <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="rgba(0,0,0,0.7)" rx="6" ry="6"/>
      
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
    iconAnchor: [0, totalHeight/2],
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

// Component to render zoom-dependent circles
function ZoomDependentCircles({ gazaPort }: { gazaPort: { lat: number; lng: number } }) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomChange = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomChange);
    return () => {
      map.off('zoomend', handleZoomChange);
    };
  }, [map]);

  // Only render circles at zoom level 8 and above
  if (currentZoom < 8) {
    return null;
  }

  return (
    <>
      {/* Inner red circle at 66.6nm radius - R2 */}
      <Circle
        center={[gazaPort.lat, gazaPort.lng]}
        radius={123343} // 66.6nm radius (66.6 * 1852 meters)
        pathOptions={{
          color: '#ef4444',
          weight: 2,
          opacity: 0.3,
          fillColor: 'transparent',
          fillOpacity: 0,
          dashArray: '10, 5'
        }}
      />
      
      {/* Inner red circle at 33.3nm radius - R1 */}
      <Circle
        center={[gazaPort.lat, gazaPort.lng]}
        radius={61672} // 33.3nm radius (33.3 * 1852 meters)
        pathOptions={{
          color: '#ef4444',
          weight: 2,
          opacity: 0.3,
          fillColor: 'transparent',
          fillOpacity: 0,
          dashArray: '10, 5'
        }}
      />
      
      {/* Yellow circle at 233.3nm radius - Y2 */}
      <Circle
        center={[gazaPort.lat, gazaPort.lng]}
        radius={432116} // 233.3nm radius (233.3 * 1852 meters)
        pathOptions={{
          color: '#eab308',
          weight: 2,
          opacity: 0.3,
          fillColor: 'transparent',
          fillOpacity: 0,
          dashArray: '10, 5'
        }}
      />
      
      {/* Yellow circle at 166.7nm radius - Y1 */}
      <Circle
        center={[gazaPort.lat, gazaPort.lng]}
        radius={308728} // 166.7nm radius (166.7 * 1852 meters)
        pathOptions={{
          color: '#eab308',
          weight: 2,
          opacity: 0.3,
          fillColor: 'transparent',
          fillOpacity: 0,
          dashArray: '10, 5'
        }}
      />
      
      {/* Circle Labels - positioned on the circle perimeters (west side) */}
      {/* Y3 Label (300nm) - on the 300nm circle perimeter */}
      <Marker
        position={[gazaPort.lat, gazaPort.lng - 5.8635]}
        icon={L.divIcon({
          html: `
            <div style="
              background: rgba(0, 0, 0, 0.7);
              color: #eab308;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              border: 1px solid #eab308;
            ">Y3</div>
          `,
          className: 'circle-label',
          iconSize: [20, 12],
          iconAnchor: [10, 6]
        })}
        interactive={false}
        zIndexOffset={100}
      />
      
      {/* Y2 Label (233.3nm) - on the 233.3nm circle perimeter */}
      <Marker
        position={[gazaPort.lat, gazaPort.lng - 4.563]}
        icon={L.divIcon({
          html: `
            <div style="
              background: rgba(0, 0, 0, 0.7);
              color: #eab308;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              border: 1px solid #eab308;
            ">Y2</div>
          `,
          className: 'circle-label',
          iconSize: [20, 12],
          iconAnchor: [10, 6]
        })}
        interactive={false}
        zIndexOffset={100}
      />
      
      {/* Y1 Label (166.7nm) - on the 166.7nm circle perimeter */}
      <Marker
        position={[gazaPort.lat, gazaPort.lng - 3.255]}
        icon={L.divIcon({
          html: `
            <div style="
              background: rgba(0, 0, 0, 0.7);
              color: #eab308;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              border: 1px solid #eab308;
            ">Y1</div>
          `,
          className: 'circle-label',
          iconSize: [20, 12],
          iconAnchor: [10, 6]
        })}
        interactive={false}
        zIndexOffset={100}
      />
      
      {/* R3 Label (100nm) - on the 100nm circle perimeter */}
      <Marker
        position={[gazaPort.lat, gazaPort.lng - 1.954]}
        icon={L.divIcon({
          html: `
            <div style="
              background: rgba(0, 0, 0, 0.7);
              color: #ef4444;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              border: 1px solid #ef4444;
            ">R3</div>
          `,
          className: 'circle-label',
          iconSize: [20, 12],
          iconAnchor: [10, 6]
        })}
        interactive={false}
        zIndexOffset={100}
      />
      
      {/* R2 Label (66.6nm) - on the 66.6nm circle perimeter */}
      <Marker
        position={[gazaPort.lat, gazaPort.lng - 1.295]}
        icon={L.divIcon({
          html: `
            <div style="
              background: rgba(0, 0, 0, 0.7);
              color: #ef4444;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              border: 1px solid #ef4444;
            ">R2</div>
          `,
          className: 'circle-label',
          iconSize: [20, 12],
          iconAnchor: [10, 6]
        })}
        interactive={false}
        zIndexOffset={100}
      />
      
      {/* R1 Label (33.3nm) - on the 33.3nm circle perimeter */}
      <Marker
        position={[gazaPort.lat, gazaPort.lng - 0.65]}
        icon={L.divIcon({
          html: `
            <div style="
              background: rgba(0, 0, 0, 0.7);
              color: #ef4444;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              border: 1px solid #ef4444;
            ">R1</div>
          `,
          className: 'circle-label',
          iconSize: [20, 12],
          iconAnchor: [10, 6]
        })}
        interactive={false}
        zIndexOffset={100}
      />
    </>
  );
}

// Component to render zoom-dependent progress dots
function ZoomDependentProgressDots({ 
  flotillaData, 
  GAZA_PORT, 
  calculatePointAtDistance, 
  calculateDistance 
}: { 
  flotillaData: {
    forwardVessel: { lat: number; lng: number; name: string } | null;
    distance: number | null;
    eta: { days: number; hours: number } | null;
    averageSpeed: number | null;
  } | null;
  GAZA_PORT: { lat: number; lng: number };
  calculatePointAtDistance: (lat1: number, lng1: number, lat2: number, lng2: number, distanceNm: number) => { lat: number; lng: number };
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomChange = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomChange);
    return () => {
      map.off('zoomend', handleZoomChange);
    };
  }, [map]);

  // Only render progress dots at zoom level 8 and above
  if (currentZoom < 8 || !flotillaData || !flotillaData.forwardVessel) {
    return null;
  }

  return (
    <>
      {/* Y2 dot (233.3nm) - only show if forward vessel is further than 233.3nm from Gaza */}
      {flotillaData.distance && flotillaData.distance > 233.3 && (() => {
        const y2Position = calculatePointAtDistance(
          GAZA_PORT.lat, GAZA_PORT.lng,
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          233.3
        );
        const distanceToY2 = calculateDistance(
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          y2Position.lat, y2Position.lng
        );
        const etaToY2 = flotillaData.averageSpeed && flotillaData.averageSpeed > 0 ? {
          hours: distanceToY2 / flotillaData.averageSpeed,
          days: Math.floor(distanceToY2 / flotillaData.averageSpeed / 24),
          hoursRemainder: Math.floor((distanceToY2 / flotillaData.averageSpeed) % 24)
        } : null;
        
        return (
          <Marker
            position={[y2Position.lat, y2Position.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 6px;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: #eab308;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                  "></div>
                  <div style="
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    line-height: 1.1;
                  ">
                    <div>Y2 (233.3nm)</div>
                    <div>Dist: ${distanceToY2.toFixed(1)}nm</div>
                    ${etaToY2 ? `<div>ETA: ${etaToY2.days}d ${etaToY2.hoursRemainder}h</div>` : '<div>ETA: N/A</div>'}
                  </div>
                </div>
              `,
              className: 'progress-dot',
              iconSize: [150, 24],
              iconAnchor: [6, 12]
            })}
            interactive={false}
            zIndexOffset={200}
          />
        );
      })()}
      
      {/* Y1 dot (166.7nm) - only show if forward vessel is further than 166.7nm from Gaza */}
      {flotillaData.distance && flotillaData.distance > 166.7 && (() => {
        const y1Position = calculatePointAtDistance(
          GAZA_PORT.lat, GAZA_PORT.lng,
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          166.7
        );
        const distanceToY1 = calculateDistance(
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          y1Position.lat, y1Position.lng
        );
        const etaToY1 = flotillaData.averageSpeed && flotillaData.averageSpeed > 0 ? {
          hours: distanceToY1 / flotillaData.averageSpeed,
          days: Math.floor(distanceToY1 / flotillaData.averageSpeed / 24),
          hoursRemainder: Math.floor((distanceToY1 / flotillaData.averageSpeed) % 24)
        } : null;
        
        return (
          <Marker
            position={[y1Position.lat, y1Position.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 6px;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: #eab308;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                  "></div>
                  <div style="
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    line-height: 1.1;
                  ">
                    <div>Y1 (166.7nm)</div>
                    <div>Dist: ${distanceToY1.toFixed(1)}nm</div>
                    ${etaToY1 ? `<div>ETA: ${etaToY1.days}d ${etaToY1.hoursRemainder}h</div>` : '<div>ETA: N/A</div>'}
                  </div>
                </div>
              `,
              className: 'progress-dot',
              iconSize: [150, 24],
              iconAnchor: [6, 12]
            })}
            interactive={false}
            zIndexOffset={200}
          />
        );
      })()}
      
      {/* R3 dot (100nm) - only show if forward vessel is further than 100nm from Gaza */}
      {flotillaData.distance && flotillaData.distance > 100 && (() => {
        const r3Position = calculatePointAtDistance(
          GAZA_PORT.lat, GAZA_PORT.lng,
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          100
        );
        const distanceToR3 = calculateDistance(
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          r3Position.lat, r3Position.lng
        );
        const etaToR3 = flotillaData.averageSpeed && flotillaData.averageSpeed > 0 ? {
          hours: distanceToR3 / flotillaData.averageSpeed,
          days: Math.floor(distanceToR3 / flotillaData.averageSpeed / 24),
          hoursRemainder: Math.floor((distanceToR3 / flotillaData.averageSpeed) % 24)
        } : null;
        
        return (
          <Marker
            position={[r3Position.lat, r3Position.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 6px;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                  "></div>
                  <div style="
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    line-height: 1.1;
                  ">
                    <div>R3 (100nm)</div>
                    <div>Dist: ${distanceToR3.toFixed(1)}nm</div>
                    ${etaToR3 ? `<div>ETA: ${etaToR3.days}d ${etaToR3.hoursRemainder}h</div>` : '<div>ETA: N/A</div>'}
                  </div>
                </div>
              `,
              className: 'progress-dot',
              iconSize: [150, 24],
              iconAnchor: [6, 12]
            })}
            interactive={false}
            zIndexOffset={200}
          />
        );
      })()}
      
      {/* R2 dot (66.6nm) - only show if forward vessel is further than 66.6nm from Gaza */}
      {flotillaData.distance && flotillaData.distance > 66.6 && (() => {
        const r2Position = calculatePointAtDistance(
          GAZA_PORT.lat, GAZA_PORT.lng,
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          66.6
        );
        const distanceToR2 = calculateDistance(
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          r2Position.lat, r2Position.lng
        );
        const etaToR2 = flotillaData.averageSpeed && flotillaData.averageSpeed > 0 ? {
          hours: distanceToR2 / flotillaData.averageSpeed,
          days: Math.floor(distanceToR2 / flotillaData.averageSpeed / 24),
          hoursRemainder: Math.floor((distanceToR2 / flotillaData.averageSpeed) % 24)
        } : null;
        
        return (
          <Marker
            position={[r2Position.lat, r2Position.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 6px;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                  "></div>
                  <div style="
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    line-height: 1.1;
                  ">
                    <div>R2 (66.6nm)</div>
                    <div>Dist: ${distanceToR2.toFixed(1)}nm</div>
                    ${etaToR2 ? `<div>ETA: ${etaToR2.days}d ${etaToR2.hoursRemainder}h</div>` : '<div>ETA: N/A</div>'}
                  </div>
                </div>
              `,
              className: 'progress-dot',
              iconSize: [150, 24],
              iconAnchor: [6, 12]
            })}
            interactive={false}
            zIndexOffset={200}
          />
        );
      })()}
      
      {/* R1 dot (33.3nm) - only show if forward vessel is further than 33.3nm from Gaza */}
      {flotillaData.distance && flotillaData.distance > 33.3 && (() => {
        const r1Position = calculatePointAtDistance(
          GAZA_PORT.lat, GAZA_PORT.lng,
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          33.3
        );
        const distanceToR1 = calculateDistance(
          flotillaData.forwardVessel.lat, flotillaData.forwardVessel.lng,
          r1Position.lat, r1Position.lng
        );
        const etaToR1 = flotillaData.averageSpeed && flotillaData.averageSpeed > 0 ? {
          hours: distanceToR1 / flotillaData.averageSpeed,
          days: Math.floor(distanceToR1 / flotillaData.averageSpeed / 24),
          hoursRemainder: Math.floor((distanceToR1 / flotillaData.averageSpeed) % 24)
        } : null;
        
        return (
          <Marker
            position={[r1Position.lat, r1Position.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 6px;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                  "></div>
                  <div style="
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    line-height: 1.1;
                  ">
                    <div>R1 (33.3nm)</div>
                    <div>Dist: ${distanceToR1.toFixed(1)}nm</div>
                    ${etaToR1 ? `<div>ETA: ${etaToR1.days}d ${etaToR1.hoursRemainder}h</div>` : '<div>ETA: N/A</div>'}
                  </div>
                </div>
              `,
              className: 'progress-dot',
              iconSize: [150, 24],
              iconAnchor: [6, 12]
            })}
            interactive={false}
            zIndexOffset={200}
          />
        );
      })()}
    </>
  );
}

// Component to render zoom-dependent red dot
function ZoomDependentRedDot({ 
  redDotPosition, 
  redDotETA 
}: { 
  redDotPosition: { lat: number; lng: number } | null;
  redDotETA: { days: number; hours: number; hoursRemainder: number } | null;
}) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomChange = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomChange);
    return () => {
      map.off('zoomend', handleZoomChange);
    };
  }, [map]);

  // Hide red dot at zoom level 8 and above
  if (currentZoom >= 8 || !redDotPosition) {
    return null;
  }

  return (
    <Marker
      position={[redDotPosition.lat, redDotPosition.lng]}
      icon={L.divIcon({
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: #ef4444;
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            "></div>
            <div style="
              background: rgba(0, 0, 0, 0.7);
              color: #ffffff;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 600;
              text-align: center;
              white-space: nowrap;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
              line-height: 1.1;
            ">
              <div>Red Zone</div>
              <div>100nm</div>
              ${redDotETA ? `<div>ETA: ${redDotETA.days}d ${redDotETA.hoursRemainder}h</div>` : '<div>ETA: N/A</div>'}
            </div>
          </div>
        `,
        className: 'distance-marker',
        iconSize: [60, 40],
        iconAnchor: [30, 20]
      })}
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
  return computationCache.computeActualVesselPathway(vesselName, timelineData, currentFrame);
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
      speed_knots?: number | null;
      speed_kmh?: number | null;
    }>;
  }>;
  currentTimelineFrame?: number;
}

export default function VesselMap({ onVesselClick, showPathways = true, vesselPositions = {}, animatedVessels, timelineData, currentTimelineFrame }: VesselMapProps) {
  const { vessels, loading: vesselsLoading, error: vesselsError } = useVessels();
  const analytics = useAnalytics();
  const { attackStatuses } = useAttackStatus();
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Measuring tool state
  const [isMeasuringEnabled, setIsMeasuringEnabled] = useState(false);
  const [measuringPoints, setMeasuringPoints] = useState<Array<{ id: string; lat: number; lng: number; distance?: number }>>([]);
  const [isCopied, setIsCopied] = useState(false);

  // Measuring tool handlers
  const handleMeasuringToggle = () => {
    setIsMeasuringEnabled(!isMeasuringEnabled);
    if (isMeasuringEnabled) {
      setMeasuringPoints([]);
    }
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isMeasuringEnabled) {
      const newPoint = {
        id: `point-${Date.now()}-${Math.random()}`,
        lat,
        lng
      };
      setMeasuringPoints(prev => [...prev, newPoint]);
    }
  }, [isMeasuringEnabled]);

  const handleRemoveMeasuringPoint = useCallback((pointId: string) => {
    setMeasuringPoints(prev => prev.filter(point => point.id !== pointId));
  }, []);

  const handleClearMeasuringPoints = useCallback(() => {
    setMeasuringPoints([]);
  }, []);
  
  // Get historical position data for selected vessel
  const { positions: selectedVesselPositions, loading: positionsLoading } = useVesselPositions(selectedVessel?.id);

  const loading = vesselsLoading;
  const error = vesselsError;

  // Function to handle vessel click - zoom to vessel and close drawer
  const handleVesselClick = (vessel: { id: number; latitude?: number; longitude?: number; name?: string; origin?: string; course?: number; status?: string; speed_knots?: number; speed_kmh?: number; timestamp_utc?: string }) => {
    if (mapRef && vessel.latitude && vessel.longitude) {
      // Track vessel click in analytics
      analytics.trackVesselClick(vessel.name || `Vessel ${vessel.id}`, vessel.id);
      
      // Track vessel info box opening
      analytics.trackVesselInfoOpen(vessel.name || `Vessel ${vessel.id}`);
      
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

  // Function to handle fullscreen toggle
  const handleFullscreenToggle = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        analytics.trackNavigationClick('fullscreen_enter');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        analytics.trackNavigationClick('fullscreen_exit');
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Function to handle social share
  const handleSocialShare = () => {
    setShowSharePopup(true);
    analytics.trackNavigationClick('social_share');
  };

  // Function to copy URL to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      analytics.trackNavigationClick('copy_url');
      
      // Force a state update
      setIsCopied(false); // Reset first
      setTimeout(() => {
        setIsCopied(true); // Then set to true
      }, 10);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Function to share on social media
  const shareOnSocial = (platform: string) => {
    const url = window.location.href;
    const text = 'Track humanitarian vessels heading to Gaza in real-time';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Sumud Nusantara - Vessel Tracker')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    analytics.trackNavigationClick(`share_${platform}`);
  };

  // Function to handle more options toggle
  const handleMoreOptions = () => {
    setShowMoreOptions(!showMoreOptions);
    analytics.trackNavigationClick('more_share_options');
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

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
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

      {/* Measuring Tool */}
      <MeasuringTool
        isEnabled={isMeasuringEnabled}
        onToggle={handleMeasuringToggle}
        points={measuringPoints}
        onClear={handleClearMeasuringPoints}
        onRemovePoint={handleRemoveMeasuringPoint}
      />

      {/* Top Right Button Group */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        {/* Fullscreen Button - Desktop Only */}
        <button
          onClick={handleFullscreenToggle}
          className="hidden lg:flex bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors items-center gap-2"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Social Share Button */}
        <button
          onClick={handleSocialShare}
          className="bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* About Button */}
        <Link 
          href="/about-sumudnusantara" 
          onClick={() => analytics.trackNavigationClick('about_sumudnusantara')}
          className="bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
        </Link>
      </div>

      {/* Development Timestamp */}
      {process.env.NODE_ENV === 'development' && latestDataTimestamp && (
        <div className="absolute top-4 right-42 z-[1000] bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700">
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
        
        {/* Map Click Handler */}
        <MapClickHandler onMapClick={handleMapClick} />
        
        {/* Map Recenter Component */}
        <MapRecenter vessels={vessels} />
        
        {/* Flotilla Center and ETA to Gaza */}
        <FlotillaCenter 
          vessels={vessels} 
          timelineData={timelineData}
          currentTimelineFrame={currentTimelineFrame}
        />
        
        {/* Vessel Pathways */}
        {showPathways && (() => {
          // If we have timeline data, use it for both markers and pathways to ensure alignment
          if (timelineData && timelineData.length > 0) {
            const latestIndex = typeof currentTimelineFrame === 'number' && currentTimelineFrame >= 0 && currentTimelineFrame < timelineData.length
              ? currentTimelineFrame
              : timelineData.length - 1;

            // Get all unique vessel names from timeline data
            const vesselNames = new Set<string>();
            for (let i = 0; i <= latestIndex; i++) {
              const frame = timelineData[i];
              if (frame && frame.vessels) {
                frame.vessels.forEach(v => vesselNames.add(v.name));
              }
            }

            return Array.from(vesselNames).map((vesselName) => {
              // Calculate actual pathway based on where the vessel has been in timeline
              const actualPathway = calculateActualVesselPathway(
                vesselName,
                timelineData,
                latestIndex
              );
              
              if (actualPathway.length === 0) return null;
              
              // Find vessel origin from timeline data or vessels table
              const timelineVessel = timelineData[latestIndex]?.vessels.find(v => v.name === vesselName);
              const vessel = vessels.find(v => v.name === vesselName);
              const origin = timelineVessel?.origin || vessel?.origin || null;
              const color = getOriginColor(origin);
              
              return (
                <Polyline
                  key={`timeline-pathway-${vesselName}`}
                  positions={actualPathway}
                  color={color}
                  weight={2}
                  opacity={0.8}
                  dashArray="5, 5"
                />
              );
            });
          } else {
            // Fallback to static pathways when no timeline data
            return Object.entries(vesselPathways).map(([vesselName, pathway]) => {
              if (pathway.length === 0) return null;
              
              const vessel = vessels.find(v => v.name === vesselName);
              const color = getOriginColor(vessel?.origin || null);
              
              return (
                <Polyline
                  key={`static-pathway-${vesselName}`}
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
        
        
        
        
        {/* Measuring Overlay */}
        <MeasuringOverlay 
          points={measuringPoints}
          onRemovePoint={handleRemoveMeasuringPoint}
        />
        
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
          // Show static view: prefer latest timeline frame if available, else fallback to vessels table
          ((() => {
            if (timelineData && timelineData.length > 0) {
              // Build last-known position per vessel across all frames up to the chosen index
              const latestIndex = typeof currentTimelineFrame === 'number' && currentTimelineFrame >= 0 && currentTimelineFrame < timelineData.length
                ? currentTimelineFrame
                : timelineData.length - 1;

              const lastKnownByName = new Map<string, { name: string; lat: number; lng: number; origin: string | null; course: number | null; speed_knots?: number | null; speed_kmh?: number | null }>();
              for (let i = 0; i <= latestIndex; i++) {
                const frame = timelineData[i];
                if (!frame || !frame.vessels) continue;
                frame.vessels.forEach(v => {
                  // Always overwrite so the latest encountered wins
                  lastKnownByName.set(v.name, v);
                });
              }

              // Enrich with speed data from vessels table
              const enrichedVessels = Array.from(lastKnownByName.values()).map(vessel => {
                const vesselFromTable = vessels.find(v => v.name === vessel.name);
                return {
                  ...vessel,
                  speed_knots: vessel.speed_knots || vesselFromTable?.speed_knots || null,
                  speed_kmh: vessel.speed_kmh || vesselFromTable?.speed_kmh || null
                };
              });

              if (enrichedVessels.length > 0) {
                return enrichedVessels.map((vessel) => {
                  const attackStatus = attackStatuses[vessel.name];
                  const vesselIcon = selectedVessel?.name === vessel.name && selectedVessel?.latitude === vessel.lat && selectedVessel?.longitude === vessel.lng
                    ? createSelectedVesselIcon(vessel.origin)
                    : createVesselIcon(vessel.origin);

                  return (
                    <React.Fragment key={`latest-known-${vessel.name}`}>
                      {/* Vessel Marker from latest timeline frame */}
                      {attackStatus ? (
                        <Marker
                          position={[vessel.lat, vessel.lng]}
                          icon={createPulsingVesselIcon(
                            attackStatus === 'attacked' ? 'red' : 'amber'
                          )}
                          zIndexOffset={1000}
                          eventHandlers={{
                            click: () => onVesselClick?.({ id: 0, name: vessel.name })
                          }}
                        >
                          <Popup>
                            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-red-500/30 rounded-lg shadow-2xl backdrop-blur-sm p-2 min-w-[200px]">
                              {/* Header */}
                              <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border-b border-red-500/30 px-2 py-1 rounded-t-lg mb-2">
                                <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                  <h3 className="text-red-400 font-mono text-xs font-bold tracking-wider uppercase">
                                    VESSEL ATTACKED
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
                                
                                {/* Attack Status */}
                                <div className="space-y-0.5">
                                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">STATUS</div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-red-300 font-mono text-xs uppercase">{attackStatus}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ) : (
                        <Marker
                          position={[vessel.lat, vessel.lng]}
                          icon={vesselIcon}
                          zIndexOffset={selectedVessel?.name === vessel.name ? 1000 : 0}
                          eventHandlers={{
                            click: () => onVesselClick?.({ id: 0, name: vessel.name })
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
                                    <div className="text-green-300 font-mono text-xs">ACTIVE</div>
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
                                  
                                  <div className="space-y-0.5">
                                    <div className="text-xs text-slate-500 font-mono">POSITION</div>
                                    <div className="text-blue-300 font-mono text-xs">
                                      {vessel.lat.toFixed(2)}, {vessel.lng.toFixed(2)}
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
                      )}

                      {/* Course Direction Triangle for Static Vessels (latest known) */}
                      {vessel.course && (
                        <CourseTriangle
                          vesselLat={vessel.lat}
                          vesselLng={vessel.lng}
                          course={vessel.course}
                          origin={vessel.origin}
                        />
                      )}
                    </React.Fragment>
                  );
                });
              }
            }

            // Fallback to vessels table positions
            return vessels.filter(vessel => vessel.latitude && vessel.longitude).map((vessel) => {
            const attackStatus = attackStatuses[vessel.name];
            const vesselIcon = selectedVessel?.id === vessel.id ? createSelectedVesselIcon(vessel.origin || null) : createVesselIcon(vessel.origin || null);
            
            
            return (
              <React.Fragment key={vessel.id}>
                {/* Vessel Marker - Use pulsing icon if vessel has attack status */}
                {attackStatus ? (
                  <>
                    <Marker
                      position={[parseFloat(vessel.latitude!.toString()), parseFloat(vessel.longitude!.toString())]}
                      icon={createPulsingVesselIcon(
                        attackStatus === 'attacked' ? 'red' : 'amber'
                      )}
                      zIndexOffset={1000}
                      eventHandlers={{
                        click: () => onVesselClick?.(vessel)
                      }}
                    >
                    <Popup>
                      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-red-500/30 rounded-lg shadow-2xl backdrop-blur-sm p-2 min-w-[200px]">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border-b border-red-500/30 px-2 py-1 rounded-t-lg mb-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            <h3 className="text-red-400 font-mono text-xs font-bold tracking-wider uppercase">
                              VESSEL ATTACKED
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
                          
                          {/* Attack Status */}
                          <div className="space-y-0.5">
                            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">STATUS</div>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-300 font-mono text-xs uppercase">{attackStatus}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Popup>
                    </Marker>
                    
                    {/* Attack Status Label */}
                    <div 
                      className="absolute z-[1001] pointer-events-none"
                      style={{
                        left: '50%',
                        bottom: '100%',
                        transform: 'translateX(-50%)',
                        backgroundColor: attackStatus === 'attacked' ? '#ef4444' : '#f59e0b',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {attackStatus}
                    </div>
                  </>
                ) : (
                  <Marker
                    position={[parseFloat(vessel.latitude!.toString()), parseFloat(vessel.longitude!.toString())]}
                    icon={vesselIcon}
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
                )}
              
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
            );
          })
          })())
        )}

        {/* Pulsing Location Markers */}
        {/* Barcelona, Spain */}
        <Marker 
          position={[41.3851, 2.1734]} 
          icon={createPulsingLocationIconWithLabel('Barcelona', 'Spain', '#3B82F6')}
          eventHandlers={{
            click: () => analytics.trackLocationMarkerClick('Barcelona')
          }}
        />

        {/* Tunis, Tunisia */}
        <Marker 
          position={[36.8065, 10.1815]} 
          icon={createPulsingLocationIconWithLabel('Tunis', 'Tunisia', '#3B82F6')}
          eventHandlers={{
            click: () => analytics.trackLocationMarkerClick('Tunis')
          }}
        />

        {/* Augusta, Sicily */}
        <Marker 
          position={[37.2056, 15.2203]} 
          icon={createPulsingLocationIconWithLabel('Augusta', 'Sicily, Italy', '#3B82F6')}
          eventHandlers={{
            click: () => analytics.trackLocationMarkerClick('Augusta')
          }}
        />

        {/* Ermoupoli, Greece */}
        <Marker 
          position={[37.4414, 24.9347]} 
          icon={createPulsingLocationIconWithLabel('Ermoupoli', 'Greece', '#3B82F6')}
          eventHandlers={{
            click: () => analytics.trackLocationMarkerClick('Ermoupoli')
          }}
        />

        {/* Gaza (Green Marker) - positioned to the right of actual location */}
        <Marker 
          position={[31.522361, 34.432526]} 
          icon={createGreenPulsingIconWithLabel('Gaza', 'Palestine')}
          eventHandlers={{
            click: () => analytics.trackLocationMarkerClick('Gaza')
          }}
        />
        
        {/* Pulsing dot at actual Gaza position */}
        <Marker
          position={[31.522361, 34.432526]}
          icon={L.divIcon({
            html: `
              <div style="
                width: 12px;
                height: 12px;
                background: #10B981;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                animation: pulse 2s infinite;
              ">
                <style>
                  @keyframes pulse {
                    0% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.2); }
                    100% { opacity: 0.8; transform: scale(1); }
                  }
                </style>
              </div>
            `,
            className: 'gaza-pulsing-dot',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
          interactive={false}
          zIndexOffset={300}
        />

        {/* Previous Interception Markers */}
        {/* Madleen - 9 Jun 2025 */}
        <Marker 
          position={[31.95236, 32.38880]} 
          icon={createRedInterceptionMarker('Madleen', '9 Jun 2025')}
          eventHandlers={{
            click: () => {
              analytics.trackInterceptionClick('Madleen');
              analytics.trackInterceptionDrawerOpen('Madleen');
              setSelectedInterception({
                name: 'Madleen',
                date: '9 Jun 2025',
                coordinates: [31.95236, 32.38880],
                details: {
                  mission: 'Freedom Flotilla Coalition 2025',
                  cargo: 'Humanitarian aid',
                  location: 'International waters off Gaza',
                  distance: 'Approximately 160 NM from Gaza',
                  outcome: 'Intercepted by Israeli forces',
                  casualties: 'No casualties reported',
                  status: 'Vessel and crew detained'
                }
              });
            }
          }}
        />
        {/* Pulsing dot at actual Madleen position */}
        <Marker
          position={[31.95236, 32.38880]}
          icon={L.divIcon({
            html: `
              <div style="
                width: 12px;
                height: 12px;
                background: #ff0000;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                animation: pulse 2s infinite;
              ">
                <style>
                  @keyframes pulse {
                    0% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.2); }
                    100% { opacity: 0.8; transform: scale(1); }
                  }
                </style>
              </div>
            `,
            className: 'gaza-pulsing-dot',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
          interactive={false}
          zIndexOffset={300}
        />

        {/* Handala - 26-27 Jul 2025 */}
        <Marker 
          position={[31.990316, 32.802406]} 
          icon={createRedInterceptionMarker('Handala', '26-27 Jul 2025')}
          eventHandlers={{
            click: () => {
              analytics.trackInterceptionClick('Handala');
              analytics.trackInterceptionDrawerOpen('Handala');
              setSelectedInterception({
                name: 'Handala',
                date: '26-27 Jul 2025',
                coordinates: [31.990316, 32.802406],
                details: {
                  mission: 'Freedom Flotilla Coalition 2025',
                  cargo: 'Humanitarian aid',
                  location: 'International waters off Gaza',
                  distance: 'Approximately 40-70 NM from Gaza',
                  outcome: 'Intercepted by Israeli forces',
                  casualties: 'No casualties reported',
                  status: 'Vessel and crew detained'
                }
              });
            }
          }}
        />
        {/* Pulsing dot at actual Handala position */}
        <Marker
          position={[31.990316, 32.802406]}
          icon={L.divIcon({
            html: `
              <div style="
                width: 12px;
                height: 12px;
                background: #ff0000;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                animation: pulse 2s infinite;
              ">
                <style>
                  @keyframes pulse {
                    0% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.2); }
                    100% { opacity: 0.8; transform: scale(1); }
                  }
                </style>
              </div>
            `,
            className: 'gaza-pulsing-dot',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
          interactive={false}
          zIndexOffset={300}
        />

        {/* Mavi Marmara - 31 May 2010 */}
        <Marker 
          position={[32.382807, 33.340217]} 
          icon={createRedInterceptionMarker('Mavi Marmara', '31 May 2010')}
          eventHandlers={{
            click: () => {
              analytics.trackInterceptionClick('Mavi Marmara');
              analytics.trackInterceptionDrawerOpen('Mavi Marmara');
              setSelectedInterception({
                name: 'Mavi Marmara',
                date: '31 May 2010',
                coordinates: [32.382807, 33.340217],
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
        {/* Pulsing dot at actual Mavi Marmara position */}
        <Marker
          position={[32.382807, 33.340217]}
          icon={L.divIcon({
            html: `
              <div style="
                width: 12px;
                height: 12px;
                background: #ff0000;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                animation: pulse 2s infinite;
              ">
                <style>
                  @keyframes pulse {
                    0% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.2); }
                    100% { opacity: 0.8; transform: scale(1); }
                  }
                </style>
              </div>
            `,
            className: 'gaza-pulsing-dot',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
          interactive={false}
          zIndexOffset={300}
        />

        {/* MV Rachel Corrie - 5 Jun 2010 (Estimated Location) */}
        <Marker 
          position={[31.6, 33.8]} 
          icon={createRedInterceptionMarker('MV Rachel Corrie', '5 Jun 2010 (Est.)')}
          eventHandlers={{
            click: () => {
              analytics.trackInterceptionClick('MV Rachel Corrie');
              analytics.trackInterceptionDrawerOpen('MV Rachel Corrie');
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
        {/* Pulsing dot at actual Madleen position */}
        <Marker
          position={[31.6, 33.8]}
          icon={L.divIcon({
            html: `
              <div style="
                width: 12px;
                height: 12px;
                background: #ff0000;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                animation: pulse 2s infinite;
              ">
                <style>
                  @keyframes pulse {
                    0% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.2); }
                    100% { opacity: 0.8; transform: scale(1); }
                  }
                </style>
              </div>
            `,
            className: 'gaza-pulsing-dot',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
          interactive={false}
          zIndexOffset={300}
        />

      </MapContainer>

      {/* Donate Button */}
      <div className="absolute bottom-[280px] left-4 z-[1000] w-[120px]">
        <a 
          href="https://donate.infakpalestin.com/order/form/sumudnusantara"
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
            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 text-center underline">Ports of Origin</h4>
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
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    Active Vessels ({vessels.length})
                  </h2>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Scale className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300">Legal Support Vessel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300">Observer Vessel</span>
                    </div>
                  </div>
                </div>
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
                                {(vessel.name === 'Johnny M' || vessel.name === 'Nusantara' || vessel.name === 'Shireen' || vessel.name === 'Summertime - Jong') && (
                                  <Eye 
                                    className="w-4 h-4 flex-shrink-0" 
                                    style={{ color: getOriginColor(vessel.origin || null) }}
                                  />
                                )}
                                {vessel.name === 'Shireen' && (
                                  <Scale 
                                    className="w-4 h-4 flex-shrink-0" 
                                    style={{ color: getOriginColor(vessel.origin || null) }}
                                  />
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

      {/* Social Share Popup */}
      {showSharePopup && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-[2004] transition-opacity duration-300"
            onClick={() => setShowSharePopup(false)}
          />
          
          {/* Popup */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2005] bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Share with
              </h3>
              <button
                onClick={() => setShowSharePopup(false)}
                className="text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300 transition-colors text-xl leading-none font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Social Media Icons Row */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* WhatsApp */}
              <button
                onClick={() => shareOnSocial('whatsapp')}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-900 dark:text-slate-100">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => shareOnSocial('telegram')}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-900 dark:text-slate-100">Telegram</span>
              </button>

              {/* Twitter */}
              <button
                onClick={() => shareOnSocial('twitter')}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-900 dark:text-slate-100">Twitter</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => shareOnSocial('facebook')}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-900 dark:text-slate-100">Facebook</span>
              </button>

              {/* More Options */}
              <button
                onClick={handleMoreOptions}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-900 dark:text-slate-100">More</span>
              </button>
            </div>

            {/* More Options Panel */}
            {showMoreOptions && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-center gap-4">
                  {/* LinkedIn */}
                  <button
                    onClick={() => shareOnSocial('linkedin')}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-slate-900 dark:text-slate-100">LinkedIn</span>
                  </button>

                  {/* Email */}
                  <button
                    onClick={() => shareOnSocial('email')}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-slate-900 dark:text-slate-100">Email</span>
                  </button>

                  {/* Reddit */}
                  <button
                    onClick={() => shareOnSocial('reddit')}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-slate-900 dark:text-slate-100">Reddit</span>
                  </button>

                  {/* Pinterest */}
                  <button
                    onClick={() => shareOnSocial('pinterest')}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-slate-900 dark:text-slate-100">Pinterest</span>
                  </button>
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or share with link</span>
              </div>
            </div>
            
            {/* Link Copy Section */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 border-none outline-none truncate"
              />
              <button
                onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.href : '')}
                className={`p-2 transition-colors ${isCopied ? 'text-green-500' : 'text-orange-500 hover:text-orange-600'}`}
              >
                {isCopied ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}

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
                  onClick={() => {
                    analytics.trackInterceptionDrawerClose(selectedInterception?.name || 'unknown');
                    setSelectedInterception(null);
                  }}
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

