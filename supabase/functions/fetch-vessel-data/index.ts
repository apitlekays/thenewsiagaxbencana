import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GSF API configuration
    const GSF_API_URL = Deno.env.get('GSF_API_URL');
    const GSF_API_TOKEN = Deno.env.get('GSF_API_TOKEN');

    if (!GSF_API_URL || !GSF_API_TOKEN) {
      throw new Error('GSF API configuration missing');
    }

    console.log('🚢 Starting optimized vessel data fetch...');

    // Fetch vessels from GSF API
    const vesselsResponse = await fetch(GSF_API_URL, {
      headers: {
        'Authorization': `Bearer ${GSF_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!vesselsResponse.ok) {
      throw new Error(`GSF API vessels request failed: ${vesselsResponse.status}`);
    }

    const apiResponse = await vesselsResponse.json();
    const gsfVessels = apiResponse.data || [];
    console.log(`📊 Fetched ${gsfVessels.length} vessels from GSF API`);

    // Extract GSF vessel IDs for comparison
    const gsfVesselIds = gsfVessels.map((v) => v.id);

    // Get existing vessels from database
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
    const batchSize = 5;
    const results = [];
    const errors = [];
    let vesselsProcessed = 0;
    let positionsProcessed = 0;

    for (let i = 0; i < gsfVessels.length; i += batchSize) {
      const batch = gsfVessels.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (vessel) => {
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
            return { error: `Vessel ${vessel.id}: ${vesselError.message}` };
          }

          const vesselDbId = vesselData.id;

          // Process positions data efficiently
          if (vessel.positions) {
            try {
              const positions = JSON.parse(vessel.positions);
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
              const positionBatchSize = 100;
              for (let j = 0; j < positionsToInsert.length; j += positionBatchSize) {
                const batch = positionsToInsert.slice(j, j + positionBatchSize);
                
                const { error: positionError } = await supabase
                  .from('vessel_positions')
                  .upsert(batch, {
                    onConflict: 'gsf_vessel_id,timestamp_utc',
                    ignoreDuplicates: true
                  });

                if (positionError) {
                  console.error(`❌ Error storing position batch for vessel ${vessel.id}:`, positionError);
                  return { error: `Position batch ${vessel.id}: ${positionError.message}` };
                }
              }

              return { 
                success: true, 
                vesselId: vessel.id,
                positionCount: positionsToInsert.length 
              };

            } catch (parseError) {
              console.error(`❌ Error parsing positions for vessel ${vessel.id}:`, parseError);
              return { error: `Parse error ${vessel.id}: ${parseError.message}` };
            }
          }

          return { 
            success: true, 
            vesselId: vessel.id,
            positionCount: 0 
          };

        } catch (error) {
          console.error(`❌ Error processing vessel ${vessel.id}:`, error);
          return { error: `Vessel ${vessel.id}: ${error.message}` };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.error) {
          errors.push(result.error);
        } else {
          results.push(result);
          vesselsProcessed++;
          positionsProcessed += result.positionCount;
        }
      });
    }

    console.log(`✅ Processed ${vesselsProcessed} vessels with ${positionsProcessed} positions`);
    
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} errors occurred:`, errors.slice(0, 5));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vessel data fetch completed successfully',
        summary: {
          vesselsProcessed,
          positionsProcessed,
          errors: errors.length,
          timestamp: new Date().toISOString()
        },
        errors: errors.slice(0, 10) // Limit error details
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
