// =============================================================================
// API Route: GET /api/stats
// Fetch aggregated network statistics
// =============================================================================

import { NextResponse } from 'next/server';
import { fetchPods } from '@/lib/xandeumClient';
import {
  calculateNetworkStats,
  getVersionDistribution,
  getStatusDistribution,
  getTopNodes,
  getNodesNeedingAttention,
  getNetworkHealthSummary,
} from '@/lib/metrics';
import { ApiResponse, NetworkStats, PNode } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    // Fetch REAL nodes from Xandeum pRPC - NO MOCK DATA
    const nodes: PNode[] = await fetchPods();

    // Calculate statistics
    const networkStats = calculateNetworkStats(nodes);
    const versionDistribution = getVersionDistribution(nodes);
    const statusDistribution = getStatusDistribution(nodes);
    const topNodes = getTopNodes(nodes, 5);
    const needsAttention = getNodesNeedingAttention(nodes);
    const healthSummary = getNetworkHealthSummary(networkStats);

    const response: ApiResponse<{
      network: NetworkStats;
      versionDistribution: typeof versionDistribution;
      statusDistribution: typeof statusDistribution;
      topNodes: PNode[];
      needsAttention: {
        outdatedCount: number;
        lowHealthCount: number;
        highStorageCount: number;
      };
      healthSummary: typeof healthSummary;
    }> = {
      success: true,
      data: {
        network: networkStats,
        versionDistribution,
        statusDistribution,
        topNodes,
        needsAttention: {
          outdatedCount: needsAttention.outdated.length,
          lowHealthCount: needsAttention.lowHealth.length,
          highStorageCount: needsAttention.highStorage.length,
        },
        healthSummary,
      },
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
      timestamp: Date.now(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
