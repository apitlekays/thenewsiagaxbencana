'use client';

import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaWater, FaCloudRain, FaExpand, FaCompress, FaRedo, FaHome, FaSearch, FaTimes, FaTrash, FaTrashAlt, FaThumbtack } from 'react-icons/fa';
import { useCurrentAlerts } from '@/hooks/useCurrentAlerts';
import { getSeverityBadge } from '../utils/getSeverityBadge';
import { useMap } from '@/contexts/MapContext';
import type { Alert } from '@/contexts/MapContext';
import { getAppVersion } from '@/utils/version';
import Image from 'next/image';

const MALAYSIA_BOUNDS: [number, number, number, number] = [90, -9, 130, 15]; // [west, south, east, north] - covers ASEAN countries
const MALAYSIA_CENTER = [103.5, 4.5]; // [lng, lat] - centered on Peninsular Malaysia

// Utility functions for pin management
const COORDINATE_TOLERANCE = 0.0001; // About 11 meters at the equator
const MAX_PINS = 50; // Maximum number of pins allowed
const PIN_LABEL_ZOOM_THRESHOLD = 8; // Zoom level at which pin labels become visible (temporarily lowered for testing)

// Helper function to check if coordinates are approximately equal
const coordinatesEqual = (lat1: number, lng1: number, lat2: number, lng2: number): boolean => {
  return Math.abs(lat1 - lat2) < COORDINATE_TOLERANCE && Math.abs(lng1 - lng2) < COORDINATE_TOLERANCE;
};

// Helper function to validate hex color
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// Helper function to validate CSS color
const isValidCSSColor = (color: string): boolean => {
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
};

// Helper function to validate color
const validateColor = (color: string): string => {
  if (isValidHexColor(color) || isValidCSSColor(color)) {
    return color;
  }
  return '#8b5cf6'; // Default purple if invalid
};

// Helper function to safely parse localStorage
const safeParseLocalStorage = (key: string, defaultValue: unknown) => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    // Clean up corrupted data
    localStorage.removeItem(key);
    return defaultValue;
  }
};

// Type for pinned location
interface PinnedLocation {
  lat: number;
  lng: number;
  name: string;
  color: string;
}

// Preset colors for easy selection
const PRESET_COLORS = [
  '#8b5cf6', // Purple (default)
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
];

// Helper function to check if a location is already pinned
const isLocationPinned = (pinnedLocations: PinnedLocation[], lat: number, lng: number): boolean => {
  return pinnedLocations.some(pin => coordinatesEqual(pin.lat, pin.lng, lat, lng));
};

function getSeverityColor(alert: Alert): string {
  // First check wl_severity_level
  const wlSeverity = alert.wl_severity_level;
  if (wlSeverity === 'Warning' || wlSeverity === 'Alert' || wlSeverity === 'Danger') {
    switch (wlSeverity) {
      case 'Warning':
        return '#eab308'; // yellow-500
      case 'Alert':
        return '#f97316'; // orange-500
      case 'Danger':
        return '#dc2626'; // red-600
    }
  }
  
  // If wl_severity_level doesn't match expected levels, check rf_severity_level
  const rfSeverity = alert.rf_severity_level;
  if (rfSeverity) {
    switch (rfSeverity.toLowerCase()) {
      case 'very heavy':
        return '#dc2626'; // red-600 (Danger equivalent)
      case 'heavy':
        return '#f97316'; // orange-500 (Alert equivalent)
      case 'moderate':
        return '#eab308'; // yellow-500 (Warning equivalent)
    }
  }
  
  // Default to green if neither severity level matches
  return '#05df72'; // green
}

function AlertMarkers() {
  const alerts: Alert[] = useCurrentAlerts(60000);
  const { mapLoaded } = useMap();
  const [popupInfo, setPopupInfo] = useState<Alert | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    //console.log('AlertMarkers: alerts count:', alerts.length, 'mapLoaded:', mapLoaded, 'alerts:', alerts);
  }, [alerts, mapLoaded]);

  useEffect(() => {
    const handleMapClick = () => setPopupInfo(null);
    window.addEventListener('maplibregl-map-click', handleMapClick);
    return () => window.removeEventListener('maplibregl-map-click', handleMapClick);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  // Listen for marker selection events
  useEffect(() => {
    const handleMarkerSelect = (event: CustomEvent) => {
      setSelectedMarkerId(event.detail.stationId);
    };

    const handleMarkerDeselect = () => {
      setSelectedMarkerId(null);
    };

    window.addEventListener('marker-select', handleMarkerSelect as EventListener);
    window.addEventListener('marker-deselect', handleMarkerDeselect);
    
    return () => {
      window.removeEventListener('marker-select', handleMarkerSelect as EventListener);
      window.removeEventListener('marker-deselect', handleMarkerDeselect);
    };
  }, []);

  // Don't render markers until map is loaded
  if (!mapLoaded) {
    return null;
  }

  // Filter alerts with valid coordinates
  const validAlerts = alerts.filter(alert => {
    if (!alert.latitude || !alert.longitude) {
      //console.log('Alert missing coordinates:', alert.station_id, alert.latitude, alert.longitude);
      return false;
    }
    const lat = parseFloat(alert.latitude);
    const lng = parseFloat(alert.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      //console.log('Alert has invalid coordinates:', alert.station_id, alert.latitude, alert.longitude);
      return false;
    }
    return true;
  });

  //console.log('Valid alerts for markers:', validAlerts.length);

  return (
    <>
      {validAlerts.map(alert => {
        const lat = parseFloat(alert.latitude!);
        const lng = parseFloat(alert.longitude!);
        const color = getSeverityColor(alert);
        const isSelected = selectedMarkerId === alert.station_id;
        
        return (
          <Marker
            key={alert.station_id}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(alert);
            }}
          >
            <div 
              style={{ 
                width: 15, 
                height: 15, 
                position: 'relative', 
                zIndex: 9998, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                animation: isRefreshing ? 'pulse 1s ease-in-out' : 'none'
              }}
            >
              {/* Pulsing ring for selected marker */}
              {isSelected && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    inset: -8, 
                    borderRadius: '50%', 
                    border: '2px solid white',
                    animation: 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
                    zIndex: 9997
                  }} 
                />
              )}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: color, opacity: 0.3, animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />
              <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', backgroundColor: color }} />
            </div>
          </Marker>
        );
      })}
      {popupInfo && popupInfo.latitude && popupInfo.longitude && (
        <Popup
          longitude={parseFloat(popupInfo.longitude)}
          latitude={parseFloat(popupInfo.latitude)}
          anchor="top"
          onClose={() => setPopupInfo(null)}
          closeOnClick={true}
          closeButton={true}
        >
          <div className="p-3 min-w-[300px] bg-gray-900/75 backdrop-blur-sm rounded-sm border border-gray-700/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FaMapMarkerAlt className="text-blue-400 text-xs flex-shrink-0" />
                  <h3 className="text-white font-semibold text-sm truncate">{popupInfo.station_name}</h3>
                </div>
                <div className="text-gray-400 text-xs">{popupInfo.state}</div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(popupInfo.wl_severity_level)}`}>{popupInfo.wl_severity_level}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <FaWater className="text-blue-400 text-xs" />
                  <span className="text-blue-300 text-xs font-medium">Water Level</span>
                </div>
                <div className="text-blue-100 text-sm font-bold">{popupInfo.clean_water_level || 'N/A'}</div>
              </div>
              <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <FaCloudRain className="text-purple-400 text-xs" />
                  <span className="text-purple-300 text-xs font-medium">Rainfall</span>
                </div>
                <div className="text-purple-100 text-sm font-bold">{popupInfo.rf1hour || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

function PPSMarkers() {
  const [points, setPoints] = useState<Array<{ id: number; longi: number; latti: number; [key: string]: unknown }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPPSData = () => {
    fetch('https://n8n.drhafizhanif.net/webhook/pps-buka')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PPS data');
        return res.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) { 
          setPoints([]); 
          return; 
        }
        
        // Filter out empty objects and objects without required fields
        const validData = (data as Array<{ points?: Array<{ id: number; longi: number; latti: number; [key: string]: unknown }> }>).filter(item => {
          return item && 
                 item.points && 
                 Array.isArray(item.points) && 
                 item.points.length > 0 &&
                 Object.keys(item).length > 0; // Ensure it's not just an empty object
        });
        
        const allPoints = validData.flatMap((item) => item.points || []);
        
        // Further filter points to ensure they have valid coordinates
        const validPoints = allPoints.filter(point => {
          return point && 
                 point.id && 
                 point.longi && 
                 point.latti &&
                 typeof point.longi === 'number' && 
                 typeof point.latti === 'number' &&
                 !isNaN(point.longi) && 
                 !isNaN(point.latti) &&
                 Object.keys(point).length > 1; // Ensure it's not just an empty object
        });
        
        setPoints(validPoints);
      })
      .catch((error) => {
        console.error('Error fetching PPS data:', error);
        setPoints([]);
      });
  };

  useEffect(() => {
    fetchPPSData();
  }, [refreshKey]);

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  return (
    <>
      {points.map(p => (
        <Marker
          key={p.id}
          longitude={p.longi}
          latitude={p.latti}
          anchor="bottom"
        >
          <div style={{ animation: isRefreshing ? 'bounce 1s ease-in-out' : 'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 L22 21 Q23 23 20 23 H15 Q14 23 13.5 22 L12 19 L10.5 22 Q10 23 9 23 H4 Q1 23 2 21 L12 3 Z" fill="#3B82F6" />
            </svg>
          </div>
        </Marker>
      ))}
    </>
  );
}

// Map Control Buttons Component
type MapControlsProps = {
  pinnedLocations: PinnedLocation[];
  pinCurrentSearch: (searchResult: { lat: number; lng: number; name: string } | null) => void;
  deletePin: (idx: number) => void;
  deleteAllPins: () => void;
  updatePinColor: (idx: number, color: string) => void;
  // Multi-selection props
  isSelectionMode: boolean;
  selectedPins: Set<number>;
  toggleSelectionMode: () => void;
  togglePinSelection: (idx: number) => void;
  selectAllPins: () => void;
  deselectAllPins: () => void;
  updateSelectedPinsColor: (color: string) => void;
  deleteSelectedPins: () => void;
};

const MapControls = ({ 
  pinnedLocations, 
  pinCurrentSearch, 
  deletePin, 
  deleteAllPins, 
  updatePinColor,
  isSelectionMode,
  selectedPins,
  toggleSelectionMode,
  togglePinSelection,
  selectAllPins,
  deselectAllPins,
  updateSelectedPinsColor,
  deleteSelectedPins
}: MapControlsProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPanelPosition, setSearchPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pinLimitMessage, setPinLimitMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { mapRef } = useMap();

  // 1. Add a new state for animation
  const [searchPanelVisible, setSearchPanelVisible] = useState(false);

  // Show pin limit message
  useEffect(() => {
    if (pinLimitMessage) {
      const timer = setTimeout(() => setPinLimitMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [pinLimitMessage]);

  // Enhanced pin function with user feedback
  const handlePinCurrentSearch = (searchResult: { lat: number; lng: number; name: string } | null) => {
    if (!searchResult) return;
    
    // Check pin limit before attempting to pin
    if (pinnedLocations.length >= MAX_PINS) {
      setPinLimitMessage({ text: `Maximum ${MAX_PINS} pins reached. Please delete some pins first.`, type: 'error' });
      return;
    }
    
    // Check if already pinned
    if (isLocationPinned(pinnedLocations, searchResult.lat, searchResult.lng)) {
      setPinLimitMessage({ text: 'This location is already pinned', type: 'warning' });
      return;
    }
    
    pinCurrentSearch(searchResult);
    setPinLimitMessage({ text: `"${searchResult.name}" has been pinned successfully!`, type: 'success' });
  };

  // Pin management functions are now handled by the parent component

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const refreshPage = () => {
    // Dispatch a custom event to refresh data without exiting fullscreen
    window.dispatchEvent(new CustomEvent('refresh-map-data'));
    
    // Show a brief visual feedback
    const button = document.querySelector('[data-refresh-button]') as HTMLButtonElement;
    if (button) {
      button.classList.add('animate-spin');
      setTimeout(() => {
        button.classList.remove('animate-spin');
      }, 1000);
    }
  };

  const resetMapView = () => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) return;
    
    // Reset to initial view state
    map.easeTo({
      center: [MALAYSIA_CENTER[0], MALAYSIA_CENTER[1]],
      zoom: 6,
      duration: 1000, // Smooth animation over 1 second
      essential: true
    });
    
    // Show a brief visual feedback
    const button = document.querySelector('[data-reset-button]') as HTMLButtonElement;
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => {
        button.classList.remove('animate-pulse');
      }, 1000);
    }
  };

  // 2. Update toggleSearch to handle fade in/out
  const toggleSearch = () => {
    if (showSearch) {
      // Fade out
      setSearchPanelVisible(false);
      setTimeout(() => {
        clearSearch();
        setSearchPanelPosition(null);
        setShowSearch(false);
      }, 300); // match the transition duration
    } else {
      setShowSearch(true);
      setTimeout(() => setSearchPanelVisible(true), 10); // allow panel to mount before fading in
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Use OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Malaysia')}&limit=1&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Search service unavailable');
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setSearchError('Location not found. Please try a different search term.');
        setSearchResult(null);
        return;
      }
      
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      // Check if location is within Malaysia bounds
      if (lng < MALAYSIA_BOUNDS[0] || lng > MALAYSIA_BOUNDS[2] || 
          lat < MALAYSIA_BOUNDS[1] || lat > MALAYSIA_BOUNDS[3]) {
        setSearchError('Location is outside Malaysia. Please search for a location within Malaysia.');
        setSearchResult(null);
        return;
      }
      
      // Set search result
      const searchResultData = {
        lat,
        lng,
        name: result.display_name.split(',')[0] // Get the first part of the display name
      };
      //console.log('MapControls: Setting search result:', searchResultData);
      setSearchResult(searchResultData);
      
      // Dispatch event to show marker on map
      //console.log('MapControls: Dispatching search-result event');
      // Add a small delay to ensure the component is ready to receive the event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('search-result', { detail: searchResultData }));
      }, 100);
      
      // Zoom to location
      if (mapRef.current) {
        const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
        if (map) {
          map.easeTo({
            center: [lng, lat],
            zoom: 12,
            duration: 1500,
            essential: true
          });
        }
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResult(null);
    setSearchError(null);
    window.dispatchEvent(new CustomEvent('clear-search'));
    resetMapView();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  // 1. Add touch drag functionality in MapControls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep panel within viewport bounds
      const maxX = window.innerWidth - 400; // panel width
      const maxY = window.innerHeight - 200; // approximate panel height
      
      setSearchPanelPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        e.preventDefault();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const maxX = window.innerWidth - 400;
        const maxY = window.innerHeight - 200;
        setSearchPanelPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };
    const handlePointerUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove, { passive: false });
      document.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragOffset]);

  // 2. Add onTouchStart to the drag handle
  // ...
  // <div ... onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} ...>

  // 3. When showSearch is set to true, center the panel
  useEffect(() => {
    if (showSearch) {
      const centerX = (window.innerWidth - 400) / 2; // 400px is panel width
      const centerY = (window.innerHeight - 200) / 2; // 200px is approximate panel height
      setSearchPanelPosition({ x: centerX, y: centerY });
    }
  }, [showSearch]);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-3 hidden md:flex">
        <button
          onClick={refreshPage}
          className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl"
          title="Refresh Data"
          data-refresh-button
        >
          <FaRedo className="w-5 h-5" />
        </button>
        <button
          onClick={resetMapView}
          className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl"
          title="Reset Map View"
          data-reset-button
        >
          <FaHome className="w-5 h-5" />
        </button>
        <button
          onClick={toggleSearch}
          className={`bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl ${showSearch ? 'bg-blue-100 text-blue-700' : ''}`}
          title="Search Location"
        >
          <FaSearch className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <FaCompress className="w-5 h-5" />
          ) : (
            <FaExpand className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Search Input */}
      {/* 4. Only render the panel if showSearch and searchPanelPosition are set */}
      {/* Add fade classes based on searchPanelVisible */}
      {showSearch && searchPanelPosition && (
        <div
          className={`fixed z-50 bg-white/95 backdrop-blur-sm rounded-sm shadow-xl border-l-4 border-blue-500 hidden md:block min-w-[400px] transition-opacity duration-300 ${searchPanelVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            left: searchPanelPosition.x,
            top: searchPanelPosition.y,
            transform: 'none'
          }}
        >
          {/* Drag Handle - Left Side, improved grouping and centering */}
          <div
            className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center cursor-grab select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onPointerDown={handlePointerDown}
            style={{ zIndex: 2, touchAction: 'none' }}
          >
            <div className="relative h-12 w-full flex items-center justify-center">
              {/* Top dots */}
              <div className="absolute top-3.3 left-1.5 flex flex-col items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              </div>
              {/* Bottom dots */}
              <div className="absolute top-3.3 left-3.5  flex flex-col items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              </div>
            </div>
          </div>
          <div className="pl-6 p-2 flex flex-col gap-2">
            {/* Pinned Locations */}
            {pinnedLocations.length > 0 && (
              <div className="w-full mb-2 p-3 bg-white border border-gray-100 rounded shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 tracking-wide text-xs uppercase">Pinned Locations</span>
                    <span className="text-xs text-gray-500">({pinnedLocations.length}/{MAX_PINS})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Selection Mode Toggle */}
                    <button
                      onClick={toggleSelectionMode}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isSelectionMode 
                          ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600' 
                          : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                      }`}
                      title={isSelectionMode ? 'Exit Selection Mode' : 'Select Multiple'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                    <button
                      onClick={deleteAllPins}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete All Pins"
                    >
                      <FaTrashAlt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Selection Mode Controls */}
                {isSelectionMode && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-blue-800">
                          Selection Mode Active
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                          {selectedPins.size} of {pinnedLocations.length} selected
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={selectAllPins}
                            className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            Select All
                          </button>
                          <button
                            onClick={deselectAllPins}
                            className="text-xs px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bulk Color Selection */}
                    {selectedPins.size > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                            Color Management
                          </span>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {selectedPins.size} pin{selectedPins.size !== 1 ? 's' : ''} selected
                          </span>
                        </div>
                        
                        {/* Preset Color Palette */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600 font-medium">Quick Colors</div>
                          <div className="flex gap-1.5">
                            {PRESET_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => updateSelectedPinsColor(color)}
                                className="group relative w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                style={{ backgroundColor: color }}
                                title={`Apply ${color}`}
                              >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Custom Color Section */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600 font-medium">Custom Color</div>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <input
                                type="color"
                                value={PRESET_COLORS[0]}
                                onChange={(e) => updateSelectedPinsColor(e.target.value)}
                                className="w-8 h-8 rounded-md border-2 border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200"
                                title="Pick custom color"
                              />
                              <div className="absolute inset-0 rounded-md border-2 border-transparent pointer-events-none" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">Click to open color picker</div>
                              <div className="text-xs text-gray-400">Choose any color for your pins</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={deleteSelectedPins}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            <FaTrash className="w-3 h-3" />
                            Delete Selected
                          </button>
                          <button
                            onClick={deselectAllPins}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mb-2">
                  💡 Labels show when zoomed in (zoom ≥ {PIN_LABEL_ZOOM_THRESHOLD})
                </div>
                
                <div className="relative">
                  <div className="max-h-48 overflow-y-auto pr-1" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db #f3f4f6'
                  }}>
                    <ul className="space-y-1">
                      {pinnedLocations.map((pin, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs bg-gray-50 rounded border border-gray-100 px-2 py-1 border-l-4 border-blue-500">
                          <div className="flex items-center gap-2">
                            {/* Selection Checkbox */}
                            {isSelectionMode && (
                              <input
                                type="checkbox"
                                checked={selectedPins.has(idx)}
                                onChange={() => togglePinSelection(idx)}
                                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                            )}
                            <input
                              type="color"
                              value={pin.color}
                              onChange={e => updatePinColor(idx, e.target.value)}
                              className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
                              title="Pick marker color"
                              style={{ minWidth: 20 }}
                            />
                            <span className="truncate max-w-[120px] text-gray-800">{pin.name}</span>
                          </div>
                          <button
                            onClick={() => deletePin(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors ml-2 flex items-center"
                            title="Delete Pin"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Scroll indicator */}
                  {pinnedLocations.length > 4 && (
                    <div className="absolute bottom-0 right-0 w-2 h-6 bg-gradient-to-t from-gray-200 to-transparent pointer-events-none rounded-l"></div>
                  )}
                </div>
              </div>
            )}

            {/* Search Input Row */}
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for a location in Malaysia..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearching}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={toggleSearch}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-700 text-sm">{searchError}</p>
              </div>
            )}

            {/* Search Result */}
            {searchResult && (
              <div className="mt-2 p-3 bg-white border border-gray-200 rounded shadow flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-semibold text-base">{searchResult.name}</p>
                  <p className="text-gray-500 text-xs">Location found and marked on map</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handlePinCurrentSearch(searchResult)}
                    disabled={isLocationPinned(pinnedLocations, searchResult.lat, searchResult.lng)}
                    className="p-2 rounded-full transition-colors text-purple-500 hover:text-purple-700 disabled:text-gray-300"
                    title={isLocationPinned(pinnedLocations, searchResult.lat, searchResult.lng) ? 'Pinned' : 'Pin this location'}
                  >
                    <FaThumbtack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearSearch}
                    className="p-2 rounded-full transition-colors text-red-400 hover:text-red-600"
                    title="Clear search result"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
             {pinLimitMessage && (
         <div className={`fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 text-white text-sm px-3 py-1.5 rounded-md shadow-lg border ${
           pinLimitMessage.type === 'success' 
             ? 'bg-green-500/90 border-green-600/50' 
             : pinLimitMessage.type === 'warning'
             ? 'bg-yellow-500/90 border-yellow-600/50'
             : 'bg-red-500/90 border-red-600/50'
         }`}>
           {pinLimitMessage.text}
         </div>
       )}
    </>
  );
};

// Copyright Footer Component
const CopyrightFooter = ({ mapZoom }: { mapZoom?: number }) => {
  const currentYear = new Date().getFullYear();
  const appVersion = getAppVersion();
  const labelsVisible = typeof mapZoom === 'number' && mapZoom >= PIN_LABEL_ZOOM_THRESHOLD;
  
  return (
    <div className="fixed bottom-2 right-2 z-40 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded shadow-lg border border-gray-200 hidden md:block flex items-center gap-2">
      <span className="font-semibold text-gray-800">© {currentYear} SiagaX & MAPIM Malaysia</span>
      <span className="text-gray-400">•</span>
      <span className="text-gray-500">v{appVersion}</span>
      <span className="text-gray-400">•</span>
      <a 
        href="/privacy" 
        className="hover:text-blue-600 hover:underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy Policy
      </a>
      <span className="text-gray-400">•</span>
      <a 
        href="/disclaimer" 
        className="hover:text-blue-600 hover:underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        Disclaimer
      </a>
      {typeof mapZoom === 'number' && (
        <>
          <span className="text-gray-400">•</span>
          <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 font-mono">
            Zoom: {mapZoom.toFixed(2)}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            labelsVisible 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 text-gray-500 border border-gray-300'
          }`}>
            {labelsVisible ? 'Labels: ON' : 'Labels: OFF'}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-xs text-gray-500">
            Threshold: {PIN_LABEL_ZOOM_THRESHOLD}
          </span>
        </>
      )}
    </div>
  );
};

// Search Result Marker Component
const SearchResultMarker = ({ mapZoom }: { mapZoom: number }) => {
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; name: string } | null>(null);

  useEffect(() => {
    const handleSearchResult = (event: CustomEvent) => {
      setSearchResult(event.detail);
    };
    const handleClearSearch = () => {
      setSearchResult(null);
    };
    window.addEventListener('search-result', handleSearchResult as EventListener);
    window.addEventListener('clear-search', handleClearSearch);
    return () => {
      window.removeEventListener('search-result', handleSearchResult as EventListener);
      window.removeEventListener('clear-search', handleClearSearch);
    };
  }, []);

  if (!searchResult) return null;

  return (
    <Marker
      longitude={searchResult.lng}
      latitude={searchResult.lat}
      anchor="bottom"
    >
      <div className="relative z-[9997] flex flex-col items-center">
        {/* Pulsing ring */}
        <span className="absolute w-10 h-10 rounded-full border-4 border-blue-300 animate-ping z-[9996]" />
        {/* Solid marker */}
        <span className="block w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg z-[9997]" />
        {/* Label - responsive to zoom level */}
        <span 
          className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 px-3 py-1 bg-white text-blue-900 font-semibold rounded shadow border border-blue-200 whitespace-nowrap z-[10000] transition-all duration-300 ease-in-out ${
            mapZoom >= PIN_LABEL_ZOOM_THRESHOLD 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={{
            transform: `translateX(-50%) scale(${mapZoom >= PIN_LABEL_ZOOM_THRESHOLD ? 1 : 0.95})`,
            transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out'
          }}
        >
          {searchResult.name}
        </span>
      </div>
    </Marker>
  );
};

// MAPIM HQ Marker Component
const MAPIMHQMarker = ({ coordinates }: { coordinates: Array<{ latitude: number; longitude: number; name: string }> }) => {
  return (
    <>
      {coordinates.map((coord, index) => (
        <Marker
          key={`mapim-${index}`}
          longitude={coord.longitude}
          latitude={coord.latitude}
          anchor="bottom"
        >
          <div className="relative z-[9999]" style={{ width: '32px', height: '40px' }}>
            {/* Pulsing fluorescent green dot */}
            <div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-ping"
              style={{ 
                backgroundColor: '#39ff14',
                boxShadow: '0 0 10px #39ff14, 0 0 20px #39ff14',
                zIndex: 9999 
              }}
            />
            {/* Solid fluorescent green dot */}
            <div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: '#39ff14',
                boxShadow: '0 0 5px #39ff14',
                zIndex: 9999 
              }}
            />
            {/* MAPIM HQ GIF marker with levitating animation */}
            {
              //if name is not MAPIM Central Warehouse, then show the GIF
              coord.name !== 'MAPIM Central Warehouse' && (
                <Image 
                  src="/mapim-location.gif" 
                  alt="MAPIM HQ" 
                  width={32}
                  height={32}
                  unoptimized={true}
                  className="absolute rounded-full shadow-lg"
                  style={{ 
                    zIndex: 99999,
                    bottom: '8px',
                    transform: 'translateX(-50%)',
                    animation: 'levitate 2s ease-in-out infinite'
                  }}
                />
              )
            }
          </div>
        </Marker>
      ))}
    </>
  );
};

// Mobile Overlay Component
const MobileOverlay = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-black/70 backdrop-blur-sm text-white p-4 border-t border-gray-600">
        <div className="flex items-center justify-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">View on larger screens for additional controls</p>
            <p className="text-xs text-gray-300 mt-1">Alerts and other detailed information are available on desktop</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MalaysiaMap() {
  const { setMapLoaded, mapRef } = useMap();

  // Pinning state and handlers with improved error handling
  const [pinnedLocations, setPinnedLocations] = useState<PinnedLocation[]>(() => {
    const stored = safeParseLocalStorage('pinnedLocations', []);
    if (Array.isArray(stored)) {
      // Migrate old pins without color and validate data
      return stored
        .filter((pin: unknown) => {
          if (!pin || typeof pin !== 'object') return false;
          const p = pin as Record<string, unknown>;
          return (
            typeof p.lat === 'number' && 
            typeof p.lng === 'number' && 
            typeof p.name === 'string' &&
            !isNaN(p.lat) && 
            !isNaN(p.lng) &&
            p.lat >= -90 && p.lat <= 90 &&
            p.lng >= -180 && p.lng <= 180
          );
        })
        .map((pin: { lat: number; lng: number; name: string; color?: string }) => ({ 
          ...pin, 
          color: validateColor(pin.color || '#8b5cf6'),
          name: pin.name.trim() || 'Unknown Location'
        }))
        .slice(0, MAX_PINS); // Limit to maximum pins
    }
    return [];
  });

  // Multi-selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPins, setSelectedPins] = useState<Set<number>>(new Set());

  // Memoized duplicate check for better performance
  const checkIfLocationPinned = (lat: number, lng: number): boolean => {
    return isLocationPinned(pinnedLocations, lat, lng);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pinnedLocations', JSON.stringify(pinnedLocations));
    } catch (error) {
      console.error('Failed to save pinned locations to localStorage:', error);
    }
  }, [pinnedLocations]);

  const pinCurrentSearch = (searchResult: { lat: number; lng: number; name: string } | null) => {
    if (!searchResult) return;
    
    // Validate search result
    if (typeof searchResult.lat !== 'number' || typeof searchResult.lng !== 'number' ||
        isNaN(searchResult.lat) || isNaN(searchResult.lng) ||
        searchResult.lat < -90 || searchResult.lat > 90 ||
        searchResult.lng < -180 || searchResult.lng > 180) {
      console.warn('Invalid coordinates for pinning:', searchResult);
      return;
    }

    // Check if already pinned
    if (checkIfLocationPinned(searchResult.lat, searchResult.lng)) {
      console.log('Location already pinned');
      return;
    }

    // Check pin limit
    if (pinnedLocations.length >= MAX_PINS) {
      console.warn(`Maximum number of pins (${MAX_PINS}) reached`);
      return;
    }

    // Validate and sanitize name
    const sanitizedName = searchResult.name.trim() || 'Unknown Location';
    
    setPinnedLocations(prev => [...prev, { 
      ...searchResult, 
      name: sanitizedName,
      color: '#8b5cf6' 
    }]);
  };

  const deletePin = (idx: number) => {
    if (idx < 0 || idx >= pinnedLocations.length) {
      console.warn('Invalid pin index for deletion:', idx);
      return;
    }
    setPinnedLocations(prev => prev.filter((_, i) => i !== idx));
  };

  const deleteAllPins = () => {
    setPinnedLocations([]);
  };

  const updatePinColor = (idx: number, color: string) => {
    if (idx < 0 || idx >= pinnedLocations.length) {
      console.warn('Invalid pin index for color update:', idx);
      return;
    }
    
    const validatedColor = validateColor(color);
    setPinnedLocations(prev => prev.map((pin, i) => 
      i === idx ? { ...pin, color: validatedColor } : pin
    ));
  };

  // Multi-selection functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedPins(new Set()); // Clear selection when exiting mode
    }
  };

  const togglePinSelection = (idx: number) => {
    const newSelected = new Set(selectedPins);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedPins(newSelected);
  };

  const selectAllPins = () => {
    setSelectedPins(new Set(pinnedLocations.map((_, idx) => idx)));
  };

  const deselectAllPins = () => {
    setSelectedPins(new Set());
  };

  const updateSelectedPinsColor = (color: string) => {
    const validatedColor = validateColor(color);
    setPinnedLocations(prev => prev.map((pin, idx) => 
      selectedPins.has(idx) ? { ...pin, color: validatedColor } : pin
    ));
  };

  const deleteSelectedPins = () => {
    setPinnedLocations(prev => prev.filter((_, idx) => !selectedPins.has(idx)));
    setSelectedPins(new Set());
    setIsSelectionMode(false);
  };

  // In MalaysiaMap, add state for mapZoom and update it on zoom
  const [mapZoom, setMapZoom] = useState(6);

  // Handle map movement and zoom changes
  const handleMapMove = (event: { viewState: { zoom: number } }) => {
    const zoom = event.viewState.zoom;
    setMapZoom(zoom);
    
    // Deselect markers when zoomed out too far
    if (zoom < 7) {
      window.dispatchEvent(new CustomEvent('marker-deselect'));
    }
    
    // Debug: Log when labels should be visible
    if (zoom >= PIN_LABEL_ZOOM_THRESHOLD) {
      console.log(`Labels should be ON (zoom: ${zoom.toFixed(2)} >= ${PIN_LABEL_ZOOM_THRESHOLD})`);
    } else {
      console.log(`Labels should be OFF (zoom: ${zoom.toFixed(2)} < ${PIN_LABEL_ZOOM_THRESHOLD})`);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) return;
    const handler = () => {
      const event = new Event('maplibregl-map-click');
      window.dispatchEvent(event);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [mapRef]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: MALAYSIA_CENTER[0],
          latitude: MALAYSIA_CENTER[1],
          zoom: 6,
        }}
        minZoom={6}
        maxZoom={15}
        maxBounds={MALAYSIA_BOUNDS}
        style={{ width: '100vw', height: '100vh' }}
        mapStyle="https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"
        attributionControl={false}
        scrollZoom={true}
        doubleClickZoom={true}
        dragPan={true}
        touchZoomRotate={true}
        keyboard={false}
        onLoad={() => setMapLoaded(true)}
        onMove={handleMapMove}
      >
        <AlertMarkers />
        <PPSMarkers />
        <SearchResultMarker mapZoom={mapZoom} />
        <MAPIMHQMarker coordinates={[
          { latitude: 2.8828815, longitude: 101.7936722, name: 'MAPIM HQ' },
          { latitude: 3.1119137, longitude: 101.5169861, name: 'MAPIM President Office' },
          { latitude: 2.840720, longitude: 101.691235, name: 'MAPIM Central Warehouse' },
          { latitude: 4.616539, longitude: 101.0495603, name: 'MAPIM Perak' },
          { latitude: 5.64762, longitude: 100.4785438, name: 'MAPIM Kedah' },
        ]} />
        {pinnedLocations.map((pin, idx) => (
          <Marker
            key={`pin-${idx}`}
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="bottom"
          >
            <div className="relative z-[9997] flex flex-col items-center">
              {/* Pulsing ring */}
              <span 
                className="absolute w-8 h-8 rounded-full border-4 border-purple-300 animate-ping z-[9996]" 
                style={{ borderColor: pin.color, background: pin.color + '22' }} 
              />
              {/* Solid marker */}
              <span 
                className="block w-5 h-5 border-2 border-white rounded-full shadow-lg z-[9997]" 
                style={{ background: pin.color }} 
              />
              {/* Location label - responsive to zoom level */}
              <span 
                className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 px-2 py-0.5 bg-white text-gray-900 font-semibold rounded shadow border border-gray-200 whitespace-nowrap z-[10000] text-xs transition-all duration-300 ease-in-out ${
                  mapZoom >= PIN_LABEL_ZOOM_THRESHOLD 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{
                  transform: `translateX(-50%) scale(${mapZoom >= PIN_LABEL_ZOOM_THRESHOLD ? 1 : 0.95})`,
                  transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out'
                }}
              >
                {pin.name}
              </span>
            </div>
          </Marker>
        ))}
      </Map>
      <MapControls
        pinnedLocations={pinnedLocations}
        pinCurrentSearch={pinCurrentSearch}
        deletePin={deletePin}
        deleteAllPins={deleteAllPins}
        updatePinColor={updatePinColor}
        // Multi-selection props
        isSelectionMode={isSelectionMode}
        selectedPins={selectedPins}
        toggleSelectionMode={toggleSelectionMode}
        togglePinSelection={togglePinSelection}
        selectAllPins={selectAllPins}
        deselectAllPins={deselectAllPins}
        updateSelectedPinsColor={updateSelectedPinsColor}
        deleteSelectedPins={deleteSelectedPins}
      />
      <CopyrightFooter mapZoom={mapZoom} />
      <MobileOverlay />
      
      {/* Debug button for testing zoom tracking */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-2 rounded shadow-lg border border-gray-200">
          <div className="font-semibold mb-1">Debug Info:</div>
          <div>Zoom: {mapZoom.toFixed(2)}</div>
          <div>Labels: {mapZoom >= PIN_LABEL_ZOOM_THRESHOLD ? 'ON' : 'OFF'}</div>
          <div>Threshold: {PIN_LABEL_ZOOM_THRESHOLD}</div>
        </div>
      )}
    </div>
  );
} 