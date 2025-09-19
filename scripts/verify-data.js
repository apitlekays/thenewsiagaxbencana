#!/usr/bin/env node

/**
 * Data Verification Script
 * This script verifies that the data population was successful
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyData() {
  console.log('🔍 Verifying Supabase data...');
  console.log('=' .repeat(50));

  try {
    // Check vessels
    const { data: vessels, error: vesselsError } = await supabase
      .from('vessels')
      .select('id, name, gsf_id, status, timestamp_utc')
      .eq('status', 'active');

    if (vesselsError) throw vesselsError;

    // Check positions
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

    // Check vessels with positions
    const vesselsWithPositions = new Set(positions.map(p => p.vessel_id));
    const vesselsWithoutPositions = vessels.filter(v => !vesselsWithPositions.has(v.id));

    // Get latest positions by vessel
    const { data: latestPositions } = await supabase
      .from('vessel_positions')
      .select('vessel_id, timestamp_utc')
      .order('timestamp_utc', { ascending: false });

    const latestByVessel = {};
    if (latestPositions) {
      for (const pos of latestPositions) {
        if (!latestByVessel[pos.vessel_id]) {
          latestByVessel[pos.vessel_id] = pos.timestamp_utc;
        }
      }
    }

    console.log('📊 Verification Results:');
    console.log(`   ✅ Active vessels: ${vessels.length}`);
    console.log(`   ✅ Total positions: ${positions.length}`);
    console.log(`   ✅ Vessels with positions: ${vesselsWithPositions.size}`);
    console.log(`   ⚠️  Vessels without positions: ${vesselsWithoutPositions.length}`);
    console.log(`   📅 Date range: ${earliestDate.toISOString()} to ${latestDate.toISOString()}`);
    
    if (vesselsWithoutPositions.length > 0) {
      console.log('\n⚠️  Vessels without position data:');
      vesselsWithoutPositions.forEach(v => {
        console.log(`   - ${v.name} (GSF ID: ${v.gsf_id})`);
      });
    }

    // Check for recent data (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentPositions = positions.filter(p => new Date(p.timestamp_utc) > threeDaysAgo);
    console.log(`\n📈 Recent data (last 3 days): ${recentPositions.length} positions`);

    // Show top 10 vessels by position count
    const positionCounts = {};
    positions.forEach(p => {
      positionCounts[p.vessel_id] = (positionCounts[p.vessel_id] || 0) + 1;
    });

    const topVessels = Object.entries(positionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.log('\n🏆 Top 10 vessels by position count:');
    topVessels.forEach(([vesselId, count]) => {
      const vessel = vessels.find(v => v.id == vesselId);
      const vesselName = vessel ? vessel.name : `Unknown (ID: ${vesselId})`;
      console.log(`   ${vesselName}: ${count} positions`);
    });

    // Overall assessment
    console.log('\n🎯 Overall Assessment:');
    if (vessels.length >= 50 && positions.length >= 15000) {
      console.log('   ✅ EXCELLENT: Data population successful!');
    } else if (vessels.length >= 40 && positions.length >= 10000) {
      console.log('   ✅ GOOD: Data population mostly successful');
    } else if (vessels.length >= 20 && positions.length >= 5000) {
      console.log('   ⚠️  PARTIAL: Some data missing, may need re-run');
    } else {
      console.log('   ❌ POOR: Significant data missing, needs attention');
    }

    return {
      success: vessels.length >= 40 && positions.length >= 10000,
      vessels: vessels.length,
      positions: positions.length,
      vesselsWithPositions: vesselsWithPositions.size,
      earliestDate: earliestDate.toISOString(),
      latestDate: latestDate.toISOString()
    };

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error: error.message };
  }
}

// Run verification
verifyData().then(result => {
  if (result.success) {
    console.log('\n🎉 Data verification completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Data verification failed!');
    process.exit(1);
  }
});
