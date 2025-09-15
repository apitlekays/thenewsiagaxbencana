// Enhanced vessel data types for the Sumud Nusantara tracking system

export interface VesselPosition {
  latitude: number;
  longitude: number;
  timestamp_utc: string;
  course?: number | null;
  speed_kmh?: number | null;
  speed_knots?: number | null;
}

export interface VesselDetailsData {
  mmsi: string;
  name: string;
  // Enhanced fields from GSF API
  origin?: string | null;
  speed_kmh?: number | null;
  speed_knots?: number | null;
  course?: number | null;
  type?: string | null;
  image_url?: string | null;
  marinetraffic_shipid?: string | null;
  positions?: Array<{ latitude: number; longitude: number; timestamp_utc: string }>;
  timestamp?: string | null;
  vessel_status?: string | null;
}

export interface EnhancedVessel {
  // Core vessel data from current API
  id: number;
  status: string;
  user_created: string;
  date_created: string;
  user_updated: string;
  date_updated: string;
  name: string;
  mmsi: string;
  start_date: string;
  positions: VesselPosition[];
  datalastic_positions: string | null;
  marinetraffic_positions: string | null;
  positions_sources: string[];
  update_sources: string[];
  marinetraffic_shipid: string | null;
  latitude: string;
  longitude: string;
  timestamp: string;
  image: string | null;
  vessel_status: string;
  icao: string | null;
  aircraft_registration: string | null;
  devices: number[];
  firstDataTime?: Date;
  
  // New GSF API fields
  origin?: string | null;
  speed_kmh?: number | null;
  speed_knots?: number | null;
  course?: number | null;
  type?: string | null;
  image_url?: string | null;
  
  // Enhanced data from siagax.com API
  vesselDetails?: VesselDetailsData;
  
  // Computed properties
  currentPosition?: VesselPosition;
  totalDistance?: number;
  averageSpeed?: number;
  estimatedArrival?: Date;
  missionProgress?: number; // Percentage to Gaza
}

export interface VesselDetailsPanelProps {
  vessel: EnhancedVessel | null;
  isVisible: boolean;
  onClose: () => void;
}

export interface VesselStats {
  totalPositions: number;
  distanceTraveled: number;
  averageSpeed: number;
  currentSpeed: number;
  currentCourse: number;
  timeAtSea: number;
  estimatedTimeToGaza: number;
}

// Timeline Event Types
export interface TimelineEvent {
  timestamp_utc: string;
  event_type: string;
  title: string;
  description: string;
  location: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  source_url?: string;
  icon: string;
  category: string;
}

export type EventSeverity = 'info' | 'warning' | 'critical' | 'success';
export type EventIcon = 'plane' | 'ship' | 'warning' | 'info' | 'check' | 'exclamation' | 'clock' | 'map' | 'users' | 'shield';

// Vessel Status Types
export type VesselStatus = 'sailing' | 'repairing' | 'attacked' | 'emergency' | 'disabled' | 'preparing' | 'completed';

export interface VesselStatusData {
  mmsi: string;
  status: VesselStatus;
  datetime: string;
}
