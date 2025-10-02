#!/usr/bin/env node

/**
 * Verification script for Vercel cron setup
 * Checks if environment variables are properly configured
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Vercel Cron Setup...\n');

// Check required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_PROJECT_ID',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('📋 Checking Environment Variables:');
let allPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allPresent = false;
  }
});

console.log('\n📁 Checking Required Files:');

const requiredFiles = [
  'vercel.json',
  'src/app/api/cron/sync-sheets-data-simple/route.ts',
  'docs/VERCEL_CRON_SIMPLE_SETUP.md'
];

requiredFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filePath}: Present`);
    } else {
      console.log(`❌ ${filePath}: Missing`);
      allPresent = false;
    }
  } catch (error) {
    console.log(`❌ ${filePath}: Error checking`);
    allPresent = false;
  }
});

console.log('\n🎯 Setup Status:');

if (allPresent) {
  console.log('✅ All files and environment variables are properly configured!');
  console.log('🚀 You can now deploy with: vercel --prod');
  console.log('\n📋 Next Steps:');
  console.log('1. Deploy to Vercel: vercel --prod');
  console.log('2. Monitor cron executions in Vercel Dashboard');
  console.log('3. Test manually: https://your-app.vercel.app/api/cron/sync-sheets-data-simple?type=all');
  process.exit(0);
} else {
  console.log('❌ Missing required configuration!');
  console.log('\n📋 Setup Required:');
  console.log('1. Add environment variables in Vercel Dashboard');
  console.log('2. Ensure all files are in place');
  console.log('3. Run this script again to verify');
  process.exit(1);
}
