import { NextRequest, NextResponse } from 'next/server';

const ENDPOINT = 'https://n8n.drhafizhanif.net/webhook/fetch-met-data';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // Maximum requests per window
  WINDOW_MS: 60000, // 1 minute window
};

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' // Replace with your actual domain
    : '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Rate limiting function
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT.MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    };
  }
  
  if (record.count >= RATE_LIMIT.MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }
  
  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT.MAX_REQUESTS - record.count,
    resetTime: record.resetTime,
  };
}

// Input validation function
function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  // Check if it's a GET request
  if (request.method !== 'GET') {
    return { valid: false, error: 'Method not allowed' };
  }
  
  // Add any specific query parameter validation here
  // For example, if you expect specific parameters:
  // const url = new URL(request.url);
  // const requiredParam = url.searchParams.get('requiredParam');
  // if (!requiredParam) {
  //   return { valid: false, error: 'Missing required parameter' };
  // }
  
  return { valid: true };
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT.WINDOW_MS);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request' },
        { 
          status: 400,
          headers: {
            ...CORS_HEADERS,
            'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }
    
    // Fetch data from external endpoint
    const res = await fetch(ENDPOINT, { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'MAPIM-Strategic-Centre/1.0',
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!res.ok) {
      console.error('External API error:', res.status, res.statusText);
      return NextResponse.json(
        { 
          error: 'External service temporarily unavailable',
          status: res.status 
        },
        { 
          status: 502,
          headers: {
            ...CORS_HEADERS,
            'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }
    
    const data = await res.json();
    
    // Validate response data structure (optional)
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid response format from external service' },
        { 
          status: 502,
          headers: {
            ...CORS_HEADERS,
            'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }
    
    return NextResponse.json(data, {
      headers: {
        ...CORS_HEADERS,
        'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
    
  } catch (err) {
    console.error('API error:', err);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + RATE_LIMIT.WINDOW_MS).toString(),
        }
      }
    );
  }
} 