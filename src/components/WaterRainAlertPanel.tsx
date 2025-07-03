import { useCurrentAlerts } from '@/hooks/useCurrentAlerts';
import { FaBell, FaChevronRight, FaWater, FaCloudRain, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useMap } from '@/contexts/MapContext';
import { getSeverityBadge } from '../utils/getSeverityBadge';
import { useState, useEffect } from 'react';

interface Alert {
  station_id: string;
  station_name: string;
  state: string;
  wl_severity_level: string;
  wl_date_timeAlert?: string;
  rf_date_timeAlert?: string;
  clean_water_level?: string;
  trend?: string;
  rf1hour?: string;
  rf_severity_level?: string;
  latitude?: string;
  longitude?: string;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const [d, t] = dateStr.split(' ');
  if (!d || !t) return '';
  const [day, month, year] = d.split('/').map(Number);
  const [hour, min] = t.split(':').map(Number);
  const dt = new Date(year, month - 1, day, hour, min);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMin = Math.floor(diffMs / 300000);
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 minute ago';
  return `${diffMin} minutes ago`;
}

function getSeverityBorder(severity: string) {
  if (severity === 'Danger' || severity?.toLowerCase() === 'very heavy') return 'border-l-4 border-red-400';
  if (severity === 'Warning' || severity?.toLowerCase() === 'heavy') return 'border-l-4 border-orange-400';
  if (severity === 'Alert' || severity?.toLowerCase() === 'moderate') return 'border-l-4 border-yellow-400';
  return 'border-l-4 border-green-400';
}

export default function WaterRainAlertPanel() {
  const alerts = useCurrentAlerts(300000);
  const { zoomToLocation, showIncidentDetails } = useMap();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    window.addEventListener('refresh-map-data', handleRefresh);
    return () => window.removeEventListener('refresh-map-data', handleRefresh);
  }, []);

  const handleAlertClick = (alert: Alert) => {
    // Check if we have latitude and longitude data
    if (alert.latitude && alert.longitude) {
      const lat = parseFloat(alert.latitude);
      const lng = parseFloat(alert.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        zoomToLocation(lat, lng, 12);
        showIncidentDetails(alert);
      }
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideRight {
          0% { transform: translateX(0); }
          50% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        
        .alert-card {
          transition: all 0.3s ease;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        
        .alert-card:hover {
          transform: translateX(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .alert-card:hover .chevron-animate {
          animation: slideRight 1s ease-in-out infinite;
        }
      `}</style>
      <div className={`fixed left-6 top-18 z-41 w-[328px] flex items-center justify-between px-5 py-2 border-b border-gray-700 bg-gray-900/80 shadow transition-all duration-300 ${isRefreshing ? 'bg-blue-900/80' : ''}`}>
        <div className="flex items-center gap-2">
          <FaBell className={`text-lg transition-colors duration-300 ${isRefreshing ? 'text-blue-400 animate-pulse' : 'text-white'}`} />
          <span className="text-white font-bold text-base tracking-wide">Realtime Alerts</span>
        </div>
        <div className="relative">
          <span className={`-top-2 right-1 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow transition-colors duration-300 ${isRefreshing ? 'bg-blue-600' : 'bg-red-600'}`}>{alerts.length}</span>
        </div>
      </div>
      <div className="fixed left-6 top-28 z-40 w-[328px] h-[85vh] overflow-y-auto flex flex-col gap-3 px-3 py-2 pointer-events-auto ">
        {/* Alerts */}
        <div className="flex flex-col gap-3 pb-2">
          {alerts.length === 0 && (
            <div className="text-gray-300 text-center">No current alerts.</div>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.station_id}
              className={`alert-card rounded-sm bg-gray-900/60 shadow-lg border-0 overflow-hidden ${getSeverityBorder(alert.wl_severity_level || alert.rf_severity_level)}`}
              onClick={() => handleAlertClick(alert)}
            >
              {/* Header Section */}
              <div className="p-3 pb-2">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FaMapMarkerAlt className="text-blue-400 text-xs flex-shrink-0" />
                      <h3 className="text-white font-semibold text-sm truncate">{alert.station_name}</h3>
                    </div>
                    <div className="text-gray-400 text-xs">{alert.state}</div>
                  </div>
                  {(() => {
                    const severity = alert.wl_severity_level || alert.rf_severity_level;
                    const badgeClass = getSeverityBadge(severity);
                    // Extract text color from badgeClass
                    let iconColor = 'text-green-300';
                    if (badgeClass.includes('text-red-300')) iconColor = 'text-red-300';
                    else if (badgeClass.includes('text-orange-300')) iconColor = 'text-orange-300';
                    else if (badgeClass.includes('text-yellow-300')) iconColor = 'text-yellow-300';
                    return (
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${badgeClass}`}>
                        {alert.wl_severity_level
                          ? (<><FaWater className={`inline-block ${iconColor} text-xs mr-1`} />{alert.wl_severity_level}</>)
                          : alert.rf_severity_level
                            ? (<><FaCloudRain className={`inline-block ${iconColor} text-xs mr-1`} />{alert.rf_severity_level}</>)
                            : 'N/A'}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Timestamp */}
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <FaClock className="text-gray-500" />
                  <span>{timeAgo(alert.wl_date_timeAlert || alert.rf_date_timeAlert)}</span>
                </div>
              </div>

              {/* Data Section */}
              <div className="px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* Water Level */}
                  <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <FaWater className="text-blue-400 text-xs" />
                      <span className="text-blue-300 text-xs font-medium">Water Level (m)</span>
                    </div>
                    <div className="text-blue-100 text-base font-bold mb-0.5">{alert.clean_water_level || 'N/A'}</div>
                    <div className="text-blue-400/70 text-xs">Trend: {alert.trend || 'N/A'}</div>
                  </div>
                  
                  {/* Rainfall */}
                  <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <FaCloudRain className="text-purple-400 text-xs" />
                      <span className="text-purple-300 text-xs font-medium">Rainfall (mm)</span>
                    </div>
                    <div className="text-purple-100 text-base font-bold mb-0.5">{alert.rf1hour || 'N/A'}</div>
                    <div className="text-purple-400/70 text-xs">Severity: {alert.rf_severity_level || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-3 pb-3">
                <button 
                  className="chevron-animate w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-gray-300 hover:text-white text-xs font-medium"
                  onClick={() => handleAlertClick(alert)}
                >
                  <span>View Details</span>
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 