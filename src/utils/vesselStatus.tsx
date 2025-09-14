import React from 'react';
import { 
  FaShip, 
  FaWrench, 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaBan,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';
import { VesselStatus } from '@/types/vessel';

// Icon mapping for vessel statuses
export const VESSEL_STATUS_ICONS: Record<VesselStatus, React.ComponentType<{ className?: string }>> = {
  sailing: FaShip,
  repairing: FaWrench,
  attacked: FaExclamationTriangle,
  emergency: FaExclamationCircle,
  disabled: FaBan,
  preparing: FaClock,
  completed: FaCheckCircle
};

// Color mapping for vessel statuses
export const VESSEL_STATUS_COLORS: Record<VesselStatus, string> = {
  sailing: 'bg-blue-500',
  repairing: 'bg-yellow-500',
  attacked: 'bg-red-500',
  emergency: 'bg-orange-500',
  disabled: 'bg-gray-500',
  preparing: 'bg-gray-400',
  completed: 'bg-green-500'
};

// Hover color mapping for vessel statuses
export const VESSEL_STATUS_HOVER_COLORS: Record<VesselStatus, string> = {
  sailing: 'hover:bg-blue-600',
  repairing: 'hover:bg-yellow-600',
  attacked: 'hover:bg-red-600',
  emergency: 'hover:bg-orange-600',
  disabled: 'hover:bg-gray-600',
  preparing: 'hover:bg-gray-500',
  completed: 'hover:bg-green-600'
};

// Display text for vessel statuses
export const VESSEL_STATUS_DISPLAY: Record<VesselStatus, string> = {
  sailing: 'Sailing to Gaza',
  repairing: 'Under Repair',
  attacked: 'Under Attack',
  emergency: 'Emergency',
  disabled: 'Disabled',
  preparing: 'Preparing',
  completed: 'Mission Completed'
};

// Pulsing statuses (statuses that should pulse on the map)
export const PULSING_STATUSES: Set<VesselStatus> = new Set([
  'repairing',
  'attacked', 
  'emergency',
  'disabled'
]);

// Get vessel status icon component
export function getVesselStatusIcon(status: VesselStatus): React.ComponentType<{ className?: string }> {
  return VESSEL_STATUS_ICONS[status] || VESSEL_STATUS_ICONS.sailing;
}

// Get vessel status color
export function getVesselStatusColor(status: VesselStatus): string {
  return VESSEL_STATUS_COLORS[status] || VESSEL_STATUS_COLORS.sailing;
}

// Get vessel status hover color
export function getVesselStatusHoverColor(status: VesselStatus): string {
  return VESSEL_STATUS_HOVER_COLORS[status] || VESSEL_STATUS_HOVER_COLORS.sailing;
}

// Get vessel status display text
export function getVesselStatusDisplay(status: VesselStatus): string {
  return VESSEL_STATUS_DISPLAY[status] || VESSEL_STATUS_DISPLAY.sailing;
}

// Check if status should pulse
export function shouldStatusPulse(status: VesselStatus): boolean {
  return PULSING_STATUSES.has(status);
}

// Get pulsing color for status
export function getPulsingColor(status: VesselStatus): string {
  switch (status) {
    case 'attacked':
      return 'bg-red-500';
    case 'emergency':
      return 'bg-orange-500';
    case 'repairing':
      return 'bg-yellow-500';
    case 'disabled':
      return 'bg-gray-500';
    default:
      return 'bg-blue-500';
  }
}
