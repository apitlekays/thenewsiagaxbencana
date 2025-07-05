'use client';

import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

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

  const zoomToLocation = (lat: number, lng: number, zoom: number = 12) => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom,
        duration: 2500
      });
    }
  };

  const resetToDefault = () => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.flyTo({
        center: MALAYSIA_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 2500
      });
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
      hideIncidentDetails 
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