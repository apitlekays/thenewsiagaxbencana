import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the Supabase project URL and service key from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call the Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-vessel-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Edge function call failed: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Vessel data fetch completed',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
