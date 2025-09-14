'use client';

import { useState, useEffect } from 'react';
import { FaShip, FaTimes, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { Vessel } from '@/contexts/MapContext';
import { 
  getVesselStatusDisplay 
} from '@/utils/vesselStatus';
import { VesselStatus } from '@/types/vessel';

interface VesselListBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vessels: Vessel[];
  onVesselSelect: (vessel: Vessel) => void;
  currentTime: Date;
}

export default function VesselListBottomSheet({ 
  isOpen, 
  onClose, 
  vessels, 
  onVesselSelect, 
  currentTime 
}: VesselListBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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


  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;
    
    // If dragging down more than 50px, close the sheet
    if (deltaY > 50) {
      onClose();
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isExpanded ? 'h-1/2' : 'h-0'
      } overflow-hidden`}>
        <div className="h-full bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 shadow-xl rounded-t-lg flex flex-col">
          {/* Handle */}
          <div 
            className="flex items-center justify-center p-2 cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-8 h-1 bg-gray-500 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <FaShip className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Vessels</h2>
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
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {vessels.map((vessel) => {
              const status = getVesselStatus(vessel);
              const position = getCurrentPosition(vessel);
              
              return (
                <div
                  key={vessel.id}
                  onClick={() => onVesselSelect(vessel)}
                  className="bg-gray-800/50 hover:bg-gray-700/70 rounded-lg p-3 cursor-pointer transition-colors border border-gray-700 hover:border-gray-600"
                >
                  {/* Vessel Name and Status */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white text-sm truncate flex-1 mr-2">
                      {vessel.name || `Vessel ${vessel.mmsi}`}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} text-white flex-shrink-0`}>
                      {status.text}
                    </span>
                  </div>

                  {/* Vessel Details - Compact for mobile */}
                  {position && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                        <span className="truncate">
                          {position.latitude.toFixed(2)}°, {position.longitude.toFixed(2)}°
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <FaClock className="w-3 h-3 text-gray-400" />
                        <span className="truncate">
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
          <div className="px-4 py-2 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Tap vessel to zoom and view details
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
