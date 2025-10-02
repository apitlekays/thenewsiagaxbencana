import { NextResponse } from 'next/server';

// Google Sheets URLs
const ATTACK_STATUS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAE39YYmDKYFdANJMSEnb_PuqmmT2zC_WCYppFBnJZDVq-tdaVe99UgI2kjeOFhHn96Q1qwqkEvUOv/pub?output=csv';
const INCIDENTS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRODXd6UHeb_ayDrGm_G61cmHMsAZcjOPbM8yfwXQGIamgEO?output=csv';

// Helper function to fetch CSV with retry logic
async function fetchCSV(url: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetching ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Vercel Cron Sync',
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      
      // Check if response contains error indicators
      if (csvText.includes('error') || csvText.includes('Error') || csvText.includes('<!DOCTYPE html>')) {
        throw new Error('Response contains error or HTML content');
      }

      console.log(`✅ Successfully fetched CSV (${csvText.length} characters)`);
      return csvText;
    } catch (error) {

      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait 2s, 4s, 8s
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Maximum retries exceeded');
}

// Parse and update attack status data
async function syncAttackStatus(csvText: string) {
  console.log('🔄 Syncing attack status...');
  
  // Parse CSV (simple parsing for now)
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.log('⚠️ No data rows found in attack status CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log(`📋 Attack status headers:`, headers);

  // Find vessel name and status columns
  const vesselNameIndex = headers.findIndex(h => 
    h.toLowerCase().includes('vessel') || 
    h.toLowerCase().includes('name') ||
    h.toLowerCase().includes('ship')
  );
  
  const statusIndex = headers.findIndex(h => 
    h.toLowerCase().includes('status') || 
    h.toLowerCase().includes('condition') ||
    h.toLowerCase().includes('state')
  );

  if (vesselNameIndex === -1 || statusIndex === -1) {
    console.error('❌ Could not find required columns in attack status CSV');
    return [];
  }

  const data = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
    
    if (row[vesselNameIndex] && row[statusIndex]) {
      const status = row[statusIndex].toLowerCase();
      
      if (status === 'attacked' || status === 'emergency') {
        data.push({
          vessel_name: row[vesselNameIndex],
          status: status
        });
      }
    }
  }

  console.log(`✅ Parsed ${data.length} attack status records`);
  
  // Update Supabase directly via HTTP
  const supabaseUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  // Upsert to attack_status table
  const response = await fetch(`${supabaseUrl}/rest/v1/attack_status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(data.map(item => ({
      vessel_name: item.vessel_name,
      status: item.status,
      updated_at: new Date().toISOString()
    })))
  });

  if (!response.ok) {
    throw new Error(`Failed to update attack status: ${response.status} ${response.statusText}`);
  }

  console.log(`✅ Successfully synced ${data.length} attack status records`);
  return data;
}

// Parse and update incidents data
async function syncIncidents(csvText: string) {
  console.log('🔄 Syncing incidents...');
  
  // Parse CSV
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.log('⚠️ No data rows found in incidents CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log(`📋 Incidents headers:`, headers);

  // Find datetime and notes columns
  const datetimeIndex = headers.findIndex(h => 
    h.toLowerCase().includes('time') || 
    h.toLowerCase().includes('date') ||
    h.toLowerCase().includes('timestamp')
  );
  
  const notesIndex = headers.findIndex(h => 
    h.toLowerCase().includes('notes') || 
    h.toLowerCase().includes('description') ||
    h.toLowerCase().includes('incident')
  );

  if (datetimeIndex === -1 || notesIndex === -1) {
    console.error('❌ Could not find required columns in incidents CSV');
    return [];
  }

  const data = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
    
    if (row[datetimeIndex] && row[notesIndex]) {
      // Validate datetime
      const date = new Date(row[datetimeIndex]);
      if (!isNaN(date.getTime())) {
        data.push({
          datetime: row[datetimeIndex],
          notes_published: row[notesIndex]
        });
      }
    }
  }

  console.log(`✅ Parsed ${data.length} incident records`);

  // Check for new incidents to avoid duplicates
  const supabaseUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  // Get existing incidents for duplicate check
  const existingResponse = await fetch(`${supabaseUrl}/rest/v1/incidents_reports?select=datetime,notes_published&limit=100`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    }
  });

  let existingHashes = new Set();
  if (existingResponse.ok) {
    const existingIncidents = await existingResponse.json();
    existingHashes = new Set(
      existingIncidents.map((inc: { datetime: string; notes_published: string }) => `${inc.datetime}|${inc.notes_published}`)
    );
  }

  // Filter out duplicates
  const newIncidents = data.filter(incident => 
    !existingHashes.has(`${incident.datetime}|${incident.notes_published}`)
  );

  if (newIncidents.length === 0) {
    console.log('✅ No new incidents to insert');
    return {};
  }

  // Insert only new incidents
  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/incidents_reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    },
    body: JSON.stringify(newIncidents.map(item => ({
      datetime: item.datetime,
      notes_published: item.notes_published,
      created_at: new Date().toISOString()
    })))
  });

  if (!insertResponse.ok) {
    throw new Error(`Failed to insert incidents: ${insertResponse.status} ${insertResponse.statusText}`);
  }

  console.log(`✅ Successfully inserted ${newIncidents.length} new incident records`);
  return { inserted: newIncidents.length, total: data.length };
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Google Sheets sync via Supabase Edge Function...');
    
    // If Supabase Edge Function is deployed, use it instead
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    const supabaseProjectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    const functionUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/sync-google-sheets?type=${type}`;
    
    console.log(`📡 Calling Supabase Edge Function: ${functionUrl}`);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase Edge Function failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    const processingTime = Date.now() - startTime;
    
    const result = {
      ...data,
      vercelProcessingTime: `${processingTime}ms`,
      vercelExecution: new Date().toISOString(),
      source: 'vercel-via-supabase-edge-function'
    };

    console.log(`✅ Sync completed via Edge Function in ${processingTime}ms`);
    
    return NextResponse.json(result, {
      status: data.success ? 200 : 207
    });
  } catch {
    console.log('⚠️ Supabase Edge Function not available, falling back to direct sync...');
    
    // Parse query parameters for direct sync
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    console.log(`📋 Syncing type directly: ${type}`);

    // Validate sync type
    const validTypes = ['attack_status', 'incidents', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid sync type: ${type}. Valid types: ${validTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const errors: string[] = [];
    const results: Record<string, unknown> = {};

    // Sync Attack Status (every 5 minutes)
    if (type === 'all' || type === 'attack_status') {
      try {
        const csvText = await fetchCSV(ATTACK_STATUS_URL);
        results.attackStatus = await syncAttackStatus(csvText);
      } catch (error) {
        const errorMsg = `Attack status sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    // Sync Incidents (every 10 minutes)
    if (type === 'all' || type === 'incidents') {
      try {
        const csvText = await fetchCSV(INCIDENTS_URL);
        results.incidents = await syncIncidents(csvText);
      } catch (error) {
        const errorMsg = `Incidents sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    const processingTime = Date.now() - startTime;
    
    const response = {
      success: errors.length === 0,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      syncType: type,
      source: 'vercel-cron-direct'
    };

    console.log(`✅ Sync completed in ${processingTime}ms`);

    return NextResponse.json(response, {
      status: errors.length > 0 ? 207 : 200 // 207 = Multi-status (partial success)
    });
  }
}

// Optional: POST method for manual triggers
export async function POST(request: Request) {
  return GET(request); // Reuse GET logic
}
