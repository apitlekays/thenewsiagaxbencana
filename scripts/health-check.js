#!/usr/bin/env node

/**
 * Data Sync Monitoring and Testing Script
 * This script monitors the health of your data synchronization system
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file:', error.message);
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const gsfApiUrl = process.env.GSF_API_URL;
const gsfApiToken = process.env.GSF_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDataHealth() {
  console.log('🏥 Checking Data Health...');
  console.log('=' .repeat(50));

  try {
    // Check vessels
    const { data: vessels, error: vesselsError } = await supabase
      .from('vessels')
      .select('id, name, gsf_id, status, timestamp_utc, updated_at')
      .eq('status', 'active');

    if (vesselsError) throw vesselsError;

    // Check positions
    const { data: positions, error: positionsError } = await supabase
      .from('vessel_positions')
      .select('id, vessel_id, timestamp_utc');

    if (positionsError) throw positionsError;

    // Get latest data timestamps
    const latestVesselUpdate = vessels.reduce((latest, vessel) => {
      const updateTime = new Date(vessel.updated_at);
      return updateTime > latest ? updateTime : latest;
    }, new Date(0));

    const latestPosition = positions.reduce((latest, position) => {
      const posTime = new Date(position.timestamp_utc);
      return posTime > latest ? posTime : latest;
    }, new Date(0));

    const now = new Date();
    const hoursSinceLastUpdate = (now - latestVesselUpdate) / (1000 * 60 * 60);
    const hoursSinceLastPosition = (now - latestPosition) / (1000 * 60 * 60);

    console.log('📊 Current Status:');
    console.log(`   Active vessels: ${vessels.length}`);
    console.log(`   Total positions: ${positions.length}`);
    console.log(`   Latest vessel update: ${latestVesselUpdate.toISOString()}`);
    console.log(`   Latest position: ${latestPosition.toISOString()}`);
    console.log(`   Hours since last update: ${hoursSinceLastUpdate.toFixed(2)}`);
    console.log(`   Hours since last position: ${hoursSinceLastPosition.toFixed(2)}`);

    // Health assessment
    console.log('\n🎯 Health Assessment:');
    if (hoursSinceLastUpdate < 24 && hoursSinceLastPosition < 24) {
      console.log('   ✅ HEALTHY: Data is fresh and up-to-date');
    } else if (hoursSinceLastUpdate < 48 && hoursSinceLastPosition < 48) {
      console.log('   ⚠️  WARNING: Data is getting stale');
    } else {
      console.log('   ❌ CRITICAL: Data is very stale, sync may be broken');
    }

    return {
      healthy: hoursSinceLastUpdate < 24 && hoursSinceLastPosition < 24,
      vessels: vessels.length,
      positions: positions.length,
      hoursSinceLastUpdate,
      hoursSinceLastPosition
    };

  } catch (error) {
    console.error('❌ Health check failed:', error);
    return { healthy: false, error: error.message };
  }
}

async function testGSFAPIConnection() {
  console.log('\n🌐 Testing GSF API Connection...');
  console.log('=' .repeat(50));

  if (!gsfApiUrl || !gsfApiToken) {
    console.log('❌ GSF API credentials not configured');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    const startTime = Date.now();
    const response = await fetch(gsfApiUrl, {
      headers: {
        'Authorization': `Bearer ${gsfApiToken}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const vesselCount = data.data ? data.data.length : 0;

    console.log(`✅ API Connection successful`);
    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Vessels returned: ${vesselCount}`);
    console.log(`   Status: ${response.status}`);

    return {
      success: true,
      responseTime,
      vesselCount,
      status: response.status
    };

  } catch (error) {
    console.log(`❌ API connection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSupabaseConnection() {
  console.log('\n🗄️  Testing Supabase Connection...');
  console.log('=' .repeat(50));

  try {
    const startTime = Date.now();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('vessels')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      console.log(`❌ Supabase connection failed: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`✅ Supabase connection successful`);
    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Status: Connected`);

    return {
      success: true,
      responseTime,
      status: 'Connected'
    };

  } catch (error) {
    console.log(`❌ Supabase connection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function generateHealthReport() {
  console.log('📋 Generating Health Report...');
  console.log('=' .repeat(50));

  const dataHealth = await checkDataHealth();
  const gsfApiHealth = await testGSFAPIConnection();
  const supabaseHealth = await testSupabaseConnection();

  const report = {
    timestamp: new Date().toISOString(),
    dataHealth,
    gsfApiHealth,
    supabaseHealth,
    overallHealth: dataHealth.healthy && gsfApiHealth.success && supabaseHealth.success
  };

  console.log('\n📊 Overall Health Summary:');
  console.log(`   Data Health: ${dataHealth.healthy ? '✅' : '❌'}`);
  console.log(`   GSF API: ${gsfApiHealth.success ? '✅' : '❌'}`);
  console.log(`   Supabase: ${supabaseHealth.success ? '✅' : '❌'}`);
  console.log(`   Overall: ${report.overallHealth ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);

  // Save report to file
  const reportPath = path.join(__dirname, '..', 'health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  return report;
}

// Run health check
generateHealthReport().then(report => {
  if (report.overallHealth) {
    console.log('\n🎉 All systems healthy!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Issues detected - check the report above');
    process.exit(1);
  }
});
