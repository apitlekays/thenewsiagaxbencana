import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL; // This should be the URL of your deployed Edge Function
    const edgeFunctionAuthToken = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for server-to-server communication

    if (!edgeFunctionUrl || !edgeFunctionAuthToken) {
      throw new Error('Missing Supabase Edge Function URL or Auth Token environment variables.');
    }

    console.log('Calling Supabase Edge Function...');
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET', // Or POST, depending on how your Edge Function is configured to be invoked
      headers: {
        'Authorization': `Bearer ${edgeFunctionAuthToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge Function invocation failed:', errorData);
      return NextResponse.json({ message: 'Failed to invoke Edge Function', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    console.log('Edge Function invoked successfully:', data);
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in API route calling Edge Function:', error);
    return NextResponse.json({ message: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}
