// =============================================================================
// API Route: GET /api/nodes
// Fetch all pNodes with optional filtering and sorting
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchPods } from '@/lib/xandeumClient';
import { PNode, ApiResponse, NodeFilters } from '@/types';
import { sortCompare } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const filters: NodeFilters = {
      status: (searchParams.get('status') as NodeFilters['status']) || 'all',
      version: searchParams.get('version') || 'all',
      search: searchParams.get('search') || '',
      sortBy: (searchParams.get('sortBy') as NodeFilters['sortBy']) || 'healthScore',
      sortOrder: (searchParams.get('sortOrder') as NodeFilters['sortOrder']) || 'desc',
    };

    // Fetch REAL nodes from Xandeum pRPC - NO MOCK DATA
    const nodes: PNode[] = await fetchPods();

    // Apply filters
    let filteredNodes = nodes;

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filteredNodes = filteredNodes.filter((n) => n.status === filters.status);
    }

    // Version filter
    if (filters.version && filters.version !== 'all') {
      filteredNodes = filteredNodes.filter((n) => n.version === filters.version);
    }

    // Search filter (pubkey, IP, address)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredNodes = filteredNodes.filter(
        (n) =>
          n.pubkey.toLowerCase().includes(searchLower) ||
          n.ip.toLowerCase().includes(searchLower) ||
          n.address.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filters.sortBy) {
      const sortKey =
        filters.sortBy === 'storage'
          ? 'storage_committed'
          : filters.sortBy === 'lastSeen'
            ? 'last_seen_timestamp'
            : filters.sortBy;

      filteredNodes.sort(sortCompare(sortKey as keyof PNode, filters.sortOrder));
    }

    const response: ApiResponse<{
      nodes: PNode[];
      total: number;
      filtered: number;
    }> = {
      success: true,
      data: {
        nodes: filteredNodes,
        total: nodes.length,
        filtered: filteredNodes.length,
      },
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch nodes',
      timestamp: Date.now(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
