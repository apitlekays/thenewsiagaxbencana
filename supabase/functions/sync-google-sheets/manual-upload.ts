import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheets URLs
const ATTACK_STATUS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAE39YYmDKYFdANJMSEnb_PuqmmT2zC_WCYppFBnJZDVq-tdaVe99UgI2kjeOFhHn96Q1qwqkEvUOv/pub?output=csv';
const INCIDENTS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRODXd6UHeb_ayDrGm_G61cmHMsAZcjOPbM8yfwXQGIamgEO?output=csv';

interface AttackStatusData {
  vessel_name: string;
  status: 'attacked' | 'emergency';
}

interface IncidentData {
  datetime: string;
  notes_published: string;
}

// Helper function to fetch CSV with retry logic
async function fetchCSV(url: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetching ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Supabase Edge Function Sync',
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
  
  throw new Error('Maximum retries exceeded');
}

// Parse attack status CSV
function parseAttackStatusCSV(csvText: string): AttackStatusData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const data: AttackStatusData[] = [];

  if (lines.length < 2) {
    console.log('⚠️ No data rows found in attack status CSV');
    return data;
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
    return data;
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
    
    if (row[vesselNameIndex] && row[statusIndex]) {
      const status = row[statusIndex].toLowerCase();
      
      if (status === 'attacked' || status === 'emergency') {
        data.push({
          vessel_name: row[vesselNameIndex],
          status: status as 'attacked' | 'emergency'
        });
      }
    }
  }

  console.log(`✅ Parsed ${data.length} attack status records`);
  return data;
}

// Parse incidents CSV
function parseIncidentsCSV(csvText: string): IncidentData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const data: IncidentData[] = [];

  if (lines.length < 2) {
    console.log('⚠️ No data rows found in incidents CSV');
    return data;
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
    return data;
  }

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
  return data;
}

// Upsert attack status data
async function upsertAttackStatus(supabase: ReturnType<typeof createClient>, data: AttackStatusData[]) {
  if (data.length === 0) {
    console.log('⚠️ No attack status data to upsert');
    return;
  }

  try {
    // Upsert all records
    const { error } = await supabase
      .from('attack_status')
      .upsert(
        data.map(item => ({
          vessel_name: item.vessel_name,
 anError(`Failed to update attack status: ${response.status} ${response.statusText}`);
      }
    });
    
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

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Google Sheets sync via Vercel...');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    console.log(`📋 Syncing type: ${type}`);

    // Validate sync type
    const validTypes = ['attack_status', 'incidents', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid sync type: ${type}. Valid types: ${validTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const errors = [];
    const results = {};

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
      source: 'vercel-cron-simple'
    };

    console.log(`✅ Sync completed in ${processingTime}ms`);

    return NextResponse.json(response, {
      status: errors.length > 0 ? 207 : 200 // 207 = Multi-status (partial success)
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Sync failed:', error);

    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      source: 'vercel-cron-simple-failed'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
