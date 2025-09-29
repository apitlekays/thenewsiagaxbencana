"use client";

import { useEffect, useState } from 'react';
import { useVessels } from '@/hooks/queries/useVessels';
import { useAnimationService } from '@/hooks/useAnimationService';
import { computationCache } from '@/lib/computationCache';

// Gaza port coordinates - match VesselMap.tsx
const GAZA_PORT = { lat: 31.522727, lng: 34.431667 };

export default function TestPulsingAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const { vessels } = useVessels();
  const { timelineData } = useAnimationService();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

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

  // Apply the same outlier filtering logic as FlotillaCenter
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
