import { NextResponse } from 'next/server';

// Simple in-memory cache
let cache: {
  data: {
    success: boolean;
    incidents: Array<{
      datetime: string;
      notes_published: string;
    }>;
    count: number;
  };
  timestamp: number;
} | null = null;

const CACHE_DURATION = 900000; // 15 minutes cache (emergency traffic reduction) to reduce API calls

// Retry function with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IncidentsBot/1.0)',
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
      console.log('Returning cached incidents data');
      return NextResponse.json(cache.data);
    }

    console.log('Fetching fresh incidents data from Google Sheets');
    const response = await fetchWithRetry(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAE39YYmDKYFdANJMSEnb_PuqmmT2zC_WCYppFBnJZDVq-tdaVe99UgI2kjeOFhHn96Q1qwqkEvUOv/pub?output=csv'
    );

    const csvText = await response.text();
    
    // Parse CSV and return as JSON
    const lines = csvText.split('\n');
    const incidents = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parsing (assuming no commas in the data fields)
      const [datetime, notes_published] = line.split(',');
      
      if (datetime && notes_published) {
        const trimmedDatetime = datetime.trim();
        const trimmedNotes = notes_published.trim();
        
        // Validate datetime
        const date = new Date(trimmedDatetime);
        if (!isNaN(date.getTime())) {
          incidents.push({
            datetime: trimmedDatetime,
            notes_published: trimmedNotes
          });
        } else {
          console.warn(`Invalid datetime format: ${trimmedDatetime}`);
        }
      }
    }
    
    // Sort by datetime (newest first)
    incidents.sort((a, b) => {
      const dateA = new Date(a.datetime);
      const dateB = new Date(b.datetime);
      return dateB.getTime() - dateA.getTime();
    });

    const responseData = {
      success: true,
      incidents,
      count: incidents.length
    };

    // Cache the response
    cache = {
      data: responseData,
      timestamp: now
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching incidents from Google Sheets:', error);
    
    // If we have cached data, return it even if fresh fetch failed
    if (cache) {
      console.log('Returning stale cached data due to fetch error');
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
        error: error instanceof Error ? error.message : 'Failed to fetch incidents',
        incidents: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
