#!/usr/bin/env node

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
    console.log('Looking for .env.local at:', envPath);
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('Found .env.local content:');
    console.log(envContent);
    
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        if (key && value) {
          process.env[key] = value;
          console.log('Loaded:', key, '=', value.substring(0, 20) + '...');
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file:', error.message);
  }
}

loadEnvFile();

console.log('\nEnvironment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('GSF_API_URL:', process.env.GSF_API_URL ? 'SET' : 'NOT SET');
console.log('GSF_API_TOKEN:', process.env.GSF_API_TOKEN ? 'SET' : 'NOT SET');
