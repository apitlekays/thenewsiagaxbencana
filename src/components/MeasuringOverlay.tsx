"use client";

import { Marker, Polyline, Popup } from 'react-leaflet';
import { MeasuringPoint, calculateDistance, createNumberedMeasuringPointIcon } from './MeasuringTool';
import L from 'leaflet';

interface MeasuringOverlayProps {
  points: MeasuringPoint[];
  onRemovePoint: (pointId: string) => void;
}

// Function to create distance label icon
function createDistanceLabelIcon(distance: number, size: number = 8): L.Icon {
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="#ffffff" stroke="#3b82f6" stroke-width="1"/>
        <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" fill="#3b82f6" font-size="6" font-weight="bold" font-family="Arial, sans-serif">${distance.toFixed(1)}</text>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

export default function MeasuringOverlay({ points, onRemovePoint }: MeasuringOverlayProps) {
  if (points.length === 0) return null;

  // Create line segments between consecutive points
  const lineSegments: Array<{
    id: string;
    positions: [number, number][];
    distance: number;
    midpoint: [number, number];
  }> = [];

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const distance = calculateDistance(current.lat, current.lng, next.lat, next.lng);
    
    // Calculate midpoint for distance label
    const midpoint: [number, number] = [
      (current.lat + next.lat) / 2,
      (current.lng + next.lng) / 2
    ];

    lineSegments.push({
      id: `segment-${i}`,
      positions: [[current.lat, current.lng], [next.lat, next.lng]],
      distance,
      midpoint
    });
  }

  return (
    <>
      {/* Measuring Points */}
      {points.map((point, index) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={createNumberedMeasuringPointIcon(index + 1)}
          eventHandlers={{
            click: () => onRemovePoint(point.id)
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
                Point {index + 1}
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Latitude: {point.lat.toFixed(6)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Longitude: {point.lng.toFixed(6)}
                  </span>
                </div>
                
                {point.distance && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      Distance from previous: {point.distance.toFixed(2)} nm
                    </span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => onRemovePoint(point.id)}
                    className="w-full px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs font-medium transition-colors"
                  >
                    Remove Point
                  </button>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Line Segments */}
      {lineSegments.map((segment) => (
        <Polyline
          key={segment.id}
          positions={segment.positions}
          color="#ffffff"
          weight={3}
          opacity={0.8}
          dashArray="8, 8"
        />
      ))}

      {/* Distance Labels */}
      {lineSegments.map((segment) => (
        <Marker
          key={`label-${segment.id}`}
          position={segment.midpoint}
          icon={createDistanceLabelIcon(segment.distance)}
        >
          <Popup>
            <div className="p-2">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Segment Distance
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {segment.distance.toFixed(2)} nm
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
