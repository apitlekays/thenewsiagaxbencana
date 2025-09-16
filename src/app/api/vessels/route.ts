import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only when environment variables are available
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Check query parameters for optimization
    const isInitialLoad = searchParams.get('initial') === 'true';
    const vesselId = searchParams.get('vesselId');
    const includeDecommissioned = searchParams.get('include_decommissioned') === 'true';
    
    // Build query for vessels
    let vesselsQuery = supabase
      .from('vessels')
      .select('*')
      .order('updated_at', { ascending: false });
    
    // Only fetch active vessels unless explicitly requested
    if (!includeDecommissioned) {
      vesselsQuery = vesselsQuery.eq('status', 'active');
    }
    
    const { data: vessels, error: vesselsError } = await vesselsQuery;

    if (vesselsError) {
      console.error('Error fetching vessels:', vesselsError);
      return NextResponse.json(
        { error: 'Failed to fetch vessels data' },
        { status: 500 }
      );
    }

    // Smart position fetching based on request type
    let allPositions: Array<{
      gsf_vessel_id: number;
      latitude: string;
      longitude: string;
      timestamp_utc: string;
      course: string | null;
      speed_kmh: string | null;
      speed_knots: string | null;
    }> = [];

    if (isInitialLoad) {
      // Step 1: Get latest 100 positions for initial map load
      const { data: latestPositions, error: latestError } = await supabase
        .from('vessel_positions')
        .select('gsf_vessel_id, latitude, longitude, timestamp_utc, course, speed_kmh, speed_knots')
        .order('timestamp_utc', { ascending: false })
        .limit(100);

      if (latestError) {
        console.error('Error fetching latest positions:', latestError);
        return NextResponse.json(
          { error: 'Failed to fetch latest positions data' },
          { status: 500 }
        );
      }

      allPositions = latestPositions || [];
      
    } else if (vesselId) {
      // For specific vessel: Get all its positions
      const { data: positions, error: positionsError } = await supabase
        .from('vessel_positions')
        .select('gsf_vessel_id, latitude, longitude, timestamp_utc, course, speed_kmh, speed_knots')
        .eq('gsf_vessel_id', parseInt(vesselId))
        .order('timestamp_utc', { ascending: true });

      if (positionsError) {
        console.error('Error fetching vessel positions:', positionsError);
        return NextResponse.json(
          { error: 'Failed to fetch vessel positions data' },
          { status: 500 }
        );
      }
      
      allPositions = positions || [];
      
    } else {
      // For full data request: Use pagination to get all data
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: positions, error: positionsError } = await supabase
          .from('vessel_positions')
          .select('gsf_vessel_id, latitude, longitude, timestamp_utc, course, speed_kmh, speed_knots')
          .order('timestamp_utc', { ascending: true })
          .range(from, from + pageSize - 1);

        if (positionsError) {
          console.error('Error fetching positions:', positionsError);
          return NextResponse.json(
            { error: 'Failed to fetch positions data' },
            { status: 500 }
          );
        }

        if (positions && positions.length > 0) {
          allPositions = allPositions.concat(positions);
          from += pageSize;
          hasMore = positions.length === pageSize;
        } else {
          hasMore = false;
        }
      }
    }

    const positions = allPositions;

    if (!positions) {
      console.error('Positions query returned null');
      return NextResponse.json(
        { error: 'Positions query returned null' },
        { status: 500 }
      );
    }

    // Group positions by vessel
    const positionsByVessel = positions?.reduce((acc, pos) => {
      if (!acc[pos.gsf_vessel_id]) {
        acc[pos.gsf_vessel_id] = [];
      }
      acc[pos.gsf_vessel_id].push({
        latitude: parseFloat(pos.latitude),
        longitude: parseFloat(pos.longitude),
        timestamp_utc: pos.timestamp_utc,
        course: pos.course ? parseFloat(pos.course) : null,
        speed_kmh: pos.speed_kmh ? parseFloat(pos.speed_kmh) : null,
        speed_knots: pos.speed_knots ? parseFloat(pos.speed_knots) : null
      });
      return acc;
    }, {} as Record<number, Array<{
      latitude: number;
      longitude: number;
      timestamp_utc: string;
      course: number | null;
      speed_kmh: number | null;
      speed_knots: number | null;
    }>>) || {};

    // Transform data to match the expected Vessel interface
    const transformedVessels = vessels.map(vessel => ({
      id: vessel.gsf_id,
      status: 'published',
      user_created: '',
      date_created: vessel.created_at,
      user_updated: '',
      date_updated: vessel.updated_at,
      name: vessel.name,
      mmsi: vessel.mmsi || '',
      start_date: vessel.start_date || '',
      positions: positionsByVessel[vessel.gsf_id] || [],
      datalastic_positions: null,
      marinetraffic_positions: null,
      positions_sources: ['supabase'],
      update_sources: ['supabase'],
      marinetraffic_shipid: vessel.marinetraffic_shipid,
      latitude: vessel.latitude?.toString() || '',
      longitude: vessel.longitude?.toString() || '',
      timestamp: vessel.timestamp_utc || '',
      image: vessel.image_url,
      vessel_status: vessel.vessel_status || '',
      origin: vessel.origin || null,
      icao: null,
      aircraft_registration: null,
      devices: [],
      // New GSF API fields
      speed_kmh: vessel.speed_kmh ? parseFloat(vessel.speed_kmh) : null,
      speed_knots: vessel.speed_knots ? parseFloat(vessel.speed_knots) : null,
      course: vessel.course ? parseFloat(vessel.course) : null,
      type: vessel.type || null,
      image_url: vessel.image_url || null
    }));

    return NextResponse.json(transformedVessels, {
      headers: {
        'Cache-Control': isInitialLoad ? 'public, max-age=60' : 'public, max-age=300', // Shorter cache for initial load
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Data-Type': isInitialLoad ? 'initial' : vesselId ? 'vessel-specific' : 'full',
        'X-Position-Count': positions.length.toString(),
        'X-Vessel-Count': transformedVessels.length.toString(),
        'X-Include-Decommissioned': includeDecommissioned.toString(),
        'X-Response-Size': JSON.stringify(transformedVessels).length.toString(),
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
