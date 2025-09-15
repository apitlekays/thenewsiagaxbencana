// Helper function to determine vessel origin country based on GSF API origin field
// Falls back to position-based calculation if origin field is not available
export function getVesselOrigin(vessel: { origin?: string | null; positions?: Array<{ latitude: number; longitude: number; timestamp_utc: string }> }): 'Spain' | 'Italy' | 'Tunisia' | 'Greece' | 'Unknown' {
  // First, try to use the GSF API origin field
  if (vessel.origin) {
    const origin = vessel.origin.toLowerCase();
    
    switch (origin) {
      case 'barcelona':
        return 'Spain';
      case 'sicily':
        return 'Italy';
      case 'tunis':
        return 'Tunisia';
      case 'greece':
        return 'Greece';
      default:
        return 'Unknown';
    }
  }

  // Fallback to position-based calculation if origin field is not available
  if (!vessel.positions || vessel.positions.length === 0) {
    return 'Unknown';
  }

  const firstPosition = vessel.positions[0];
  const lat = firstPosition.latitude;
  const lng = firstPosition.longitude;

  // Spain regions
  if (lat >= 41.0 && lat <= 41.5 && lng >= 2.0 && lng <= 2.5) {
    return 'Spain'; // Barcelona area
  }
  if (lat >= 39.5 && lat <= 40.5 && lng >= 3.0 && lng <= 4.5) {
    return 'Spain'; // Menorca area
  }
  if (lat >= 38.5 && lat <= 39.0 && lng >= 6.0 && lng <= 7.0) {
    return 'Spain'; // Spanish Mediterranean waters
  }

  // Italy regions
  if (lat >= 37.0 && lat <= 37.5 && lng >= 15.0 && lng <= 15.5) {
    return 'Italy'; // Augusta/Sicily area
  }

  // Tunisia region (for vessels currently in Tunisian waters)
  if (lat >= 36.8 && lat <= 37.5 && lng >= 9.5 && lng <= 11.0) {
    return 'Tunisia'; // Tunisian waters
  }

  // Greece region
  if (lat >= 37.0 && lat <= 40.0 && lng >= 20.0 && lng <= 30.0) {
    return 'Greece'; // Greek waters
  }

  return 'Unknown';
}

// Color mapping for vessel origins
export const VESSEL_ORIGIN_COLORS = {
  Spain: 'yellow',
  Italy: 'green', 
  Tunisia: 'purple',
  Greece: 'blue',
  Unknown: 'gray'
} as const;

export type VesselOrigin = keyof typeof VESSEL_ORIGIN_COLORS;

// Helper function to get vessel marker color based on origin
export function getVesselMarkerColor(vessel: { origin?: string; positions?: Array<{ latitude: number; longitude: number; timestamp_utc: string }> }): string {
  const origin = getVesselOrigin(vessel);
  return VESSEL_ORIGIN_COLORS[origin];
}

// Helper function to get vessel marker color class for Tailwind CSS
export function getVesselMarkerColorClass(vessel: { origin?: string; positions?: Array<{ latitude: number; longitude: number; timestamp_utc: string }> }): string {
  const origin = getVesselOrigin(vessel);
  
  switch (origin) {
    case 'Spain':
      return 'bg-yellow-500';
    case 'Italy':
      return 'bg-green-500';
    case 'Tunisia':
      return 'bg-purple-500';
    case 'Greece':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

// Helper function to get vessel marker border color class
export function getVesselMarkerBorderClass(vessel: { origin?: string; positions?: Array<{ latitude: number; longitude: number; timestamp_utc: string }> }): string {
  const origin = getVesselOrigin(vessel);
  
  switch (origin) {
    case 'Spain':
      return 'border-yellow-300';
    case 'Italy':
      return 'border-green-300';
    case 'Tunisia':
      return 'border-purple-300';
    case 'Greece':
      return 'border-blue-300';
    default:
      return 'border-gray-300';
  }
}
