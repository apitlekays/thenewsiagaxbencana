'use client';

import { useState, useMemo } from 'react';
import { 
  FaShip, 
  FaMapMarkerAlt, 
  FaTachometerAlt, 
  FaCalendarAlt,
  FaTimes,
  FaFlag,
  FaExternalLinkAlt,
  FaImage
} from 'react-icons/fa';
import { calculateVesselStats } from '@/hooks/useVesselDetails';
import { VesselDetailsPanelProps } from '@/types/vessel';
import { 
  getVesselStatusIcon, 
  getVesselStatusDisplay 
} from '@/utils/vesselStatus';
import { VesselStatus } from '@/types/vessel';
import { getVesselOrigin } from '@/utils/vesselOrigin';
import Image from 'next/image';

export default function EnhancedVesselDetailsPanel({ vessel, isVisible, onClose }: VesselDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'movement' | 'details' | 'mission'>('overview');

  // Note: useVesselDetails hook removed as calculateVesselStats now uses vessel data directly from props
  // The vessel object already contains all GSF API fields (speed_kmh, speed_knots, course, etc.)

  // Calculate vessel statistics - only when vessel exists
  const stats = useMemo(() => {
    if (!vessel) return null;
    return calculateVesselStats(vessel);
  }, [vessel]);

  if (!isVisible || !vessel) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric'
    });
  };

  const formatTimestampMobile = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sailing':
        return 'bg-blue-900/50 text-blue-300 border border-blue-500';
      case 'repairing':
        return 'bg-yellow-900/50 text-yellow-300 border border-yellow-500';
      case 'attacked':
        return 'bg-red-900/50 text-red-300 border border-red-500';
      case 'emergency':
        return 'bg-orange-900/50 text-orange-300 border border-orange-500';
      case 'disabled':
        return 'bg-gray-700 text-gray-300 border border-gray-500';
      case 'preparing':
        return 'bg-gray-700 text-gray-300 border border-gray-500';
      case 'completed':
        return 'bg-green-800 text-green-200 border border-green-400';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const getStatusDisplayText = (status: string) => {
    return getVesselStatusDisplay(status as VesselStatus);
  };

  const getStatusIcon = (status: string) => {
    const StatusIconComponent = getVesselStatusIcon(status as VesselStatus);
    return <StatusIconComponent className="w-3 h-3" />;
  };

  // Helper functions for new features
  const getCountryFlag = (origin: string) => {
    const countryFlags: Record<string, string> = {
      'Spain': '🇪🇸',
      'Italy': '🇮🇹', 
      'Tunisia': '🇹🇳',
      'Greece': '🇬🇷'
    };
    return countryFlags[origin] || '🏴';
  };

  const getCourseDirection = (course: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(course / 22.5) % 16;
    return directions[index];
  };

  const formatSpeed = (speed: number | null | undefined, unit: 'kmh' | 'knots') => {
    if (speed === null || speed === undefined) return 'N/A';
    return `${speed.toFixed(1)} ${unit === 'kmh' ? 'km/h' : 'knots'}`;
  };

  const formatCourse = (course: number | null | undefined) => {
    if (course === null || course === undefined) return 'N/A';
    return `${course.toFixed(0)}° ${getCourseDirection(course)}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaMapMarkerAlt className="w-3 h-3" /> },
    { id: 'movement', label: 'Movement', icon: <FaTachometerAlt className="w-3 h-3" /> },
    { id: 'details', label: 'Details', icon: <FaShip className="w-3 h-3" /> },
    { id: 'mission', label: 'Mission', icon: <FaCalendarAlt className="w-3 h-3" /> },
  ];

  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:flex w-96 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 max-h-[70vh] overflow-hidden flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                vessel.vessel_status === 'preparing' ? 'bg-gray-400' :
                vessel.vessel_status === 'completed' ? 'bg-green-500' :
                vessel.vessel_status === 'sailing' ? 'bg-blue-500' :
                'bg-blue-500'
              }`}>
                {getStatusIcon(vessel.vessel_status)}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{vessel.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {vessel.mmsi && <span>MMSI: {vessel.mmsi}</span>}
                  {!vessel.mmsi && <span>Vessel ID: {vessel.id}</span>}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vessel.vessel_status)}`}>
            {getStatusIcon(vessel.vessel_status)}
            {getStatusDisplayText(vessel.vessel_status)}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 bg-gray-800/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'movement' | 'details' | 'mission')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Current Position */}
              {vessel.positions && vessel.positions.length > 0 && (
                <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-300 text-sm font-medium">Current Position</span>
                  </div>
                  <div className="text-sm text-blue-100">
                    <div>Lat: {vessel.positions[vessel.positions.length - 1].latitude.toFixed(4)}°</div>
                    <div>Lng: {vessel.positions[vessel.positions.length - 1].longitude.toFixed(4)}°</div>
                    <div className="text-blue-300 mt-1">
                      {formatTimestamp(vessel.positions[vessel.positions.length - 1].timestamp_utc)}
                    </div>
                  </div>
                </div>
              )}

              {/* Vessel Image */}
              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaImage className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Vessel Image</span>
                </div>
                <div className="flex justify-center">
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-purple-500/30">
                    <Image
                      src={vessel.image_url || '/vessels/no-photo.png'}
                      alt={vessel.name}
                      fill
                      sizes="128px"
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/vessels/no-photo.png';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Origin Information */}
              {vessel.origin && (
                <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FaFlag className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 text-sm font-medium">Sailing Origin</span>
                  </div>
                  <div className="text-sm text-yellow-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(getVesselOrigin(vessel))}</span>
                      <span>{getVesselOrigin(vessel)}</span>
                    </div>
                    <div className="text-yellow-300 mt-1 text-xs">
                      Port: {vessel.origin}
                    </div>
                  </div>
                </div>
              )}

              {/* Current Speed & Course */}
              <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaTachometerAlt className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-300 text-sm font-medium">Current Navigation</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-orange-400">Speed:</span>
                    <div className="text-orange-100">{formatSpeed(vessel.speed_kmh, 'kmh')}</div>
                    <div className="text-orange-300 text-xs">{formatSpeed(vessel.speed_knots, 'knots')}</div>
                  </div>
                  <div>
                    <span className="text-orange-400">Course:</span>
                    <div className="text-orange-100">{formatCourse(vessel.course)}</div>
                  </div>
                </div>
              </div>

              {/* Vessel Statistics */}
              {stats && (
                <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FaTachometerAlt className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm font-medium">Statistics</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-green-400">Total Distance:</span>
                      <div className="text-green-100">{stats.distanceTraveled.toFixed(1)} km</div>
                    </div>
                    <div>
                      <span className="text-green-400">Avg Speed:</span>
                      <div className="text-green-100">{stats.averageSpeed.toFixed(1)} km/h</div>
                    </div>
                    <div>
                      <span className="text-green-400">Time at Sea:</span>
                      <div className="text-green-100">{Math.round(stats.timeAtSea)} hours</div>
                    </div>
                    <div>
                      <span className="text-green-400">Data Points:</span>
                      <div className="text-green-100">{stats.totalPositions}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'movement' && (
            <div className="space-y-4">
              {/* Movement History */}
              <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaTachometerAlt className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">Movement History</span>
                </div>
                <div className="space-y-2 text-sm">
                  {vessel.positions && vessel.positions.slice(-5).reverse().map((position, index) => (
                    <div key={index} className="flex justify-between items-center text-yellow-100">
                      <span>
                        {position.latitude.toFixed(3)}°, {position.longitude.toFixed(3)}°
                      </span>
                      <span className="text-yellow-300 text-xs">
                        {formatTimestamp(position.timestamp_utc)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Vessel Details */}
              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaShip className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Vessel Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-400">Name:</span>
                    <span className="text-purple-100">{vessel.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">MMSI:</span>
                    <span className="text-purple-100">{vessel.mmsi || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">Status:</span>
                    <span className="text-purple-100">{vessel.vessel_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">Start Date:</span>
                    <span className="text-purple-100">{vessel.start_date}</span>
                  </div>
                  {vessel.type && (
                    <div className="flex justify-between">
                      <span className="text-purple-400">Type:</span>
                      <span className="text-purple-100">{vessel.type}</span>
                    </div>
                  )}
                  {vessel.origin && (
                    <div className="flex justify-between">
                      <span className="text-purple-400">Origin:</span>
                      <span className="text-purple-100">{getVesselOrigin(vessel)} ({vessel.origin})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MarineTraffic Link */}
              {vessel.marinetraffic_shipid && (
                <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExternalLinkAlt className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-300 text-sm font-medium">External Tracking</span>
                  </div>
                  <div className="text-sm">
                    <a
                      href={`https://www.marinetraffic.com/en/ais/details/ships/${vessel.marinetraffic_shipid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-200 hover:text-blue-100 underline flex items-center gap-1"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                      View on MarineTraffic
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mission' && (
            <div className="space-y-4">
              {/* Mission Timeline */}
              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaCalendarAlt className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Mission Timeline</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-400">Mission Start</span>
                    <span className="text-purple-100">{formatTimestamp(vessel.date_created)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">Last Update</span>
                    <span className="text-purple-100">{formatTimestamp(vessel.date_updated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">Data Points</span>
                    <span className="text-purple-100">{stats?.totalPositions || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Version - Compact */}
      <div className="md:hidden bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 w-64 max-h-[30vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full border border-white shadow-lg flex items-center justify-center ${
                vessel.vessel_status === 'preparing' ? 'bg-gray-400' :
                vessel.vessel_status === 'completed' ? 'bg-green-500' :
                vessel.vessel_status === 'sailing' ? 'bg-blue-500' :
                'bg-blue-500'
              }`}>
                {getStatusIcon(vessel.vessel_status)}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{vessel.name}</h3>
                <p className="text-xs text-gray-400">MMSI: {vessel.mmsi}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(vessel.vessel_status)}`}>
            {getStatusIcon(vessel.vessel_status)}
            {getStatusDisplayText(vessel.vessel_status)}
          </div>
        </div>

        {/* Content - Simplified for Mobile */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Current Position */}
          {vessel.positions && vessel.positions.length > 0 && (
            <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
              <div className="flex items-center gap-1 mb-1">
                <FaMapMarkerAlt className="w-3 h-3 text-blue-400" />
                <span className="text-blue-300 text-xs font-medium">Position</span>
              </div>
              <div className="text-xs text-blue-100">
                <div>{vessel.positions[vessel.positions.length - 1].latitude.toFixed(3)}°, {vessel.positions[vessel.positions.length - 1].longitude.toFixed(3)}°</div>
                <div className="text-blue-300 mt-1">
                  {formatTimestampMobile(vessel.positions[vessel.positions.length - 1].timestamp_utc)}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {stats && (
            <div className="bg-green-900/20 rounded-lg p-2 border border-green-500/20">
              <div className="flex items-center gap-1 mb-1">
                <FaTachometerAlt className="w-3 h-3 text-green-400" />
                <span className="text-green-300 text-xs font-medium">Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-green-400">Distance:</span>
                  <div className="text-green-100">{stats.distanceTraveled.toFixed(0)} km</div>
                </div>
                <div>
                  <span className="text-green-400">Speed:</span>
                  <div className="text-green-100">{stats.averageSpeed.toFixed(0)} km/h</div>
                </div>
                <div>
                  <span className="text-green-400">Time:</span>
                  <div className="text-green-100">{Math.round(stats.timeAtSea)}h</div>
                </div>
                <div>
                  <span className="text-green-400">Points:</span>
                  <div className="text-green-100">{stats.totalPositions}</div>
                </div>
              </div>
            </div>
          )}

          {/* Mission Info */}
          <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
            <div className="flex items-center gap-1 mb-1">
              <FaCalendarAlt className="w-3 h-3 text-purple-400" />
              <span className="text-purple-300 text-xs font-medium">Mission</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-purple-400">Started:</span>
                <span className="text-purple-100">{formatTimestampMobile(vessel.date_created)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Updated:</span>
                <span className="text-purple-100">{formatTimestampMobile(vessel.date_updated)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}