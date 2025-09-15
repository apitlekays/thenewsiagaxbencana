'use client';

import { useState, useEffect } from 'react';
import { FaShip, FaTimes, FaMapMarkerAlt, FaClock, FaFlag } from 'react-icons/fa';
import { Vessel } from '@/contexts/MapContext';
import { 
  getVesselStatusDisplay 
} from '@/utils/vesselStatus';
import { getVesselOrigin, getVesselMarkerColorClass } from '@/utils/vesselOrigin';
import { VesselStatus } from '@/types/vessel';

interface VesselListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vessels: Vessel[];
  onVesselSelect: (vessel: Vessel) => void;
  currentTime: Date;
}

export default function VesselListDrawer({ 
  isOpen, 
  onClose, 
  vessels, 
  onVesselSelect, 
  currentTime 
}: VesselListDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsExpanded(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(false);
    }
  }, [isOpen]);

  const getVesselStatus = (vessel: Vessel) => {
    // Use the vessel's current status from the dynamic status system
    const status = vessel.vessel_status || 'sailing';
    
    // Get color based on status
    let color = 'bg-blue-600'; // default sailing color
    switch (status) {
      case 'repairing':
        color = 'bg-yellow-600';
        break;
      case 'attacked':
        color = 'bg-red-600';
        break;
      case 'emergency':
        color = 'bg-orange-600';
        break;
      case 'disabled':
        color = 'bg-gray-600';
        break;
      case 'preparing':
        color = 'bg-gray-500';
        break;
      case 'completed':
        color = 'bg-green-600';
        break;
      case 'sailing':
      default:
        color = 'bg-blue-600';
        break;
    }
    
    return { 
      status, 
      color, 
      text: getVesselStatusDisplay(status as VesselStatus)
    };
  };

  const getCurrentPosition = (vessel: Vessel) => {
    if (!vessel.positions || vessel.positions.length === 0) return null;
    
    // Find position closest to current time
    let closestPosition = vessel.positions[0];
    let closestTimeDiff = Math.abs(new Date(closestPosition.timestamp_utc).getTime() - currentTime.getTime());
    
    for (const position of vessel.positions) {
      const timeDiff = Math.abs(new Date(position.timestamp_utc).getTime() - currentTime.getTime());
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        closestPosition = position;
      }
    }
    
    return closestPosition;
  };

  const getVesselOriginInfo = (vessel: Vessel) => {
    const origin = getVesselOrigin(vessel);
    const colorClass = getVesselMarkerColorClass(vessel);
    
    // Get flag emoji for each country
    const flagEmoji = {
      Spain: '🇪🇸',
      Italy: '🇮🇹',
      Tunisia: '🇹🇳',
      Greece: '🇬🇷',
      Unknown: '❓'
    };
    
    return {
      origin,
      colorClass,
      flagEmoji: flagEmoji[origin]
    };
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-0'
      } overflow-hidden`}>
        <div className="h-full bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FaShip className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Vessel List</h2>
              <span className="text-sm text-gray-400">({vessels.length})</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FaTimes className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Vessel List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {vessels.map((vessel) => {
              const status = getVesselStatus(vessel);
              const position = getCurrentPosition(vessel);
              const originInfo = getVesselOriginInfo(vessel);
              
              return (
                <div
                  key={vessel.id}
                  onClick={() => onVesselSelect(vessel)}
                  className="bg-gray-800/50 hover:bg-gray-700/70 rounded-lg p-3 cursor-pointer transition-colors border border-gray-700 hover:border-gray-600"
                >
                  {/* Vessel Name and Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm truncate">
                        {vessel.name || `Vessel ${vessel.mmsi}`}
                      </h3>
                      {/* Origin indicator */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-sm">{originInfo.flagEmoji}</span>
                        <div className={`w-2 h-2 rounded-full ${originInfo.colorClass}`}></div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} text-white flex-shrink-0`}>
                      {status.text}
                    </span>
                  </div>

                  {/* Origin Country */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                    <FaFlag className="w-3 h-3" />
                    <span>Sailing from: <span className="text-gray-300 font-medium">{originInfo.origin}</span></span>
                  </div>

                  {/* Vessel Details */}
                  {position && (
                    <div className="space-y-1 text-xs text-gray-300">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                        <span>
                          {position.latitude.toFixed(4)}°, {position.longitude.toFixed(4)}°
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FaClock className="w-3 h-3 text-gray-400" />
                        <span>
                          {new Date(position.timestamp_utc).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MMSI */}
                  <div className="mt-2 text-xs text-gray-500">
                    MMSI: {vessel.mmsi}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Click on a vessel to zoom and view details
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
