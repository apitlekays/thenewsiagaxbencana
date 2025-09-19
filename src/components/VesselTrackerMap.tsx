"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { ArrowLeft, Ship, Clock, Navigation, RefreshCw, Route } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useVessels } from '@/hooks/queries/useVessels';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
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

// Special icon for Spectre (blue with pathway)
const spectreIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="12" fill="#3b82f6" stroke="#ffffff" stroke-width="3"/>
      <path d="M10 15L15 10L20 15L15 20L10 15Z" fill="#ffffff"/>
      <circle cx="15" cy="15" r="3" fill="#ffffff" opacity="0.8"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Special icon for Adara (purple with pathway)
const adaraIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="12" fill="#8b5cf6" stroke="#ffffff" stroke-width="3"/>
      <path d="M10 15L15 10L20 15L15 20L10 15Z" fill="#ffffff"/>
      <circle cx="15" cy="15" r="3" fill="#ffffff" opacity="0.8"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom hook to fetch all vessel positions grouped by vessel
function useAllVesselPositions() {
  const [vesselPositions, setVesselPositions] = useState<Record<string, Array<{
    id: number;
    vessel_id: number;
    gsf_vessel_id: number;
    latitude: number;
    longitude: number;
    speed_kmh: number | null;
    speed_knots: number | null;
    course: number | null;
    timestamp_utc: string;
    created_at: string;
  }>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllVesselPositions() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching all vessel positions...');

        // Fetch ALL positions for all vessels (bypass Supabase's default 1000 limit)
        const { data: allPositions, error: positionsError } = await supabase
          .from('vessel_positions')
          .select('*')
          .order('timestamp_utc', { ascending: true })
          .limit(100000); // High limit to get all positions

        if (positionsError) {
          throw new Error(`Failed to fetch positions: ${positionsError.message || 'Unknown error'}`);
        }

        // Fetch all vessels to get the mapping
        const { data: allVessels, error: vesselsError } = await supabase
          .from('vessels')
          .select('id, gsf_id, name')
          .eq('status', 'active');

        if (vesselsError) {
          throw new Error(`Failed to fetch vessels: ${vesselsError.message || 'Unknown error'}`);
        }

        // Create a mapping from gsf_id to vessel name
        const vesselMapping: Record<number, string> = {};
        allVessels?.forEach(vessel => {
          vesselMapping[vessel.gsf_id] = vessel.name;
        });

        // Group positions by vessel name
        const groupedPositions: Record<string, Array<{
          id: number;
          vessel_id: number;
          gsf_vessel_id: number;
          latitude: number;
          longitude: number;
          speed_kmh: number | null;
          speed_knots: number | null;
          course: number | null;
          timestamp_utc: string;
          created_at: string;
        }>> = {};
        
        allPositions?.forEach(position => {
          const vesselName = vesselMapping[position.gsf_vessel_id];
          if (vesselName) {
            if (!groupedPositions[vesselName]) {
              groupedPositions[vesselName] = [];
            }
            groupedPositions[vesselName].push(position);
          }
        });

        console.log(`📍 Fetched ${allPositions?.length || 0} total positions for ${Object.keys(groupedPositions).length} vessels`);
        console.log(`🔍 Vessel mapping created for ${Object.keys(vesselMapping).length} vessels`);
        console.log('📊 Positions per vessel:', Object.entries(groupedPositions).map(([name, positions]) => `${name}: ${positions.length}`));
        console.log('🔍 Vessel mapping sample:', Object.entries(vesselMapping).slice(0, 5));
        
        setVesselPositions(groupedPositions);
      } catch (err) {
        console.error('Error fetching all vessel positions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAllVesselPositions();
  }, []);

  return { vesselPositions, loading, error };
}

// Helper function to get vessel icon
function getVesselIcon(vesselName: string) {
  switch (vesselName) {
    case 'Spectre':
      return spectreIcon;
    case 'Adara':
      return adaraIcon;
    default:
      return vesselIcon;
  }
}

export default function VesselTrackerMap() {
  const { vessels, loading: vesselsLoading, error: vesselsError } = useVessels();
  const { vesselPositions, loading: positionsLoading, error: positionsError } = useAllVesselPositions();
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const loading = vesselsLoading || positionsLoading;
  const error = vesselsError || (positionsError ? new Error(positionsError) : null);

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setLastFetchTime(new Date());
    // Refresh vessels data
    window.location.reload();
  };

  // Process all vessel positions into pathway coordinates
  const vesselPathways = Object.entries(vesselPositions).reduce((acc, [vesselName, positions]) => {
    const validPositions = positions.filter(position => {
      const lat = parseFloat(position.latitude.toString());
      const lng = parseFloat(position.longitude.toString());
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });

    acc[vesselName] = validPositions.map(position => [
      parseFloat(position.latitude.toString()),
      parseFloat(position.longitude.toString())
    ] as [number, number]);

    return acc;
  }, {} as Record<string, [number, number][]>);

  // Debug logging for all vessels
  console.log('🔍 All Vessels Debug:', {
    totalVessels: Object.keys(vesselPositions).length,
    vesselPathways: Object.entries(vesselPathways).map(([name, pathway]) => ({
      name,
      positions: vesselPositions[name]?.length || 0,
      pathwayLength: pathway.length
    })),
    loading: positionsLoading,
    error: positionsError
  });


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
          <p className="text-lg text-red-400">Error loading vessel data: {error.message}</p>
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
          <button
            onClick={handleRefresh}
            className="ml-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        {lastFetchTime && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Last refreshed: {lastFetchTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Maintenance Alert */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              System Under Maintenance
            </h3>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Vessel tracking data is being updated. Some features may be temporarily unavailable.
            </p>
          </div>
        </div>
      </div>
      
      <MapContainer
        center={[35.0, 20.0]} // Center of Mediterranean Sea
        zoom={6}
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
        boundsOptions={{
          padding: [20, 20]
        }}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/styles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          subdomains="abc"
          maxZoom={20}
        />
        
        {/* All Vessel Pathways */}
        {Object.entries(vesselPathways).map(([vesselName, pathway]) => {
          if (pathway.length === 0) return null;
          
          console.log(`🎨 Rendering pathway for ${vesselName} with ${pathway.length} points`);
          
          // Generate distinct colors for each vessel
          const colors = [
            '#3b82f6', // Blue
            '#8b5cf6', // Purple  
            '#10b981', // Green
            '#f59e0b', // Orange
            '#ef4444', // Red
            '#06b6d4', // Cyan
            '#84cc16', // Lime
            '#f97316', // Orange-red
            '#8b5a2b', // Brown
            '#6366f1', // Indigo
            '#ec4899', // Pink
            '#14b8a6', // Teal
            '#f43f5e', // Rose
            '#a855f7', // Violet
            '#22c55e', // Emerald
          ];
          
          const vesselIndex = Object.keys(vesselPathways).indexOf(vesselName);
          const color = vesselName === 'Spectre' ? '#3b82f6' : 
                       vesselName === 'Adara' ? '#8b5cf6' : 
                       colors[vesselIndex % colors.length];
          
          const dashArray = vesselName === 'Spectre' ? '10, 5' : 
                           vesselName === 'Adara' ? '5, 10' : 
                           `${5 + (vesselIndex % 3) * 5}, ${5 + (vesselIndex % 2) * 5}`;
          
          return (
            <Polyline
              key={vesselName}
              positions={pathway}
              color={color}
              weight={3}
              opacity={0.8}
              dashArray={dashArray}
            />
          );
        })}
        
        {/* Vessel Markers */}
        {vessels.filter(vessel => vessel.latitude && vessel.longitude).map((vessel) => (
          <Marker
            key={vessel.id}
            position={[parseFloat(vessel.latitude!.toString()), parseFloat(vessel.longitude!.toString())]}
            icon={getVesselIcon(vessel.name)}
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
                      {vessel.timestamp_utc ? new Date(vessel.timestamp_utc).toLocaleString() : 'No timestamp'}
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
                        From {new Date(vesselPositions[vessel.name][0]?.timestamp_utc).toLocaleDateString()} 
                        to {new Date(vesselPositions[vessel.name][vesselPositions[vessel.name].length - 1]?.timestamp_utc).toLocaleDateString()}
                      </div>
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
