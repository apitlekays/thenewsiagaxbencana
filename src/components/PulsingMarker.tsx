"use client";

import { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface PulsingMarkerProps {
  position: [number, number];
  color: string;
  status: string;
  vesselName: string;
  icon: L.Icon;
}

export default function PulsingMarker({ position, color, icon }: PulsingMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      
      // Wait a bit for the marker to be fully rendered
      setTimeout(() => {
        const element = marker.getElement();
        
        if (element) {
          // Remove any existing pulse classes
          element.classList.remove('pulse-green', 'pulse-red', 'pulse-amber');
          // Add the pulse class
          element.classList.add(`pulse-${color}`);
          
          // Also try to apply to the icon element inside
          const iconElement = element.querySelector('.leaflet-marker-icon');
          if (iconElement) {
            iconElement.classList.remove('pulse-green', 'pulse-red', 'pulse-amber');
            iconElement.classList.add(`pulse-${color}`);
          }
          
          // Force style application
          element.style.animation = `pulse-${color} 1.5s infinite`;
          element.style.borderRadius = '50%';
        }
      }, 100);
    }
  }, [color]);

  return (
    <>
      <Marker
        ref={markerRef}
        position={position}
        icon={icon}
        zIndexOffset={1000}
      />
    </>
  );
}
