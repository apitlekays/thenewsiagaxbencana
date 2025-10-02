#!/usr/bin/env node

/**
 * Test script for Vercel cron job synchronization
 * Usage: node scripts/test-cron-sync.js [type] [baseURL]
 * 
 * Examples:
 *   node scripts/test-cron-sync.js attack_status
 *   node scripts/test-cron-sync.js incidents http://localhost:3000
 *   node scripts/test-cron-sync.js all https://your-app.vercel.app
 */

const args = process.argv.slice(2);
const syncType = args[0] || 'all';
const baseURL = args[1] || 'https://your-app.vercel.app';

const validTypes = ['attack_status', 'incidents', 'all'];

if (!validTypes.includes(syncType)) {
  console.error('❌ Invalid sync type. Valid types:', validTypes.join(', '));
  process.exit(1);
}

async function testCronSync() {
  try {
    console.log(`🧪 Testing ${syncType} sync on ${baseURL}...`);
    
    const url = `${baseURL}/api/cron/sync-sheets-data?type=${syncType}`;
    console.log(`📡 Calling: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Sync completed successfully:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('🎉 Test PASSED');
      process.exit(0);
    } else {
      console.log('❌ Test FAILED - sync was not successful');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test FAILED with error:', error.message);
    process.exit(1);
  }
}

// Run the test
testCronSync();
