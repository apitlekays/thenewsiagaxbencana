"use client";

import { useEffect, useState, useMemo } from 'react';
import { useVessels } from '@/hooks/queries/useVessels';
import { useAnimationService } from '@/hooks/useAnimationService';
import { computationCache } from '@/lib/computationCache';

// Gaza port coordinates - match VesselMap.tsx
const GAZA_PORT = { lat: 31.522727, lng: 34.431667 };

export default function TestPulsingAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const { vessels } = useVessels();
  const { timelineData } = useAnimationService();

  // Memoize vessel processing and calculations
  const estimationData = useMemo(() => {
    // Use the same logic as FlotillaCenter to determine data source and forward vessel
    let validVessels: Array<{ latitude?: number | null; longitude?: number | null; speed_knots?: number | null; name: string }> = [];
    
    if (timelineData && timelineData.length > 0) {
      // Use timeline data to get latest positions (same as FlotillaCenter)
      const latestIndex = timelineData.length - 1;

      // Build last-known position per vessel across all frames up to the latest index
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
      // Enrich with speed data from vessels table (same as VesselMap.tsx)
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
      // Fallback to vessels table data (same as FlotillaCenter)
      validVessels = vessels.filter(vessel => 
        vessel.latitude && vessel.longitude && 
        !isNaN(parseFloat(vessel.latitude.toString())) && 
        !isNaN(parseFloat(vessel.longitude.toString()))
      );
    }

    if (validVessels.length === 0) {
      return null;
    }

    // Apply the same outlier filtering logic as FlotillaCenter
    const vesselDistances = computationCache.computeFlotillaDistances(validVessels, GAZA_PORT);

    // Haversine distance calculation (same as FlotillaCenter)
    const calculateDistanceBetweenVessels = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 3440.065; // Earth's radius in nautical miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Find the largest cluster based on geographic proximity between vessels
    const CLUSTER_THRESHOLD = 30; // 30nm - vessels within this distance are in same cluster
    const clustered = new Set<number>();
    const clusters: Array<typeof vesselDistances> = [];

    for (let i = 0; i < vesselDistances.length; i++) {
      if (clustered.has(i)) continue;
      
      const cluster: typeof vesselDistances = [vesselDistances[i]];
      clustered.add(i);
      
      // Find all vessels within CLUSTER_THRESHOLD of any vessel in current cluster
      for (let j = 0; j < vesselDistances.length; j++) {
        if (clustered.has(j)) continue;
        
        const vessel1 = vesselDistances[i].vessel;
        const vessel2 = vesselDistances[j].vessel;
        
        // Calculate distance between the two vessels
        const vesselToVesselDistance = calculateDistanceBetweenVessels(
          parseFloat(vessel1.latitude!.toString()),
          parseFloat(vessel1.longitude!.toString()),
          parseFloat(vessel2.latitude!.toString()),
          parseFloat(vessel2.longitude!.toString())
        );
        
        if (vesselToVesselDistance <= CLUSTER_THRESHOLD) {
          cluster.push(vesselDistances[j]);
          clustered.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    // Find the largest cluster (main group)
    const mainGroupVessels = clusters.reduce((largest, current) => 
      current.length > largest.length ? current : largest
    , clusters[0]);

    // Sort main group by distance to Gaza to find forward-most vessel
    mainGroupVessels.sort((a, b) => a.distance - b.distance);

    // From the main group, find the forward-most vessel (leading vessel, closest to Gaza)
    const forwardVessel = mainGroupVessels[0]?.vessel || null;
    const distance = forwardVessel ? mainGroupVessels[0].distance : null;

    // Calculate average speed from main group vessels only
    const mainGroupVesselsWithSpeed = mainGroupVessels.filter(vd => {
      const vessel = vd.vessel as { speed_knots?: number | null };
      return vessel.speed_knots && !isNaN(parseFloat(vessel.speed_knots.toString())) && parseFloat(vessel.speed_knots.toString()) > 0;
    });

    const averageSpeed = mainGroupVesselsWithSpeed.length > 0 
      ? mainGroupVesselsWithSpeed.reduce((sum, item) => {
          const vessel = item.vessel as { speed_knots?: number | null };
          const speed = vessel.speed_knots;
          return sum + (parseFloat(speed?.toString() || '0'));
        }, 0) / mainGroupVesselsWithSpeed.length
      : 0;
    
    // Calculate ETA
    let eta: { days: number; hours: number } | null = null;
    if (distance && averageSpeed > 0) {
      const hours = distance / averageSpeed;
      const days = Math.floor(hours / 24);
      const hoursRemainder = Math.floor(hours % 24);
      eta = { days, hours: hoursRemainder };
    }

    return {
      distance,
      eta,
      averageSpeed
    };
  }, [vessels, timelineData]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  if (!estimationData) {
    return (
      <div className="absolute top-20 left-4 z-[1000] space-y-3">
        {/* Vessel Status Box */}
        <div className="bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-[120px]">
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Vessel Status
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-3 h-3 bg-red-500 rounded-full pulse-red"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Attacked</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="w-3 h-3 bg-amber-500 rounded-full pulse-amber"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Emergency</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estimation Infobox - No Data */}
        <div className="bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-[140px]">
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Dynamic Estimation
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Flotilla → Gaza
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Distance</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">N/A</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">ETA</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">N/A</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Ave. Speed</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">N/A</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from memoized calculations
  const { distance, eta, averageSpeed } = estimationData;

  return (
    <div className="absolute top-20 left-4 z-[1000] space-y-3">
      {/* Vessel Status Box */}
      <div className="bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-[120px]">
        <div className="space-y-2">
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Vessel Status
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="w-3 h-3 bg-red-500 rounded-full pulse-red"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Attacked</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="w-3 h-3 bg-amber-500 rounded-full pulse-amber"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Emergency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estimation Infobox */}
      <div className="bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-[140px]">
        <div className="space-y-2">
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Dynamic Estimation
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Flotilla → Gaza
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">Distance</span>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {distance ? `${distance.toFixed(1)} nm` : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">ETA</span>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {eta ? `${eta.days}d ${eta.hours}h` : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">Ave. Speed</span>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {averageSpeed > 0 ? `${averageSpeed.toFixed(1)} kts` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
