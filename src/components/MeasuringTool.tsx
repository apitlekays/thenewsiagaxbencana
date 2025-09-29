"use client";

import { useState, useEffect } from 'react';
import { Ruler, X, RotateCcw } from 'lucide-react';
import L from 'leaflet';

export interface MeasuringPoint {
  id: string;
  lat: number;
  lng: number;
  distance?: number; // Distance from previous point
}

interface MeasuringToolProps {
  isEnabled: boolean;
  onToggle: () => void;
  points: MeasuringPoint[];
  onClear: () => void;
  onRemovePoint: (pointId: string) => void;
}

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function to create measuring point icon
function createMeasuringPointIcon(size: number = 12): L.Icon {
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="#ffffff" stroke="#3b82f6" stroke-width="2"/>
        <circle cx="${size/2}" cy="${size/2}" r="2" fill="#3b82f6"/>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

// Function to create measuring point icon with number
function createNumberedMeasuringPointIcon(number: number, size: number = 16): L.Icon {
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
        <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="Arial, sans-serif">${number}</text>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

export default function MeasuringTool({ 
  isEnabled, 
  onToggle, 
  points, 
  onClear, 
  onRemovePoint 
}: MeasuringToolProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);

  // Calculate total distance when points change
  useEffect(() => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      total += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }
    setTotalDistance(total);
  }, [points]);

  // Show/hide tool panel when enabled
  useEffect(() => {
    if (isEnabled) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isEnabled]);

  const handleClear = () => {
    onClear();
    setTotalDistance(0);
  };

  return (
    <>
      {/* Toggle Button - All Screen Sizes */}
      <div className="absolute top-4 right-42 z-[1001]">
        <button
          onClick={onToggle}
          className={`p-2.5 rounded-lg shadow-lg border transition-all duration-200 ${
            isEnabled 
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
              : 'bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title={isEnabled ? "Disable measuring tool" : "Enable measuring tool"}
        >
          <Ruler className="w-5 h-5" />
        </button>
      </div>

      {/* Measuring Tool Panel */}
      {isVisible && isEnabled && (
        <div className="absolute top-16 right-4 z-[1001] bg-white/95 dark:bg-slate-800/95 rounded-lg p-4 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Measuring Tool
            </h3>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Close measuring tool"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            Click on the map to add measuring points. Click on a point to remove it.
          </div>

          {/* Points List */}
          {points.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Points ({points.length}):
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {points.map((point, index) => (
                  <div 
                    key={point.id} 
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemovePoint(point.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                      title="Remove point"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distance Information */}
          {points.length > 1 && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                Total Distance:
              </div>
              <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                {totalDistance.toFixed(2)} nm
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                ({points.length - 1} segments)
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={points.length === 0}
              className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear All
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Export the utility functions for use in other components
export { calculateDistance, createMeasuringPointIcon, createNumberedMeasuringPointIcon };
