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

export async function GET() {
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
