"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ArrowLeft, Ship, Clock, Navigation } from 'lucide-react';
import Link from 'next/link';
import { useVessels } from '@/hooks/useVessels';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom vessel icon
const vesselIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.5" cy="12.5" r="10" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
      <path d="M8 12.5L12.5 8L17 12.5L12.5 17L8 12.5Z" fill="#ffffff"/>
    </svg>
  `),
  iconSize: [25, 25],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export default function VesselTrackerMap() {
  const { vessels, loading, error } = useVessels();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-lg text-red-400">Error loading vessel data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-[1000] bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
      </Link>

      {/* Vessel Count Display */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {vessels.length} Active Vessels
          </span>
        </div>
      </div>
      
      <MapContainer
        center={[35.0, 20.0]} // Center of Mediterranean Sea
        zoom={5}
        minZoom={5}
        maxZoom={10}
        style={{ height: '100vh', width: '100%' }}
        className="z-0"
        zoomControl={false}
        attributionControl={false}
        maxBounds={[
          [25.0, -10.0], // Southwest corner (Libya)
          [50.0, 50.0]  // Northeast corner (Ukraine)
        ]}
        maxBoundsOptions={{
          padding: [20, 20]
        }}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/styles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          subdomains="abc"
          maxZoom={20}
        />
        
        {/* Vessel Markers */}
        {vessels.map((vessel) => (
          <Marker
            key={vessel.id}
            position={[parseFloat(vessel.latitude.toString()), parseFloat(vessel.longitude.toString())]}
            icon={vesselIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
                  {vessel.name}
                </h3>
                
                <div className="space-y-2 text-sm">
                  {vessel.mmsi && (
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">MMSI: {vessel.mmsi}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {new Date(vessel.timestamp_utc).toLocaleString()}
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
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
