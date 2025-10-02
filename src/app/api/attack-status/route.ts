import { NextResponse } from 'next/server';

// Simple in-memory cache
let cache: {
  data: {
    success: boolean;
    attackStatuses: {
      [vesselName: string]: 'attacked' | 'emergency';
    };
    count: number;
  };
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60000; // 60 seconds cache (longer than 30s polling)

// Retry function with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AttackStatusBot/1.0)',
          'Accept': 'text/csv',
        },
      });

      if (response.ok) {
        return response;
      }

      // If it's a rate limit error and we have retries left, wait and retry
      if (response.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // For other errors or final attempt, throw the error
      throw new Error(`Google Sheets API responded with status: ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retrying for network errors
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached attack status data');
      return NextResponse.json(cache.data);
    }

    console.log('Fetching fresh attack status data from Google Sheets');
    const response = await fetchWithRetry(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRODXd6UHeb_ayDrGm_G61cmHMsAZcjOPbM8yfwXQdymVxCBOomvhdTFsl3gEVnH5l6T4WUQGIamgEO/pub?output=csv'
    );

    const csvText = await response.text();
    
    // Debug logging
    console.log('CSV Response length:', csvText.length);
    console.log('CSV Preview:', csvText.substring(0, 200));
    
    // Parse CSV data
    const lines = csvText.trim().split('\n');
    console.log('Number of lines:', lines.length);
    
    if (lines.length === 0) {
      throw new Error('Empty CSV response');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('Headers:', headers);
    
    // Find header indices
    const vesselNameIndex = headers.findIndex(h => h.toLowerCase().includes('vessel') || h.toLowerCase().includes('name'));
    const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'));
    
    console.log('Vessel name index:', vesselNameIndex);
    console.log('Status index:', statusIndex);
    
    if (vesselNameIndex === -1 || statusIndex === -1) {
      throw new Error(`Invalid CSV format: missing vessel_name or status headers. Found headers: ${headers.join(', ')}`);
    }

    // Parse data rows (only keep attacked and emergency)
    const attackStatuses: { [vesselName: string]: 'attacked' | 'emergency' } = {};
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      if (row.length >= Math.max(vesselNameIndex, statusIndex) + 1) {
        const vesselName = row[vesselNameIndex];
        const status = row[statusIndex].toLowerCase();

        console.log(`Row ${i}: vessel="${vesselName}", status="${status}"`);

        // Only accept 'attacked' or 'emergency'
        if (status === 'attacked' || status === 'emergency') {
          attackStatuses[vesselName] = status as 'attacked' | 'emergency';
        }
      }
    }
    
    console.log('Parsed attack statuses:', attackStatuses);

    const responseData = {
      success: true,
      attackStatuses,
      count: Object.keys(attackStatuses).length
    };

    // Cache the response
    cache = {
      data: responseData,
      timestamp: now
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching attack status from Google Sheets:', error);
    
    // If we have cached data, return it even if fresh fetch failed
    if (cache) {
      console.log('Returning stale cached attack status data due to fetch error');
      return NextResponse.json({
        ...cache.data,
        success: true,
        cached: true,
        error: error instanceof Error ? error.message : 'Failed to fetch fresh data, using cached data'
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch attack status',
        attackStatuses: {},
        count: 0
      },
      { status: 500 }
    );
  }
}
