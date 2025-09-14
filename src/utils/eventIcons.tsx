import React from 'react';
import { 
  FaPlane, 
  FaShip, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaShieldAlt
} from 'react-icons/fa';
import { EventIcon } from '@/types/vessel';

// Icon mapping object - all icons are pre-imported for performance
export const EVENT_ICONS: Record<EventIcon, React.ComponentType<{ className?: string }>> = {
  plane: FaPlane,
  ship: FaShip,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
  check: FaCheckCircle,
  exclamation: FaExclamationCircle,
  clock: FaClock,
  map: FaMapMarkerAlt,
  users: FaUsers,
  shield: FaShieldAlt
};

// Fallback icon for unknown icons
const DEFAULT_ICON = FaInfoCircle;

/**
 * Get the appropriate React icon component for a given icon name
 * @param iconName - The icon name from the API
 * @returns React icon component
 */
export function getEventIcon(iconName: string): React.ComponentType<{ className?: string }> {
  // Normalize the icon name (lowercase, trim)
  const normalizedName = iconName.toLowerCase().trim() as EventIcon;
  
  // Return the mapped icon or fallback to default
  return EVENT_ICONS[normalizedName] || DEFAULT_ICON;
}

/**
 * Check if an icon name is valid/supported
 * @param iconName - The icon name to check
 * @returns boolean indicating if the icon is supported
 */
export function isValidEventIcon(iconName: string): boolean {
  const normalizedName = iconName.toLowerCase().trim() as EventIcon;
  return normalizedName in EVENT_ICONS;
}

/**
 * Get all supported icon names
 * @returns Array of supported icon names
 */
export function getSupportedEventIcons(): EventIcon[] {
  return Object.keys(EVENT_ICONS) as EventIcon[];
}
