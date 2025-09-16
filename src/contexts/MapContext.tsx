'use client';

import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap } from 'maplibre-gl';

export interface Alert {
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

export interface Vessel {
  id: number;
  status: string;
  user_created: string;
  date_created: string;
  user_updated: string;
  date_updated: string;
  name: string;
  mmsi: string;
  start_date: string;
  positions: Array<{
    latitude: number;
    longitude: number;
    timestamp_utc: string;
    course?: number | null;
    speed_kmh?: number | null;
    speed_knots?: number | null;
  }>;
  datalastic_positions: string | null;
  marinetraffic_positions: string | null;
  positions_sources: string[];
  update_sources: string[];
  marinetraffic_shipid: string | null;
  latitude: string;
  longitude: string;
  timestamp: string;
  image: string | null;
  vessel_status: string;
  icao: string | null;
  aircraft_registration: string | null;
  devices: number[];
  origin?: string; // Port of origin from GSF API
  firstDataTime?: Date; // Optional property for preparation vessels
  isSpawning?: boolean; // Flag to trigger spawn animation
  // New GSF API fields
  speed_kmh?: number | null; // Current speed in km/h
  speed_knots?: number | null; // Current speed in knots
  course?: number | null; // Current heading/bearing
  type?: string | null; // Vessel type
  image_url?: string | null; // Vessel image URL
}

interface MapContextType {
  mapRef: React.MutableRefObject<MapRef | null>;
  mapLoaded: boolean;
  setMapLoaded: (loaded: boolean) => void;
  zoomToLocation: (lat: number, lng: number, zoom?: number) => void;
  resetToDefault: () => void;
  currentAlert: Alert | null;
  isIncidentPanelVisible: boolean;
  showIncidentDetails: (alert: Alert) => void;
  hideIncidentDetails: () => void;
  // Vessel tracking properties
  currentVessel: Vessel | null;
  isVesselPanelVisible: boolean;
  showVesselDetails: (vessel: Vessel) => void;
  hideVesselDetails: () => void;
  // Timeline properties
  currentTime: Date | null;
  setCurrentTime: (time: Date | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

// Default Malaysia center and zoom (adjusted for alert panel width)
const MALAYSIA_CENTER: [number, number] = [103.5, 4.5]; // [lng, lat]
const DEFAULT_ZOOM = 6;

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [isIncidentPanelVisible, setIsIncidentPanelVisible] = useState(false);
  const [currentVessel, setCurrentVessel] = useState<Vessel | null>(null);
  const [isVesselPanelVisible, setIsVesselPanelVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const zoomToLocation = (lat: number, lng: number, zoom: number = 12) => {
    if (mapRef.current && mapLoaded) {
      const raw = typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current;
      const map = raw as unknown as MaplibreMap;
      if (!map) return;

      // Cancel any ongoing animations to avoid chaining wiggle
      if (typeof map.stop === 'function') {
        map.stop();
      }

      // Preserve current bearing and pitch for smoothness
      const bearing = typeof map.getBearing === 'function' ? map.getBearing() : 0;
      const pitch = typeof map.getPitch === 'function' ? map.getPitch() : 0;

      // Skip animation if we're already close to target
      const currentCenter = typeof map.getCenter === 'function' ? map.getCenter() : { lng: 0, lat: 0 };
      const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : 0;
      const dist = Math.hypot((currentCenter.lng ?? 0) - lng, (currentCenter.lat ?? 0) - lat);
      const zoomDiff = Math.abs((currentZoom ?? 0) - zoom);
      if (dist < 0.0005 && zoomDiff < 0.05) return;

      // Use easeTo for smoother animation with shorter duration
      if (typeof map.easeTo === 'function') {
        map.easeTo({
          center: [lng, lat],
          zoom,
          bearing,
          pitch,
          duration: 800,
          essential: true,
        });
      } else if (typeof map.flyTo === 'function') {
        map.flyTo({ center: [lng, lat], zoom, duration: 800 });
      }
    }
  };

  const resetToDefault = () => {
    if (mapRef.current && mapLoaded) {
      const raw = typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current;
      const map = raw as unknown as MaplibreMap;
      if (!map) return;

      if (typeof map.stop === 'function') {
        map.stop();
      }

      const bearing = typeof map.getBearing === 'function' ? map.getBearing() : 0;
      const pitch = typeof map.getPitch === 'function' ? map.getPitch() : 0;

      const currentCenter = typeof map.getCenter === 'function' ? map.getCenter() : { lng: 0, lat: 0 };
      const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : 0;
      const dist = Math.hypot((currentCenter.lng ?? 0) - MALAYSIA_CENTER[0], (currentCenter.lat ?? 0) - MALAYSIA_CENTER[1]);
      const zoomDiff = Math.abs((currentZoom ?? 0) - DEFAULT_ZOOM);
      if (dist < 0.0005 && zoomDiff < 0.05) return;

      if (typeof map.easeTo === 'function') {
        map.easeTo({
          center: MALAYSIA_CENTER,
          zoom: DEFAULT_ZOOM,
          bearing,
          pitch,
          duration: 800,
          essential: true,
        });
      } else if (typeof map.flyTo === 'function') {
        map.flyTo({ center: MALAYSIA_CENTER, zoom: DEFAULT_ZOOM, duration: 800 });
      }
    }
  };

  const showIncidentDetails = (alert: Alert) => {
    setCurrentAlert(alert);
    setIsIncidentPanelVisible(true);
    
    // Dispatch marker selection event with original station_id
    // Use the original station_id from the alert object, not the sanitized one
    window.dispatchEvent(new CustomEvent('marker-select', {
      detail: { stationId: alert.station_id }
    }));
  };

  const hideIncidentDetails = () => {
    setIsIncidentPanelVisible(false);
    setCurrentAlert(null);
    
    // Dispatch marker deselection event
    window.dispatchEvent(new CustomEvent('marker-deselect'));
    
    resetToDefault();
  };

  const showVesselDetails = (vessel: Vessel) => {
    setCurrentVessel(vessel);
    setIsVesselPanelVisible(true);
    
    // Dispatch vessel selection event
    window.dispatchEvent(new CustomEvent('vessel-select', {
      detail: { vesselId: vessel.id }
    }));
  };

  const hideVesselDetails = () => {
    setIsVesselPanelVisible(false);
    setCurrentVessel(null);
    
    // Dispatch vessel deselection event
    window.dispatchEvent(new CustomEvent('vessel-deselect'));
  };

  return (
    <MapContext.Provider value={{ 
      mapRef, 
      mapLoaded,
      setMapLoaded,
      zoomToLocation, 
      resetToDefault,
      currentAlert, 
      isIncidentPanelVisible, 
      showIncidentDetails, 
      hideIncidentDetails,
      currentVessel,
      isVesselPanelVisible,
      showVesselDetails,
      hideVesselDetails,
      currentTime,
      setCurrentTime
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
} 