import React from 'react';
import { X, ExternalLink, MapPin, Calendar, AlertTriangle, Flame, Plane, Shield, Zap, Clock, Tag } from 'lucide-react';
import { IncidentData } from '@/hooks/useIncidentData';

interface IncidentPopupProps {
  incident: IncidentData;
  isVisible: boolean;
  onClose: () => void;
  showContinueButton?: boolean;
  onContinue?: () => void;
}

export default function IncidentPopup({ 
  incident, 
  isVisible, 
  onClose, 
  showContinueButton = false,
  onContinue 
}: IncidentPopupProps) {
  if (!isVisible) return null;

  // Professional data processing functions
  const formatEventType = (eventType: string): string => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatCategory = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return {
          color: 'bg-red-600 border-red-500',
          text: 'Critical',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          color: 'bg-orange-500 border-orange-400',
          text: 'Warning',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        };
      default:
        return {
          color: 'bg-gray-600 border-gray-500',
          text: 'Unknown',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getIncidentIcon = (iconType: string) => {
    switch (iconType.toLowerCase()) {
      case 'fire':
        return <Flame className="w-6 h-6" />;
      case 'plane':
        return <Plane className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'safety':
        return <AlertTriangle className="w-4 h-4" />;
      case 'operational':
        return <Zap className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return {
        full: date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        date: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      };
    } catch {
      return {
        full: timestamp,
        date: timestamp,
        time: timestamp
      };
    }
  };

  const severityConfig = getSeverityConfig(incident.severity);
  const timestamp = formatTimestamp(incident.timestamp_utc);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-[100]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-lg ${severityConfig.color} flex items-center justify-center text-white shadow-md`}>
              {getIncidentIcon(incident.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{incident.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.bgColor} ${severityConfig.textColor} ${severityConfig.borderColor} border`}>
                  {severityConfig.text}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-600">{formatEventType(incident.event_type)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Incident Details Grid */}
          <div className="grid grid-cols-1 gap-3">
            {/* Event Type */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event Type</p>
                  <p className="text-sm font-semibold text-gray-900">{formatEventType(incident.event_type)}</p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                  {getCategoryIcon(incident.category)}
                  <span className="text-purple-600"></span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCategory(incident.category)}</p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</p>
                  <p className="text-sm font-semibold text-gray-900">{timestamp.date}</p>
                  <p className="text-xs text-gray-600">{timestamp.time}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-semibold text-gray-900">{incident.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                <Clock className="w-3 h-3 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{incident.description}</p>
              </div>
            </div>
          </div>

          {/* Source URL */}
          {incident.source_url && (
            <div className="bg-blue-50 rounded-lg p-3">
              <a
                href={incident.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-700 hover:text-blue-800 font-medium transition-colors text-sm"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View Source</span>
              </a>
            </div>
          )}
        </div>

        {/* Fixed Bottom Button (only for playback popup) */}
        {showContinueButton && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Continue Playback
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
