import { NextResponse } from 'next/server';

// Import types for Supabase response
interface SupabaseFunctionResponse {
  success: boolean;
  errors?: string[];
  processingTime: string;
  timestamp: string;
  syncType: string;
  error?: string;
}

// Sync data by calling Supabase Edge Function
async function syncData(type: string): Promise<SupabaseFunctionResponse> {
  const supabaseUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`;
  const functionUrl = `${supabaseUrl}/functions/v1/sync-google-sheets?type=${type}`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase function call failed: ${response.status} ${response.statusText}`);
    }

    const data: SupabaseFunctionResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error calling Supabase function for ${type}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: '0ms',
      timestamp: new Date().toISOString(),
      syncType: type
    };
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    console.log(`🚀 Starting Vercel cron sync for type: ${type}`);

    // Validate sync type
    const validTypes = ['attack_status', 'incidents', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid sync type: ${type}. Valid types: ${validTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Call Supabase Edge Function
    const result = await syncData(type);

    const processingTime = Date.now() - startTime;
    
    // Add Vercel-specific metadata
    const response = {
      ...result,
      vercelProcessingTime: `${processingTime}ms`,
      vercelCronExecution: new Date().toISOString(),
      source: 'vercel-cron'
    };

    console.log(`✅ Vercel cron sync completed for ${type}:`, response);

    return NextResponse.json(response, {
      status: result.success ? 200 : 207 // 207 = Multi-status (partial success)
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Vercel cron sync failed:', error);

    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      vercelProcessingTime: `${processingTime}ms`,
      vercelCronExecution: new Date().toISOString(),
      source: 'vercel-cron-failed'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Optional: POST method for manual triggers
export async function POST(request: Request) {
  return GET(request); // Reuse GET logic
}
