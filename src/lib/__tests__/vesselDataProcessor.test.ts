import { parseVesselPositions, processVesselData } from '@/lib/vesselDataProcessor'

// Mock sample GSF data structure
const mockGSFVessel = {
  id: 123,
  name: 'Test Vessel',
  mmsi: '123456789',
  positions: JSON.stringify([
    {
      latitude: 35.0,
      longitude: 20.0,
      speed_knots: 12.5,
      course: 180,
      timestamp_utc: '2025-01-19T10:00:00Z',
    },
    {
      latitude: 35.1,
      longitude: 20.1,
      speed_knots: 13.0,
      course: 185,
      timestamp_utc: '2025-01-19T11:00:00Z',
    },
  ]),
  vessel_status: 'sailing',
  origin: 'barcelona',
  type: 'cargo',
}

describe('Vessel Data Processing Integration Tests', () => {
  describe('parseVesselPositions', () => {
    it('should parse positions JSON string correctly', () => {
      const positions = parseVesselPositions(mockGSFVessel.positions)
      
      expect(positions).toHaveLength(2)
      expect(positions[0]).toEqual({
        latitude: 35.0,
        longitude: 20.0,
        speed_knots: 12.5,
        course: 180,
        timestamp_utc: '2025-01-19T10:00:00Z',
      })
      expect(positions[1]).toEqual({
        latitude: 35.1,
        longitude: 20.1,
        speed_knots: 13.0,
        course: 185,
        timestamp_utc: '2025-01-19T11:00:00Z',
      })
    })

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'invalid json string'
      const positions = parseVesselPositions(invalidJson)
      
      expect(positions).toEqual([])
    })

    it('should handle null/undefined positions', () => {
      expect(parseVesselPositions(null)).toEqual([])
      expect(parseVesselPositions(undefined)).toEqual([])
      expect(parseVesselPositions('')).toEqual([])
    })

    it('should handle empty positions array', () => {
      const emptyPositions = JSON.stringify([])
      const positions = parseVesselPositions(emptyPositions)
      
      expect(positions).toEqual([])
    })

    it('should handle malformed position objects', () => {
      const malformedPositions = JSON.stringify([
        { latitude: 35.0 }, // missing required fields
        { longitude: 20.0 }, // missing latitude
        null, // null entry
      ])
      const positions = parseVesselPositions(malformedPositions)
      
      // Should filter out invalid entries
      expect(positions).toHaveLength(0)
    })
  })

  describe('processVesselData', () => {
    it('should process vessel data correctly', () => {
      const processed = processVesselData(mockGSFVessel)
      
      expect(processed).toEqual({
        gsf_id: 123,
        name: 'Test Vessel',
        mmsi: '123456789',
        latitude: 35.1, // Latest position
        longitude: 20.1, // Latest position
        timestamp_utc: '2025-01-19T11:00:00Z', // Latest timestamp
        vessel_status: 'sailing',
        origin: 'barcelona',
        type: 'cargo',
        speed_kmh: 24.08, // Converted from knots
        speed_knots: 13.0, // Latest speed
        course: 185, // Latest course
        status: 'active',
      })
    })

    it('should handle vessel with no positions', () => {
      const vesselWithoutPositions = {
        ...mockGSFVessel,
        positions: JSON.stringify([]),
      }
      
      const processed = processVesselData(vesselWithoutPositions)
      
      expect(processed.latitude).toBeUndefined()
      expect(processed.longitude).toBeUndefined()
      expect(processed.timestamp_utc).toBeUndefined()
      expect(processed.speed_knots).toBeUndefined()
      expect(processed.course).toBeUndefined()
    })

    it('should handle vessel with single position', () => {
      const singlePosition = {
        ...mockGSFVessel,
        positions: JSON.stringify([
          {
            latitude: 35.0,
            longitude: 20.0,
            speed_knots: 12.5,
            course: 180,
            timestamp_utc: '2025-01-19T10:00:00Z',
          },
        ]),
      }
      
      const processed = processVesselData(singlePosition)
      
      expect(processed.latitude).toBe(35.0)
      expect(processed.longitude).toBe(20.0)
      expect(processed.speed_knots).toBe(12.5)
      expect(processed.course).toBe(180)
    })

    it('should convert speed from knots to km/h correctly', () => {
      const processed = processVesselData(mockGSFVessel)
      
      // 13.0 knots * 1.852 = 24.076 km/h
      expect(processed.speed_kmh).toBeCloseTo(24.076, 2)
    })

    it('should handle missing optional fields', () => {
      const minimalVessel = {
        id: 123,
        name: 'Minimal Vessel',
        positions: JSON.stringify([
          {
            latitude: 35.0,
            longitude: 20.0,
            timestamp_utc: '2025-01-19T10:00:00Z',
          },
        ]),
        vessel_status: 'sailing',
      }
      
      const processed = processVesselData(minimalVessel)
      
      expect(processed.gsf_id).toBe(123)
      expect(processed.name).toBe('Minimal Vessel')
      expect(processed.mmsi).toBeUndefined()
      expect(processed.origin).toBeUndefined()
      expect(processed.type).toBeUndefined()
      expect(processed.speed_knots).toBeUndefined()
      expect(processed.course).toBeUndefined()
    })
  })

  describe('Edge Function Integration Scenarios', () => {
    it('should handle batch processing of multiple vessels', () => {
      const vessels = [
        mockGSFVessel,
        {
          ...mockGSFVessel,
          id: 456,
          name: 'Second Vessel',
          positions: JSON.stringify([
            {
              latitude: 36.0,
              longitude: 21.0,
              speed_knots: 15.0,
              course: 90,
              timestamp_utc: '2025-01-19T12:00:00Z',
            },
          ]),
        },
      ]
      
      const processedVessels = vessels.map(processVesselData)
      
      expect(processedVessels).toHaveLength(2)
      expect(processedVessels[0].gsf_id).toBe(123)
      expect(processedVessels[1].gsf_id).toBe(456)
      expect(processedVessels[0].name).toBe('Test Vessel')
      expect(processedVessels[1].name).toBe('Second Vessel')
    })

    it('should handle vessels with different statuses', () => {
      const sailingVessel = {
        ...mockGSFVessel,
        vessel_status: 'sailing',
      }
      
      const dockedVessel = {
        ...mockGSFVessel,
        id: 789,
        vessel_status: 'docked',
      }
      
      const processedSailing = processVesselData(sailingVessel)
      const processedDocked = processVesselData(dockedVessel)
      
      expect(processedSailing.vessel_status).toBe('sailing')
      expect(processedDocked.vessel_status).toBe('docked')
      expect(processedSailing.status).toBe('active')
      expect(processedDocked.status).toBe('active')
    })

    it('should handle vessels with different origins', () => {
      const origins = ['barcelona', 'sicily', 'cyprus', 'unknown']
      
      origins.forEach((origin, index) => {
        const vessel = {
          ...mockGSFVessel,
          id: 100 + index,
          origin,
        }
        
        const processed = processVesselData(vessel)
        expect(processed.origin).toBe(origin)
      })
    })
  })
})

// Helper functions for testing (these would be extracted from the Edge Function)
function parseVesselPositions(positionsJson: string | null | undefined) {
  if (!positionsJson) return []
  
  try {
    const positions = JSON.parse(positionsJson)
    if (!Array.isArray(positions)) return []
    
    return positions.filter(pos => 
      pos && 
      typeof pos.latitude === 'number' && 
      typeof pos.longitude === 'number' &&
      pos.timestamp_utc
    )
  } catch {
    return []
  }
}

function processVesselData(vessel: { positions: string; latitude: string; longitude: string; timestamp_utc: string }) {
  const positions = parseVesselPositions(vessel.positions)
  const latestPosition = positions[positions.length - 1]
  
  const processed = {
    gsf_id: vessel.id,
    name: vessel.name,
    mmsi: vessel.mmsi,
    vessel_status: vessel.vessel_status,
    origin: vessel.origin,
    type: vessel.type,
    status: 'active',
  }
  
  if (latestPosition) {
    processed.latitude = latestPosition.latitude
    processed.longitude = latestPosition.longitude
    processed.timestamp_utc = latestPosition.timestamp_utc
    processed.speed_knots = latestPosition.speed_knots
    processed.course = latestPosition.course
    
    if (latestPosition.speed_knots) {
      processed.speed_kmh = latestPosition.speed_knots * 1.852
    }
  }
  
  return processed
}
