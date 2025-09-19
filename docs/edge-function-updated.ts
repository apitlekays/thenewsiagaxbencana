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

    console.log('🚢 Starting vessel data fetch...');

    // Fetch vessels from GSF API
    const vesselsResponse = await fetch(`${GSF_API_URL}/items/freedom_flotilla_vessels?limit=-1`, {
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
    console.log(`🔍 GSF vessel IDs: ${gsfVesselIds.join(', ')}`);

    // Mark vessels not in GSF API as decommissioned
    const { error: decommissionError } = await supabase
      .from('vessels')
      .update({
        status: 'decommissioned',
        updated_at: new Date().toISOString()
      })
      .not('gsf_id', 'in', `(${gsfVesselIds.join(',')})`);

    if (decommissionError) {
      console.error('❌ Error marking vessels as decommissioned:', decommissionError);
    } else {
      console.log('✅ Marked non-GSF vessels as decommissioned');
    }

    // Process each vessel from GSF API
    let vesselsProcessed = 0;
    let positionsProcessed = 0;
    const errors = [];

    for (const vessel of gsfVessels) {
      try {
        // Upsert vessel data with active status
        const { data: vesselData, error: vesselError } = await supabase
          .from('vessels')
          .upsert({
            gsf_id: vessel.id,
            name: vessel.name,
            mmsi: vessel.mmsi,
            start_date: vessel.start_date,
            latitude: vessel.latitude,
            longitude: vessel.longitude,
            timestamp_utc: vessel.timestamp_utc,
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
          errors.push(`Vessel ${vessel.id}: ${vesselError.message}`);
          continue;
        }

        vesselsProcessed++;
        const vesselDbId = vesselData.id;

        // Parse and store positions data
        if (vessel.positions) {
          try {
            const positions = JSON.parse(vessel.positions);
            console.log(`📍 Processing ${positions.length} positions for vessel ${vessel.name} (ID: ${vessel.id})`);

            // Process positions in batches for efficiency
            const batchSize = 100;
            for (let i = 0; i < positions.length; i += batchSize) {
              const batch = positions.slice(i, i + batchSize);
              
              const positionRecords = batch.map((position) => ({
                vessel_id: vesselDbId,
                gsf_vessel_id: vessel.id,
                latitude: position.latitude,
                longitude: position.longitude,
                speed_kmh: position.speed_kmh,
                speed_knots: position.speed_knots,
                course: position.course,
                timestamp_utc: position.timestamp_utc
              }));

              const { error: positionsError } = await supabase
                .from('vessel_positions')
                .upsert(positionRecords, {
                  onConflict: 'gsf_vessel_id,timestamp_utc'
                });

              if (positionsError) {
                console.error(`❌ Error storing positions for vessel ${vessel.id}:`, positionsError);
                errors.push(`Positions ${vessel.id}: ${positionsError.message}`);
              } else {
                positionsProcessed += batch.length;
              }
            }
          } catch (parseError) {
            console.error(`❌ Error parsing positions for vessel ${vessel.id}:`, parseError);
            errors.push(`Parse ${vessel.id}: ${parseError.message}`);
          }
        }

      } catch (vesselError) {
        errors.push(`Vessel ${vessel.id}: ${vesselError.message}`);
      }
    }

    // Get counts for summary
    const { data: activeVessels } = await supabase
      .from('vessels')
      .select('gsf_id', { count: 'exact' })
      .eq('status', 'active');

    const { data: decommissionedVessels } = await supabase
      .from('vessels')
      .select('gsf_id', { count: 'exact' })
      .eq('status', 'decommissioned');

    const summary = {
      vesselsProcessed,
      positionsProcessed,
      errors: errors.length,
      activeVessels: activeVessels?.length || 0,
      decommissionedVessels: decommissionedVessels?.length || 0,
      gsfVesselsReceived: gsfVessels.length,
      timestamp: new Date().toISOString()
    };

    console.log('📈 Summary:', summary);

    return new Response(JSON.stringify({
      success: true,
      summary,
      errors: errors.slice(0, 10) // Limit error output
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('❌ Edge Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
