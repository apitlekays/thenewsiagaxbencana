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

const MALAYSIA_BOUNDS: [number, number, number, number] = [90, -9, 130, 15]; // [west, south, east, north] - covers ASEAN countries
const MALAYSIA_CENTER = [103.5, 4.5]; // [lng, lat] - centered on Peninsular Malaysia

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
                zIndex: 9999, 
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
                    zIndex: 9998
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
  pinnedLocations: { lat: number; lng: number; name: string; color: string }[];
  pinCurrentSearch: (searchResult: { lat: number; lng: number; name: string } | null) => void;
  deletePin: (idx: number) => void;
  deleteAllPins: () => void;
  updatePinColor: (idx: number, color: string) => void;
};

const MapControls = ({ pinnedLocations, pinCurrentSearch, deletePin, deleteAllPins, updatePinColor }: MapControlsProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPanelPosition, setSearchPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { mapRef } = useMap();

  // 1. Add a new state for animation
  const [searchPanelVisible, setSearchPanelVisible] = useState(false);

  // 1. Add state for pinned locations (with localStorage persistence)
  // This state is now managed in the parent component

  // 2. Sync pins to localStorage
  // This useEffect is now managed in the parent component

  // 3. Pin current search result
  // This function is now managed in the parent component

  // 4. Delete a pin
  // This function is now managed in the parent component

  // 5. Delete all pins
  // This function is now managed in the parent component

  // 6. Render pinned markers on the map (always visible)
  // Add this in the Map JSX, outside the search panel:
  {pinnedLocations.map((pin, idx) => (
    <Marker
      key={`pin-${idx}`}
      longitude={pin.lng}
      latitude={pin.lat}
      anchor="bottom"
    >
      <div className="relative z-[9999] flex flex-col items-center">
        <span className="absolute w-8 h-8 rounded-full border-4 border-purple-300 animate-ping z-[9998]" style={{ borderColor: pin.color, background: pin.color + '22' }} />
        <span className="block w-5 h-5 border-2 border-white rounded-full shadow-lg z-[9999]" style={{ background: pin.color }} />
        <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 px-2 py-0.5 bg-white text-gray-900 font-semibold rounded shadow border border-gray-200 whitespace-nowrap z-[10000] text-xs">
          {pin.name}
        </span>
      </div>
    </Marker>
  ))}

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
            className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-grab select-none"
            onMouseDown={handleMouseDown}
            style={{ zIndex: 2 }}
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
                  <span className="font-medium text-gray-700 tracking-wide text-xs uppercase">Pinned Locations</span>
                  <button
                    onClick={deleteAllPins}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="Delete All Pins"
                  >
                    <FaTrashAlt className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-1">
                  {pinnedLocations.map((pin, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs bg-gray-50 rounded border border-gray-100 px-2 py-1 border-l-4 border-blue-500">
                      <div className="flex items-center gap-2">
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
                    onClick={() => pinCurrentSearch(searchResult)}
                    disabled={pinnedLocations.some(p => p.lat === searchResult.lat && p.lng === searchResult.lng)}
                    className="p-2 rounded-full transition-colors text-purple-500 hover:text-purple-700 disabled:text-gray-300"
                    title={pinnedLocations.some(p => p.lat === searchResult.lat && p.lng === searchResult.lng) ? 'Pinned' : 'Pin this location'}
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
    </>
  );
};

// Copyright Footer Component
const CopyrightFooter = () => {
  const currentYear = new Date().getFullYear();
  const appVersion = getAppVersion();
  
  return (
    <div className="fixed bottom-2 right-2 z-40 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded shadow-lg border border-gray-200 hidden md:block">
      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
};

// Search Result Marker Component
const SearchResultMarker = () => {
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
      <div className="relative z-[9999] flex flex-col items-center">
        {/* Pulsing ring */}
        <span className="absolute w-10 h-10 rounded-full border-4 border-blue-300 animate-ping z-[9998]" />
        {/* Solid marker */}
        <span className="block w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg z-[9999]" />
        {/* Label */}
        <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 px-3 py-1 bg-white text-blue-900 font-semibold rounded shadow border border-blue-200 whitespace-nowrap z-[10000]">
          {searchResult.name}
        </span>
      </div>
    </Marker>
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

  // Pinning state and handlers
  const [pinnedLocations, setPinnedLocations] = useState<{ lat: number; lng: number; name: string; color: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pinnedLocations');
      if (stored) {
        // Migrate old pins without color
        return JSON.parse(stored).map((pin: { lat: number; lng: number; name: string; color?: string }) => ({ ...pin, color: pin.color || '#8b5cf6' }));
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pinnedLocations', JSON.stringify(pinnedLocations));
  }, [pinnedLocations]);

  const pinCurrentSearch = (searchResult: { lat: number; lng: number; name: string } | null) => {
    if (searchResult && !pinnedLocations.some(p => p.lat === searchResult.lat && p.lng === searchResult.lng)) {
      setPinnedLocations([...pinnedLocations, { ...searchResult, color: '#8b5cf6' }]);
    }
  };

  const deletePin = (idx: number) => {
    setPinnedLocations(pinnedLocations.filter((_, i) => i !== idx));
  };

  const deleteAllPins = () => {
    setPinnedLocations([]);
  };

  const updatePinColor = (idx: number, color: string) => {
    setPinnedLocations(pinnedLocations.map((pin, i) => i === idx ? { ...pin, color } : pin));
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) return;
    const handler = () => {
      const event = new Event('maplibregl-map-click');
      window.dispatchEvent(event);
    };
    const zoomHandler = () => {
      const zoom = map.getZoom();
      if (zoom < 7) {
        window.dispatchEvent(new CustomEvent('marker-deselect'));
      }
    };
    map.on('click', handler);
    map.on('zoom', zoomHandler);
    return () => {
      map.off('click', handler);
      map.off('zoom', zoomHandler);
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
      >
        <AlertMarkers />
        <PPSMarkers />
        <SearchResultMarker />
        {pinnedLocations.map((pin, idx) => (
          <Marker
            key={`pin-${idx}`}
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="bottom"
          >
            <div className="relative z-[9999] flex flex-col items-center">
              <span className="absolute w-8 h-8 rounded-full border-4 border-purple-300 animate-ping z-[9998]" style={{ borderColor: pin.color, background: pin.color + '22' }} />
              <span className="block w-5 h-5 border-2 border-white rounded-full shadow-lg z-[9999]" style={{ background: pin.color }} />
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 px-2 py-0.5 bg-white text-gray-900 font-semibold rounded shadow border border-gray-200 whitespace-nowrap z-[10000] text-xs">
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
      />
      <CopyrightFooter />
      <MobileOverlay />
    </div>
  );
} 