// =============================================================================
// API Route: GET /api/nodes/[pubkey]
// Fetch a single pNode by public key
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchNode } from '@/lib/xandeumClient';
import { PNode, ApiResponse } from '@/types';
import { calculateHealthFactors } from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: { pubkey: string } }
) {
  try {
    const { pubkey } = params;

    if (!pubkey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Public key is required',
          timestamp: Date.now(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Fetch REAL node from Xandeum pRPC - NO MOCK DATA
    const node: PNode | null = await fetchNode(pubkey);

    if (!node) {
      return NextResponse.json(
        {
          success: false,
          error: 'Node not found',
          timestamp: Date.now(),
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Calculate additional health factors for detail view
    const healthFactors = calculateHealthFactors(node, node.status);

    const response: ApiResponse<{
      node: PNode;
      healthFactors: typeof healthFactors;
    }> = {
      success: true,
      data: {
        node,
        healthFactors,
      },
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching node:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch node',
      timestamp: Date.now(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
