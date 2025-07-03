import { NextResponse } from 'next/server';

const ENDPOINT = 'https://n8n.drhafizhanif.net/webhook/fetch-met-data';

export async function GET() {
  try {
    const res = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!res.ok) {
      console.error('Failed to fetch:', res.status, res.statusText);
      return NextResponse.json({ error: `Failed to fetch data: ${res.status} ${res.statusText}` }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
} 