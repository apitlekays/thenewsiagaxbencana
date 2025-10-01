import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAE39YYmDKYFdANJMSEnb_PuqmmT2zC_WCYppFBnJZDVq-tdaVe99UgI2kjeOFhHn96Q1qwqkEvUOv/pub?output=csv',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IncidentsBot/1.0)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Sheets API responded with status: ${response.status}`);
    }

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

    return NextResponse.json({
      success: true,
      incidents,
      count: incidents.length
    });

  } catch (error) {
    console.error('Error fetching incidents from Google Sheets:', error);
    
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
