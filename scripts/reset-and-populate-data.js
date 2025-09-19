#!/usr/bin/env node

/**
 * Complete Data Reset and Population Script
 * This script will:
 * 1. Clear existing vessel and position data
 * 2. Fetch complete data from GSF API
 * 3. Populate Supabase with all vessel and position data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const gsfApiUrl = process.env.GSF_API_URL;
const gsfApiToken = process.env.GSF_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey || !gsfApiUrl || !gsfApiToken) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GSF_API_URL, GSF_API_TOKEN');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  try {
    // Clear vessel positions first (due to foreign key constraint)
    const { error: positionsError } = await supabase
      .from('vessel_positions')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (positionsError) {
      console.error('❌ Error clearing vessel_positions:', positionsError);
      throw positionsError;
    }
    
    console.log('✅ Cleared vessel_positions table');
    
    // Clear vessels table
    const { error: vesselsError } = await supabase
      .from('vessels')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (vesselsError) {
      console.error('❌ Error clearing vessels:', vesselsError);
      throw vesselsError;
    }
    
    console.log('✅ Cleared vessels table');
    
  } catch (error) {
    console.error('❌ Failed to clear existing data:', error);
    throw error;
  }
}

async function fetchGSFData() {
  console.log('🌐 Fetching data from GSF API...');
  
  try {
    const response = await fetch(`${gsfApiUrl}/items/freedom_flotilla_vessels?limit=-1`, {
      headers: {
        'Authorization': `Bearer ${gsfApiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`GSF API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Fetched ${data.data.length} vessels from GSF API`);
    
    return data.data;
  } catch (error) {
    console.error('❌ Failed to fetch GSF data:', error);
    throw error;
  }
}

async function populateVessels(gsfVessels) {
  console.log('🚢 Populating vessels table...');
  
  let vesselsProcessed = 0;
  const errors = [];

  for (const vessel of gsfVessels) {
    try {
      const { data, error } = await supabase
        .from('vessels')
        .insert({
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
          created_at: vessel.date_created || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        errors.push(`Vessel ${vessel.id} (${vessel.name}): ${error.message}`);
        continue;
      }

      vesselsProcessed++;
      
      // Store vessel ID for position processing
      vessel.db_id = data.id;
      
    } catch (error) {
      errors.push(`Vessel ${vessel.id} (${vessel.name}): ${error.message}`);
    }
  }

  console.log(`✅ Processed ${vesselsProcessed} vessels`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} vessel errors:`, errors.slice(0, 5));
  }

  return { vesselsProcessed, errors };
}

async function populatePositions(gsfVessels) {
  console.log('📍 Populating vessel positions...');
  
  let positionsProcessed = 0;
  const errors = [];

  for (const vessel of gsfVessels) {
    if (!vessel.db_id) continue; // Skip vessels that failed to insert

    try {
      const positionsToInsert = [];

      // Add current position from vessel data
      positionsToInsert.push({
        vessel_id: vessel.db_id,
        gsf_vessel_id: vessel.id,
        latitude: vessel.latitude,
        longitude: vessel.longitude,
        speed_kmh: vessel.speed_kmh,
        speed_knots: vessel.speed_knots,
        course: vessel.course,
        timestamp_utc: vessel.timestamp_utc
      });

      // Add historical positions if available
      if (vessel.positions) {
        try {
          const historicalPositions = JSON.parse(vessel.positions);
          for (const position of historicalPositions) {
            positionsToInsert.push({
              vessel_id: vessel.db_id,
              gsf_vessel_id: vessel.id,
              latitude: position.latitude,
              longitude: position.longitude,
              speed_kmh: position.speed_kmh,
              speed_knots: position.speed_knots,
              course: position.course,
              timestamp_utc: position.timestamp_utc
            });
          }
        } catch (parseError) {
          errors.push(`Parse error for vessel ${vessel.id}: ${parseError.message}`);
        }
      }

      // Insert all positions for this vessel
      if (positionsToInsert.length > 0) {
        const { error: positionError } = await supabase
          .from('vessel_positions')
          .insert(positionsToInsert);

        if (positionError) {
          errors.push(`Positions for vessel ${vessel.id}: ${positionError.message}`);
        } else {
          positionsProcessed += positionsToInsert.length;
          console.log(`📍 Added ${positionsToInsert.length} positions for ${vessel.name}`);
        }
      }

    } catch (error) {
      errors.push(`Vessel ${vessel.id} positions: ${error.message}`);
    }
  }

  console.log(`✅ Processed ${positionsProcessed} positions`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} position errors:`, errors.slice(0, 5));
  }

  return { positionsProcessed, errors };
}

async function verifyData() {
  console.log('🔍 Verifying data...');
  
  try {
    const { data: vessels, error: vesselsError } = await supabase
      .from('vessels')
      .select('id, name, gsf_id, timestamp_utc')
      .eq('status', 'active');

    if (vesselsError) throw vesselsError;

    const { data: positions, error: positionsError } = await supabase
      .from('vessel_positions')
      .select('id, vessel_id, timestamp_utc');

    if (positionsError) throw positionsError;

    // Get date range
    const vesselDates = vessels.map(v => new Date(v.timestamp_utc));
    const positionDates = positions.map(p => new Date(p.timestamp_utc));
    
    const allDates = [...vesselDates, ...positionDates];
    const earliestDate = new Date(Math.min(...allDates));
    const latestDate = new Date(Math.max(...allDates));

    console.log('📊 Verification Results:');
    console.log(`   Active vessels: ${vessels.length}`);
    console.log(`   Total positions: ${positions.length}`);
    console.log(`   Date range: ${earliestDate.toISOString()} to ${latestDate.toISOString()}`);
    console.log(`   Unique vessels with positions: ${new Set(positions.map(p => p.vessel_id)).size}`);

    return {
      vessels: vessels.length,
      positions: positions.length,
      earliestDate: earliestDate.toISOString(),
      latestDate: latestDate.toISOString()
    };

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting complete data reset and population...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Clear existing data
    await clearExistingData();
    
    // Step 2: Fetch GSF data
    const gsfVessels = await fetchGSFData();
    
    // Step 3: Populate vessels
    const vesselResults = await populateVessels(gsfVessels);
    
    // Step 4: Populate positions
    const positionResults = await populatePositions(gsfVessels);
    
    // Step 5: Verify data
    const verification = await verifyData();

    console.log('=' .repeat(60));
    console.log('🎉 Data reset and population completed successfully!');
    console.log('📈 Summary:');
    console.log(`   Vessels processed: ${vesselResults.vesselsProcessed}`);
    console.log(`   Positions processed: ${positionResults.positionsProcessed}`);
    console.log(`   Vessel errors: ${vesselResults.errors.length}`);
    console.log(`   Position errors: ${positionResults.errors.length}`);
    console.log(`   Final verification: ${verification.vessels} vessels, ${verification.positions} positions`);
    console.log(`   Date range: ${verification.earliestDate} to ${verification.latestDate}`);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
