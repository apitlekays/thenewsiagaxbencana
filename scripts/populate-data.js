#!/usr/bin/env node

/**
 * Complete Data Population Script
 * This script will populate Supabase with complete data from GSF API
 * Run this after clearing the data with the migration
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file:', error.message);
  }
}

// Load environment variables
loadEnvFile();
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

async function fetchGSFData() {
  console.log('🌐 Fetching data from GSF API...');
  
  try {
    // The GSF_API_URL already includes the full endpoint, so use it directly
    const response = await fetch(gsfApiUrl, {
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
          created_at: vessel.date_created || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'gsf_id'
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

      // Add current position from vessel data (only if not already in historical positions)
      const currentPositionExists = positionsToInsert.some(pos => 
        pos.timestamp_utc === vessel.timestamp_utc
      );
      
      if (!currentPositionExists) {
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
      }

      // Insert all positions for this vessel in batches
      if (positionsToInsert.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < positionsToInsert.length; i += batchSize) {
          const batch = positionsToInsert.slice(i, i + batchSize);
          
          const { error: positionError } = await supabase
            .from('vessel_positions')
            .upsert(batch, {
              onConflict: 'gsf_vessel_id,timestamp_utc',
              ignoreDuplicates: true
            });

          if (positionError) {
            errors.push(`Positions for vessel ${vessel.id}: ${positionError.message}`);
          } else {
            positionsProcessed += batch.length;
          }
        }
        
        console.log(`📍 Added ${positionsToInsert.length} positions for ${vessel.name}`);
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
  console.log('🚀 Starting complete data population...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Fetch GSF data
    const gsfVessels = await fetchGSFData();
    
    // Step 2: Populate vessels
    const vesselResults = await populateVessels(gsfVessels);
    
    // Step 3: Populate positions
    const positionResults = await populatePositions(gsfVessels);
    
    // Step 4: Verify data
    const verification = await verifyData();

    console.log('=' .repeat(60));
    console.log('🎉 Data population completed successfully!');
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
