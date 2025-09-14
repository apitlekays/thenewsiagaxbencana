'use client';

import { FaTimes, FaExternalLinkAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { TimelineEvent } from '@/types/vessel';
import { getEventIcon } from '@/utils/eventIcons';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
}

export default function IncidentModal({ isOpen, onClose, event }: IncidentModalProps) {
  if (!isOpen || !event) return null;

  const EventIconComponent = getEventIcon(event.icon);

  // Get severity styling
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          titleColor: 'text-red-900'
        };
      case 'warning':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
          titleColor: 'text-orange-900'
        };
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          titleColor: 'text-green-900'
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          titleColor: 'text-blue-900'
        };
    }
  };

  const severityStyles = getSeverityStyles(event.severity);

  // Format timestamp
  const formatEventTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Get severity display text
  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critical Alert';
      case 'warning': return 'Warning';
      case 'success': return 'Success';
      case 'info': return 'Information';
      default: return 'Event';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${severityStyles.bgColor} ${severityStyles.borderColor} border-b p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Event Icon */}
              <div className={`w-12 h-12 ${severityStyles.bgColor} ${severityStyles.borderColor} border-2 rounded-xl flex items-center justify-center shadow-sm`}>
                <EventIconComponent className={`w-6 h-6 ${severityStyles.iconColor}`} />
              </div>
              
              {/* Event Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className={`text-xl font-bold ${severityStyles.titleColor}`}>
                    {event.title}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityStyles.badgeColor}`}>
                    {getSeverityText(event.severity)}
                  </span>
                </div>
                
                {/* Location and Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock className="w-4 h-4" />
                    <span>{formatEventTime(event.timestamp_utc)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Event Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
            
            {/* Event Metadata */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Event Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {event.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Severity:</span>
                    <span className={`font-medium capitalize ${severityStyles.iconColor}`}>
                      {event.severity}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Timeline Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(event.timestamp_utc).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(event.timestamp_utc).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">UTC:</span>
                    <span className="font-medium text-gray-900">
                      {event.timestamp_utc}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Source Link */}
            {event.source_url && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Additional Information</h4>
                <p className="text-sm text-blue-800 mb-3">
                  For more detailed information about this event, please refer to the official source.
                </p>
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FaExternalLinkAlt className="w-4 h-4" />
                  Read Full Report
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Global Sumud Flotilla Mission Timeline
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
