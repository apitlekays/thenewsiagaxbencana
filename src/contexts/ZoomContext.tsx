"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

interface ZoomContextType {
  currentZoom: number;
  isHighZoom: boolean; // zoom >= 8
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

export function ZoomProvider({ children }: { children: React.ReactNode }) {
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

  const isHighZoom = currentZoom >= 8;

  return (
    <ZoomContext.Provider value={{ currentZoom, isHighZoom }}>
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (context === undefined) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
}
