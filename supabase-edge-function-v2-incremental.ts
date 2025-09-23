import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Configuration - Exact same as the API route
const GSF_API_URL = 'https://data.forensic-architecture.org/items/freedom_flotilla_vessels?limit=1000';
const BATCH_SIZE = 5; // Process 5 vessels in parallel
const POSITION_BATCH_SIZE = 100; // Insert 100 positions per batch
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Types - Exact same as the API route
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

// Utility functions - Exact same as the API route
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
      console.warn(`Attempt ${i + 1} failed for ${url}: ${response.status} ${response.statusText}. Retrying...`);
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed for ${url}: ${error}. Retrying...`);
    }
    await delay(RETRY_DELAY);
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

// Helper function to get the last timeline frame timestamp
async function getLastTimelineFrame(supabase: any): Promise<string | null> {
  const { data, error } = await supabase
    .from('timeline_frames')
    .select('frame_timestamp')
    .order('frame_timestamp', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error getting last timeline frame:', error);
    return null;
  }

  return data && data.length > 0 ? data[0].frame_timestamp : null;
}

// Helper function to get the last frame index
async function getLastFrameIndex(supabase: any): Promise<number> {
  const { data, error } = await supabase
    .from('timeline_frames')
    .select('frame_index')
    .order('frame_index', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error getting last frame index:', error);
    return -1;
  }

  return data && data.length > 0 ? data[0].frame_index : -1;
}

// Helper function to get the last vessel positions from existing timeline
async function getLastVesselPositions(supabase: any): Promise<{ [key: string]: { name: string; gsf_id: number; lat: number; lng: number; origin: string; course: number; } }> {
  const { data, error } = await supabase
    .from('timeline_frames')
    .select('vessels_data')
    .order('frame_index', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return {};
  }

  const lastFrameVessels = data[0].vessels_data;
  const vesselPositions: { [key: string]: { name: string; gsf_id: number; lat: number; lng: number; origin: string; course: number; } } = {};

  lastFrameVessels.forEach((vessel: any) => {
    vesselPositions[vessel.name] = {
      name: vessel.name,
      gsf_id: vessel.gsf_id,
      lat: vessel.lat,
      lng: vessel.lng,
      origin: vessel.origin,
      course: vessel.course
    };
  });

  return vesselPositions;
}

// Main processing logic - Exact same as the API route
async function processVesselData(supabase: any, gsfVessels: Vessel[]) {
  console.log('Starting processVesselData...');

  // Get existing vessels from database for comparison
  const { data: existingVessels, error: existingError } = await supabase
    .from('vessels')
    .select('gsf_id')
    .eq('status', 'active');

  if (existingError) {
    throw new Error(`Failed to fetch existing vessels: ${existingError.message}`);
  }

  const existingVesselIds = existingVessels?.map((v: { gsf_id: any; }) => v.gsf_id) || [];
  console.log(`📋 Found ${existingVesselIds.length} existing vessels in database`);

  const results: ProcessingResult[] = [];
  let vesselsProcessed = 0;
  let positionsProcessed = 0;
  const errors: string[] = [];

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
                latitude: parseFloat(vessel.latitude),
                longitude: parseFloat(vessel.longitude),
                speed_kmh: parseFloat(vessel.speed_kmh),
                speed_knots: parseFloat(vessel.speed_knots),
                course: parseFloat(vessel.course),
                timestamp_utc: vessel.timestamp_utc
              });
            }

            // Batch insert positions
            for (let j = 0; j < positionsToInsert.length; j += POSITION_BATCH_SIZE) {
              const positionBatch = positionsToInsert.slice(j, j + POSITION_BATCH_SIZE);
              const { error: positionError } = await supabase
                .from('vessel_positions')
                .insert(positionBatch);

              if (positionError) {
                console.error(`❌ Error inserting position batch for vessel ${vessel.id}:`, positionError);
                throw new Error(`Failed to insert position batch: ${positionError.message}`);
              }
              positionsProcessed += positionBatch.length;
            }
            vesselsProcessed++;
            return { success: true, vesselId: vessel.id, positionCount: positionsToInsert.length };

          } catch (posError) {
            return { success: false, error: `Vessel ${vessel.id} positions: ${posError instanceof Error ? posError.message : String(posError)}` };
          }
        } else {
          vesselsProcessed++;
          return { success: true, vesselId: vessel.id, positionCount: 0 };
        }
      } catch (err) {
        return { success: false, error: `Vessel ${vessel.id}: ${err instanceof Error ? err.message : String(err)}` };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    batchResults.filter(r => !r.success).forEach(r => errors.push(r.error || 'Unknown error'));
  }

  // Deactivate vessels not present in the latest GSF fetch
  const gsfVesselIds = new Set(gsfVessels.map(v => v.id));
  const vesselsToDeactivate = existingVesselIds.filter(id => !gsfVesselIds.has(id));

  if (vesselsToDeactivate.length > 0) {
    console.log(`👻 Deactivating ${vesselsToDeactivate.length} vessels not found in latest GSF data...`);
    const { error: deactivateError } = await supabase
      .from('vessels')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .in('gsf_id', vesselsToDeactivate);

    if (deactivateError) {
      console.error('❌ Error deactivating vessels:', deactivateError);
    } else {
      console.log(`✅ Successfully deactivated ${vesselsToDeactivate.length} vessels.`);
    }
  }

  console.log(`✅ Finished processing ${vesselsProcessed} vessels and ${positionsProcessed} positions.`);
  if (errors.length > 0) {
    console.error(`Encountered ${errors.length} errors during processing:`, errors);
  }
  return { vesselsProcessed, positionsProcessed, errors };
}

// Incremental timeline frame generation - Only process new data
async function generateTimelineFrames(supabase: any, gsfVessels: Vessel[]) {
  console.log('🔄 Generating timeline frames incrementally...');

  // Get the last processed timeline frame timestamp
  const lastTimelineFrame = await getLastTimelineFrame(supabase);
  const lastFrameIndex = await getLastFrameIndex(supabase);
  const lastVesselPositions = await getLastVesselPositions(supabase);

  console.log(`📅 Last timeline frame: ${lastTimelineFrame || 'None (first run)'}`);
  console.log(`🔢 Last frame index: ${lastFrameIndex}`);

  // If no existing timeline frames, this is the first run
  if (!lastTimelineFrame) {
    console.log('🆕 First run detected - generating full timeline');
    return await generateFullTimelineFrames(supabase, gsfVessels);
  }

  // Filter vessel positions to only include new data since last timeline frame
  const vesselPositions: Record<string, Array<{
    timestamp: string;
    lat: number;
    lng: number;
    origin: string | null;
    course: number | null;
  }>> = {};
  const lastTimelineTime = new Date(lastTimelineFrame).getTime();
  let hasNewData = false;

  gsfVessels.forEach((vessel) => {
    if (vessel.positions) {
      try {
        const positions: Position[] = JSON.parse(vessel.positions);
        const newPositions = positions.filter(position => {
          const posTime = new Date(position.timestamp_utc).getTime();
          return posTime > lastTimelineTime;
        });

        if (newPositions.length > 0) {
          hasNewData = true;
          if (!vesselPositions[vessel.name]) {
            vesselPositions[vessel.name] = [];
          }
          
          newPositions.forEach(position => {
            vesselPositions[vessel.name].push({
              timestamp: position.timestamp_utc,
              lat: parseFloat(position.latitude.toString()),
              lng: parseFloat(position.longitude.toString()),
              origin: vessel.origin,
              course: position.course || null
            });
          });
        }

        // Check current position if it's newer
        const currentPosTime = new Date(vessel.timestamp_utc).getTime();
        if (currentPosTime > lastTimelineTime) {
          hasNewData = true;
          if (!vesselPositions[vessel.name]) {
            vesselPositions[vessel.name] = [];
          }
          
          vesselPositions[vessel.name].push({
            timestamp: vessel.timestamp_utc,
            lat: parseFloat(vessel.latitude.toString()),
            lng: parseFloat(vessel.longitude.toString()),
            origin: vessel.origin,
            course: parseFloat(vessel.course) || null
          });
        }
      } catch (error) {
        console.error(`Error parsing positions for vessel ${vessel.name}:`, error);
      }
    } else {
      // Check current position if no historical data
      const currentPosTime = new Date(vessel.timestamp_utc).getTime();
      if (currentPosTime > lastTimelineTime) {
        hasNewData = true;
        vesselPositions[vessel.name] = [{
          timestamp: vessel.timestamp_utc,
          lat: parseFloat(vessel.latitude.toString()),
          lng: parseFloat(vessel.longitude.toString()),
          origin: vessel.origin,
          course: parseFloat(vessel.course) || null
        }];
      }
    }
  });

  if (!hasNewData) {
    console.log('✅ No new data since last timeline frame - skipping timeline generation');
    return;
  }

  console.log(`📊 Found new data for ${Object.keys(vesselPositions).length} vessels`);

  // Get all unique timestamps from new data
  const allTimestamps = new Set<string>();
  Object.values(vesselPositions).forEach(positions => {
    positions.forEach(pos => allTimestamps.add(pos.timestamp));
  });

  const sortedTimestamps = Array.from(allTimestamps).sort();
  console.log(`⏰ Found ${sortedTimestamps.length} new timestamps to process`);

  if (sortedTimestamps.length === 0) {
    console.log('✅ No new timestamps to process');
    return;
  }

  // Generate timeline frames for new time periods only
  const timelineFrames: string[] = [];
  const now = new Date().getTime();
  const recentThreshold = 24 * 60 * 60 * 1000; // 24 hours
  const recentFrameInterval = 5 * 60 * 1000; // 5 minutes for recent data
  const oldFrameInterval = 15 * 60 * 1000; // 15 minutes for older data
  
  let lastFrameTime = lastTimelineTime;
  
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

  timelineFrames.sort();
  console.log(`🎬 Generated ${timelineFrames.length} new timeline frames`);

  // Process each frame with vessel persistence logic
  const framesToInsert = [];
  let currentFrameIndex = lastFrameIndex + 1;

  for (const frameTimestamp of timelineFrames) {
    const vesselsAtTime = [];

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
            course: exactPosition.course
          };

          // Update last known position for persistence
          lastVesselPositions[vesselName] = vesselData;
          vesselsAtTime.push(vesselData);
        }
      } else if (lastVesselPositions[vesselName]) {
        // Vessel has been seen before but no data for this frame - persist last known position
        const lastKnown = lastVesselPositions[vesselName];
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
        frame_index: currentFrameIndex,
        vessels_data: vesselsAtTime,
      });
      currentFrameIndex++;
    }
  }

  console.log(`📊 Generated ${framesToInsert.length} new timeline frames to insert`);

  // Insert only new timeline frames (no deletion)
  if (framesToInsert.length > 0) {
    console.log('💾 Inserting new timeline frames...');

    const { error: insertError } = await supabase
      .from('timeline_frames')
      .insert(framesToInsert);

    if (insertError) {
      throw new Error(`Failed to insert timeline frames: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${framesToInsert.length} new timeline frames`);
  } else {
    console.log('✅ No new timeline frames to insert');
  }
}

// Full timeline generation for first run (fallback)
async function generateFullTimelineFrames(supabase: any, gsfVessels: Vessel[]) {
  console.log('🔄 Generating full timeline frames (first run)...');

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
    const vesselsAtTime = [];

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
      .insert(framesToInsert);

    if (insertError) {
      throw new Error(`Failed to insert timeline frames: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${framesToInsert.length} timeline frames from GSF data`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚢 Starting vessel data fetch cron job...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const gsfApiToken = Deno.env.get('GSF_API_TOKEN');

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

    // Process vessel data and positions
    const { vesselsProcessed, positionsProcessed, errors } = await processVesselData(supabase, gsfVessels);

    // Generate and insert timeline frames incrementally
    await generateTimelineFrames(supabase, gsfVessels);

    const status = errors.length > 0 ? 500 : 200;
    const message = errors.length > 0 ? `Completed with ${errors.length} errors.` : 'Successfully processed vessel data.';

    return new Response(JSON.stringify({
      message,
      vesselsProcessed,
      positionsProcessed,
      errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });

  } catch (error) {
    console.error('Unhandled error during cron job:', error);
    return new Response(JSON.stringify({
      message: `Error processing vessel data: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
