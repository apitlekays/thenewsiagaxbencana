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
        redirect: 'follow', // Follow redirects automatically
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
          status: item.status,
          updated_at: new Date().toISOString()
        })),
        {
          onConflict: 'vessel_name',
          ignoreDuplicates: false
        }
      );

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully upserted ${data.length} attack status records`);
  } catch (error) {

    console.error('❌ Error upserting attack status:', error);
    throw error;
  }
}

// Upsert incidents data
async function upsertIncidents(supabase: ReturnType<typeof createClient>, data: IncidentData[]) {
  if (data.length === 0) {
    console.log('⚠️ No incidents data to upsert');
    return;
  }

  try {
    // Get existing incidents to avoid duplicates
    const { data: existingIncidents, error: fetchError } = await supabase
      .from('incidents_reports')
      .select('datetime, notes_published')
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    // Filter out duplicates
    const existingHashes = new Set(
      existingIncidents.map((inc: { datetime: string; notes_published: string }) => 
        `${inc.datetime}|${inc.notes_published}`
      )
    );

    const newIncidents = data.filter(incident => 
      !existingHashes.has(`${incident.datetime}|${incident.notes_published}`)
    );

    if (newIncidents.length === 0) {
      console.log('✅ No new incidents to insert');
      return;
    }

    // Insert only new incidents
    const { error } = await supabase
      .from('incidents_reports')
      .insert(
        newIncidents.map(item => ({
          datetime: item.datetime,
          notes_published: item.notes_published,
          created_at: new Date().toISOString()
        }))
      );

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully inserted ${newIncidents.length} new incident records`);
  } catch (error) {
    console.error('❌ Error upserting incidents:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Google Sheets sync...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('🔗 Connected to Supabase:', supabaseUrl);

    // Check what to sync based on request parameters or run both
    const url = new URL(req.url);
    const syncType = url.searchParams.get('type') || 'all';
    
    const errors = [];

    // Sync Attack Status (every 5 minutes)
    if (syncType === 'all' || syncType === 'attack_status') {
      try {
        console.log('🔄 Syncing attack status...');
        const csvText = await fetchCSV(ATTACK_STATUS_URL);
        const attackData = parseAttackStatusCSV(csvText);
        await upsertAttackStatus(supabase, attackData);
      } catch (error) {
        const errorMsg = `Attack status sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    // Sync Incidents (every 10 minutes)
    if (syncType === 'all' || syncType === 'incidents') {
      try {
        console.log('🔄 Syncing incidents...');
        const csvText = await fetchCSV(INCIDENTS_URL);
        const incidentsData = parseIncidentsCSV(csvText);
        await upsertIncidents(supabase, incidentsData);
      } catch (error) {
        const errorMsg = `Incidents sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    const processingTime = Date.now() - startTime;
    
    const response = {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      syncType: syncType
    };

    console.log(`✅ Sync completed in ${processingTime}ms`, response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errors.length > 0 ? 207 : 200 // 207 = Multi-status (partial success)
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Sync failed:', error);

    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
