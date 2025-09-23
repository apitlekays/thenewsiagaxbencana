import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration
const GSF_API_URL = 'https://data.forensic-architecture.org/items/freedom_flotilla_vessels?limit=1000';
const BATCH_SIZE = 5; // Process 5 vessels in parallel
const POSITION_BATCH_SIZE = 100; // Insert 100 positions per batch
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Types
interface Vessel {
  id: number;
  name: string;
  mmsi: string | null;
  start_date: string;
  latitude: string;
  longitude: string;
  image: string | null;
  vessel_status: string;
  origin: string;
  marinetraffic_shipid: string | null;
  speed_kmh: string;
  speed_knots: string;
  course: string;
  type: string;
  timestamp_utc: string;
  positions: string;
  date_created: string;
}

interface Position {
  latitude: number;
  longitude: number;
  speed_kmh: number;
  speed_knots: number;
  course: number;
  timestamp_utc: string;
}

interface ProcessingResult {
  success: boolean;
  vesselId?: number;
  positionCount?: number;
  error?: string;
}

// Utility functions
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      if (i === retries - 1) {
        throw new Error(`API request failed after ${retries} attempts: ${response.status}`);
      }
      
      console.log(`⚠️ API request failed (attempt ${i + 1}/${retries}), retrying in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY * (i + 1)); // Exponential backoff
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      console.log(`⚠️ API request error (attempt ${i + 1}/${retries}), retrying in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY * (i + 1));
    }
  }
  throw new Error('Max retries exceeded');
}

// Timeline frame generation function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateTimelineFramesFromGSFData(supabase: any, gsfVessels: Vessel[]) {
  console.log('🔄 Generating timeline frames from fresh GSF data...');
  
  // Group positions by vessel from fresh GSF data
  const vesselPositions: Record<string, Array<{
    timestamp: string;
    lat: number;
    lng: number;
    origin: string | null;
    course: number | null;
  }>> = {};

  gsfVessels.forEach((vessel) => {
    if (vessel.positions) {
      try {
        const positions: Position[] = JSON.parse(vessel.positions);
        const vesselName = vessel.name;
        
        if (!vesselPositions[vesselName]) {
          vesselPositions[vesselName] = [];
        }
        
        positions.forEach(position => {
          vesselPositions[vesselName].push({
            timestamp: position.timestamp_utc,
            lat: parseFloat(position.latitude.toString()),
            lng: parseFloat(position.longitude.toString()),
            origin: vessel.origin,
            course: position.course || null
          });
        });
      } catch (error) {
        console.error(`Error parsing positions for vessel ${vessel.name}:`, error);
      }
    }
  });

  console.log(`🚢 Processing ${Object.keys(vesselPositions).length} vessels from GSF data`);

  // Get all unique timestamps
  const allTimestamps = new Set<string>();
  Object.values(vesselPositions).forEach(positions => {
    positions.forEach(pos => allTimestamps.add(pos.timestamp));
  });

  const sortedTimestamps = Array.from(allTimestamps).sort();
  console.log(`⏰ Found ${sortedTimestamps.length} unique timestamps from GSF data`);

  // Generate timeline frames with improved sampling for better vessel coverage
  const timelineFrames: string[] = [];
  const now = new Date().getTime();
  const recentThreshold = 24 * 60 * 60 * 1000; // 24 hours
  const recentFrameInterval = 5 * 60 * 1000; // 5 minutes for recent data
  const oldFrameInterval = 15 * 60 * 1000; // 15 minutes for older data
  
  let lastFrameTime = 0;
  
  sortedTimestamps.forEach(timestamp => {
    const currentTime = new Date(timestamp).getTime();
    const isRecent = (now - currentTime) < recentThreshold;
    const frameInterval = isRecent ? recentFrameInterval : oldFrameInterval;
    
    if (currentTime - lastFrameTime >= frameInterval) {
      timelineFrames.push(timestamp);
      lastFrameTime = currentTime;
    }
  });
  
  // Always include the latest timestamp if it's not already included
  const latestTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
  if (!timelineFrames.includes(latestTimestamp)) {
    timelineFrames.push(latestTimestamp);
  }

  // Additional safety: Ensure we include at least some timestamps for vessels with sparse data
  const vesselTimestamps: Record<string, string[]> = {};
  
  Object.entries(vesselPositions).forEach(([vesselName, positions]) => {
    vesselTimestamps[vesselName] = positions.map(pos => pos.timestamp);
  });
  
  Object.entries(vesselTimestamps).forEach(([, timestamps]) => {
    const hasTimelineTimestamp = timestamps.some(ts => timelineFrames.includes(ts));
    
    if (!hasTimelineTimestamp && timestamps.length > 0) {
      timelineFrames.push(timestamps[0]);
      if (timestamps.length > 1) {
        timelineFrames.push(timestamps[timestamps.length - 1]);
      }
    }
  });
  
  timelineFrames.sort();

  console.log(`🎬 Generated ${timelineFrames.length} timeline frames from GSF data (from ${sortedTimestamps.length} total timestamps)`);

  // Process each frame with vessel persistence logic
  const framesToInsert = [];
  const vesselLastKnownPositions: Record<string, {
    name: string;
    gsf_id: number;
    lat: number;
    lng: number;
    origin: string | null;
    course: number | null;
    firstSeen: boolean;
  }> = {};
  
  for (let i = 0; i < timelineFrames.length; i++) {
    const frameTimestamp = timelineFrames[i];
    const vesselsAtTime: Array<{
      name: string;
      gsf_id: number;
      lat: number;
      lng: number;
      origin: string | null;
      course: number | null;
    }> = [];

    // For each vessel, find the closest position to this frame timestamp
    Object.entries(vesselPositions).forEach(([vesselName, positions]) => {
      if (positions.length === 0) return;

      // Find exact position at this timestamp first
      let exactPosition = positions.find(pos => pos.timestamp === frameTimestamp);
      
      if (!exactPosition) {
        // If no exact match, find the closest position within a reasonable time window
        const frameTime = new Date(frameTimestamp).getTime();
        const timeWindow = 30 * 60 * 1000; // 30 minutes window
        
        // Find positions within the time window
        const nearbyPositions = positions.filter(pos => {
          const posTime = new Date(pos.timestamp).getTime();
          return Math.abs(posTime - frameTime) <= timeWindow;
        });
        
        if (nearbyPositions.length > 0) {
          // Find the closest position by time
          exactPosition = nearbyPositions.reduce((closest, current) => {
            const closestTime = Math.abs(new Date(closest.timestamp).getTime() - frameTime);
            const currentTime = Math.abs(new Date(current.timestamp).getTime() - frameTime);
            return currentTime < closestTime ? current : closest;
          });
        }
      }
      
      if (exactPosition) {
        // Find the vessel's GSF ID from the GSF data
        const vessel = gsfVessels.find(v => v.name === vesselName);
        
        if (vessel) {
          const vesselData = {
            name: vesselName,
            gsf_id: vessel.id,
            lat: exactPosition.lat,
            lng: exactPosition.lng,
            origin: exactPosition.origin,
            course: exactPosition.course,
            firstSeen: !vesselLastKnownPositions[vesselName]
          };
          
          // Update last known position
          vesselLastKnownPositions[vesselName] = vesselData;
          vesselsAtTime.push(vesselData);
        }
      } else if (vesselLastKnownPositions[vesselName]) {
        // Vessel has been seen before but no data for this frame - persist last known position
        const lastKnown = vesselLastKnownPositions[vesselName];
        vesselsAtTime.push({
          name: lastKnown.name,
          gsf_id: lastKnown.gsf_id,
          lat: lastKnown.lat,
          lng: lastKnown.lng,
          origin: lastKnown.origin,
          course: lastKnown.course
        });
      }
    });

    if (vesselsAtTime.length > 0) {
      framesToInsert.push({
        frame_timestamp: frameTimestamp,
        frame_index: i,
        vessels_data: vesselsAtTime,
      });
    }
  }

  console.log(`📊 Generated ${framesToInsert.length} timeline frames from GSF data`);

  // Clear existing timeline frames and insert new ones
  if (framesToInsert.length > 0) {
    console.log('🗑️ Clearing existing timeline frames...');
    const { error: deleteError } = await supabase
      .from('timeline_frames')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      console.error('❌ Error clearing timeline frames:', deleteError);
    }

    console.log('💾 Inserting new timeline frames from GSF data...');
     
    const { error: insertError } = await supabase
      .from('timeline_frames')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(framesToInsert as any);

    if (insertError) {
      throw new Error(`Failed to insert timeline frames: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${framesToInsert.length} timeline frames from GSF data`);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timestampOnly = searchParams.get('timestamp') === 'true';
  
  // If only timestamp is requested, return latest timestamp without processing
  if (timestampOnly) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing required environment variables');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get the latest timestamp from vessel_positions table
      const { data: latestPosition, error } = await supabase
        .from('vessel_positions')
        .select('timestamp_utc')
        .order('timestamp_utc', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw new Error(`Failed to fetch latest timestamp: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        latestTimestamp: latestPosition?.timestamp_utc || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  }

  // Full cron job processing (original logic)
  const startTime = Date.now();
  let vesselsProcessed = 0;
  let positionsProcessed = 0;
  const errors: string[] = [];
  
  try {
    console.log('🚢 Starting vessel data fetch cron job...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const gsfApiToken = process.env.GSF_API_TOKEN;
    
    if (!supabaseUrl || !supabaseServiceKey || !gsfApiToken) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');

    // Health check: Test GSF API availability
    console.log('🔍 Testing GSF API availability...');
    try {
      const healthResponse = await fetch(GSF_API_URL, {
        headers: {
          'Authorization': `Bearer ${gsfApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!healthResponse.ok) {
        throw new Error(`GSF API health check failed: ${healthResponse.status}`);
      }
      
      console.log('✅ GSF API is available');
    } catch (healthError) {
      console.error('❌ GSF API health check failed:', healthError);
      throw new Error(`GSF API is not available: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`);
    }

    // Fetch vessels from GSF API with retry logic
    console.log('📡 Fetching vessel data from GSF API...');
    const vesselsResponse = await fetchWithRetry(GSF_API_URL, {
      headers: {
        'Authorization': `Bearer ${gsfApiToken}`,
        'Content-Type': 'application/json'
      }
    });

    const apiResponse = await vesselsResponse.json();
    const gsfVessels: Vessel[] = apiResponse.data || [];
    
    if (gsfVessels.length === 0) {
      throw new Error('No vessel data received from GSF API');
    }
    
    console.log(`📊 Fetched ${gsfVessels.length} vessels from GSF API`);

    // Get existing vessels from database for comparison
    const { data: existingVessels, error: existingError } = await supabase
      .from('vessels')
      .select('gsf_id')
      .eq('status', 'active');

    if (existingError) {
      throw new Error(`Failed to fetch existing vessels: ${existingError.message}`);
    }

    const existingVesselIds = existingVessels?.map(v => v.gsf_id) || [];
    console.log(`📋 Found ${existingVesselIds.length} existing vessels in database`);

    // Process vessels in parallel batches
    const results: ProcessingResult[] = [];
    
    for (let i = 0; i < gsfVessels.length; i += BATCH_SIZE) {
      const batch = gsfVessels.slice(i, i + BATCH_SIZE);
      console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(gsfVessels.length / BATCH_SIZE)} (${batch.length} vessels)`);
      
      const batchPromises = batch.map(async (vessel): Promise<ProcessingResult> => {
        try {
          // Upsert vessel data
          const { data: vesselData, error: vesselError } = await supabase
            .from('vessels')
            .upsert({
              gsf_id: vessel.id,
              name: vessel.name,
              mmsi: vessel.mmsi,
              start_date: vessel.start_date,
              latitude: vessel.latitude,
              longitude: vessel.longitude,
              image_url: vessel.image,
              vessel_status: vessel.vessel_status,
              origin: vessel.origin,
              marinetraffic_shipid: vessel.marinetraffic_shipid,
              speed_kmh: vessel.speed_kmh,
              speed_knots: vessel.speed_knots,
              course: vessel.course,
              type: vessel.type,
              status: 'active',
              updated_at: new Date().toISOString(),
              created_at: vessel.date_created || new Date().toISOString()
            }, {
              onConflict: 'gsf_id'
            })
            .select('id')
            .single();

          if (vesselError) {
            return { success: false, error: `Vessel ${vessel.id}: ${vesselError.message}` };
          }

          const vesselDbId = vesselData.id;

          // Process positions data efficiently
          if (vessel.positions) {
            try {
              const positions: Position[] = JSON.parse(vessel.positions);
              console.log(`📍 Processing ${positions.length} positions for vessel ${vessel.name} (ID: ${vessel.id})`);

              // Prepare all positions for batch insert
              const positionsToInsert = [];

              // Add historical positions first
              for (const position of positions) {
                positionsToInsert.push({
                  vessel_id: vesselDbId,
                  gsf_vessel_id: vessel.id,
                  latitude: position.latitude,
                  longitude: position.longitude,
                  speed_kmh: position.speed_kmh,
                  speed_knots: position.speed_knots,
                  course: position.course,
                  timestamp_utc: position.timestamp_utc
                });
              }

              // Add current position only if not already in historical positions
              const currentPositionExists = positionsToInsert.some(pos => 
                pos.timestamp_utc === vessel.timestamp_utc
              );
              
              if (!currentPositionExists) {
                positionsToInsert.push({
                  vessel_id: vesselDbId,
                  gsf_vessel_id: vessel.id,
                  latitude: vessel.latitude,
                  longitude: vessel.longitude,
                  speed_kmh: vessel.speed_kmh,
                  speed_knots: vessel.speed_knots,
                  course: vessel.course,
                  timestamp_utc: vessel.timestamp_utc
                });
              }

              // Insert positions in batches using upsert
              for (let j = 0; j < positionsToInsert.length; j += POSITION_BATCH_SIZE) {
                const positionBatch = positionsToInsert.slice(j, j + POSITION_BATCH_SIZE);
                
                const { error: positionError } = await supabase
                  .from('vessel_positions')
                  .upsert(positionBatch, {
                    onConflict: 'gsf_vessel_id,timestamp_utc',
                    ignoreDuplicates: true
                  });

                if (positionError) {
                  console.error(`❌ Error storing position batch for vessel ${vessel.id}:`, positionError);
                  return { success: false, error: `Position batch ${vessel.id}: ${positionError.message}` };
                }
              }

              return { 
                success: true, 
                vesselId: vessel.id,
                positionCount: positionsToInsert.length 
              };

            } catch (parseError) {
              console.error(`❌ Error parsing positions for vessel ${vessel.id}:`, parseError);
              return { success: false, error: `Parse error ${vessel.id}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` };
            }
          }

          return { 
            success: true, 
            vesselId: vessel.id,
            positionCount: 0 
          };

        } catch (error) {
          console.error(`❌ Error processing vessel ${vessel.id}:`, error);
          return { success: false, error: `Vessel ${vessel.id}: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Update counters
      batchResults.forEach(result => {
        if (result.error) {
          errors.push(result.error);
        } else {
          vesselsProcessed++;
          positionsProcessed += result.positionCount || 0;
        }
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Processed ${vesselsProcessed} vessels with ${positionsProcessed} positions in ${processingTime}ms`);
    
    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} errors occurred:`, errors.slice(0, 5));
    }

    // Generate timeline frames for animation playback using fresh GSF data
    console.log('🎬 Starting timeline frame generation...');
    const timelineStartTime = Date.now();
    
    try {
      await generateTimelineFramesFromGSFData(supabase, gsfVessels);
      const timelineProcessingTime = Date.now() - timelineStartTime;
      console.log(`✅ Timeline frames generated in ${timelineProcessingTime}ms`);
    } catch (timelineError) {
      console.error('❌ Timeline generation error:', timelineError);
      errors.push(`Timeline generation: ${timelineError instanceof Error ? timelineError.message : 'Unknown error'}`);
    }

    // Get latest timestamp for monitoring
    const latestTimestamp = gsfVessels.reduce((latest, vessel) => {
      return vessel.timestamp_utc > latest ? vessel.timestamp_utc : latest;
    }, '');
    
    return NextResponse.json({
      success: true,
      message: 'Vessel data fetch completed successfully',
      summary: {
        vesselsProcessed,
        positionsProcessed,
        errors: errors.length,
        processingTimeMs: processingTime,
        latestTimestamp,
      timestamp: new Date().toISOString()
      },
      errors: errors.slice(0, 10) // Limit error details
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Cron job error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: {
        vesselsProcessed,
        positionsProcessed,
        errors: errors.length,
        processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
      },
      errors: errors.slice(0, 10)
    }, { status: 500 });
  }
}
