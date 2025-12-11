// =============================================================================
// API Route: POST /api/proxy
// Proxy to pRPC - Using Edge Runtime for better network connectivity
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// Use Edge Runtime - has fewer network restrictions than Node.js serverless
export const runtime = 'edge';
export const preferredRegion = ['fra1', 'iad1', 'sfo1']; // Multiple regions for redundancy

const ENDPOINTS = [
  'http://45.151.122.71:6000/rpc',
  'http://192.190.136.36:6000/rpc',
  'http://62.171.135.107:6000/rpc',
  'http://154.38.175.38:6000/rpc',
  'http://152.53.236.91:6000/rpc',
];

const TIMEOUT = 8000;

async function tryEndpoint(endpoint: string, body: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    for (const endpoint of ENDPOINTS) {
      try {
        console.log(`[Edge Proxy] Trying: ${endpoint}`);
        const response = await tryEndpoint(endpoint, body);

        if (response.ok) {
          const data = await response.json();
          console.log(`[Edge Proxy] Success from: ${endpoint}`);

          return NextResponse.json(data, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
            },
          });
        }
      } catch (error) {
        console.log(`[Edge Proxy] Failed ${endpoint}:`, error);
      }
    }

    return NextResponse.json(
      { error: 'All pRPC endpoints unreachable' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[Edge Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
