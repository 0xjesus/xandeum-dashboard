'use client';

import useSWR from 'swr';
import { PNode, NodeFilters, NetworkStats, HealthFactors, NodeStatus } from '@/types';
import { UI_CONFIG, HEALTH_WEIGHTS, LATEST_VERSION } from '@/lib/constants';
import { fetchPodsClient } from '@/lib/clientPrpc';

// Cache for nodes data
let nodesCache: { data: PNode[]; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Fetcher that uses direct pRPC from client
 */
const fetchNodes = async (): Promise<{ nodes: PNode[]; total: number; filtered: number }> => {
  // Check cache
  if (nodesCache && Date.now() - nodesCache.timestamp < CACHE_TTL) {
    return {
      nodes: nodesCache.data,
      total: nodesCache.data.length,
      filtered: nodesCache.data.length,
    };
  }

  const nodes = await fetchPodsClient();

  // Update cache
  nodesCache = { data: nodes, timestamp: Date.now() };

  return {
    nodes,
    total: nodes.length,
    filtered: nodes.length,
  };
};

/**
 * Calculate health factors for a node
 */
function calculateHealthFactors(node: PNode): HealthFactors {
  const now = Math.floor(Date.now() / 1000);
  const lastSeenTs = node.last_seen_timestamp;
  const secondsSinceLastSeen = now - lastSeenTs;

  // Uptime score (0-100)
  const uptimeHours = node.uptime / 3600;
  const uptime = Math.min(100, (uptimeHours / 168) * 100);

  // Recency score (0-100)
  const recency = Math.max(0, 100 - (secondsSinceLastSeen / 300) * 100);

  // Storage score (0-100)
  const storagePercent = node.storage_usage_percent;
  const storage = storagePercent < 80 ? 100 : storagePercent < 95 ? 70 : 30;

  // Version score (0-100)
  const version = node.version === LATEST_VERSION ? 100 : node.version?.startsWith('0.7') ? 80 : 50;

  return { uptime, recency, storage, version };
}

/**
 * Calculate network stats from nodes
 */
function calculateNetworkStats(nodes: PNode[]): NetworkStats {
  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter((n) => n.status === 'online').length;
  const degradedNodes = nodes.filter((n) => n.status === 'degraded').length;
  const offlineNodes = nodes.filter((n) => n.status === 'offline').length;

  const totalStorageCommitted = nodes.reduce((sum, n) => sum + n.storage_committed, 0);
  const totalStorageUsed = nodes.reduce((sum, n) => sum + n.storage_used, 0);
  const storageUtilization = totalStorageCommitted > 0 ? (totalStorageUsed / totalStorageCommitted) * 100 : 0;

  const totalUptime = nodes.reduce((sum, n) => sum + n.uptime, 0);
  const averageUptime = totalNodes > 0 ? totalUptime / totalNodes : 0;

  const totalHealth = nodes.reduce((sum, n) => sum + n.healthScore, 0);
  const averageHealthScore = totalNodes > 0 ? totalHealth / totalNodes : 0;

  // Version distribution as Record
  const versionDistribution: Record<string, number> = {};
  nodes.forEach((node) => {
    versionDistribution[node.version] = (versionDistribution[node.version] || 0) + 1;
  });

  return {
    totalNodes,
    onlineNodes,
    degradedNodes,
    offlineNodes,
    totalStorageCommitted,
    totalStorageUsed,
    storageUtilization,
    averageUptime,
    averageHealthScore,
    versionDistribution,
  };
}

/**
 * Get version distribution
 */
function getVersionDistribution(nodes: PNode[]) {
  const versionCounts = new Map<string, number>();
  nodes.forEach((node) => {
    const count = versionCounts.get(node.version) || 0;
    versionCounts.set(node.version, count + 1);
  });

  return Array.from(versionCounts.entries())
    .map(([version, count]) => ({
      version,
      count,
      percentage: (count / nodes.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get status distribution
 */
function getStatusDistribution(nodes: PNode[]): { status: NodeStatus; count: number; percentage: number }[] {
  const statuses: NodeStatus[] = ['online', 'degraded', 'offline'];
  return statuses.map((status) => {
    const count = nodes.filter((n) => n.status === status).length;
    return {
      status,
      count,
      percentage: nodes.length > 0 ? (count / nodes.length) * 100 : 0,
    };
  });
}

/**
 * Get top nodes by health score
 */
function getTopNodes(nodes: PNode[], limit: number): PNode[] {
  return [...nodes].sort((a, b) => b.healthScore - a.healthScore).slice(0, limit);
}

/**
 * Get network health summary
 */
function getNetworkHealthSummary(stats: NetworkStats): { status: string; message: string } {
  const healthPercent = stats.averageHealthScore;
  const onlinePercent = stats.totalNodes > 0 ? (stats.onlineNodes / stats.totalNodes) * 100 : 0;

  if (healthPercent >= 80 && onlinePercent >= 90) {
    return { status: 'excellent', message: 'Network is performing optimally' };
  } else if (healthPercent >= 60 && onlinePercent >= 70) {
    return { status: 'good', message: 'Network is healthy with minor issues' };
  } else if (healthPercent >= 40 && onlinePercent >= 50) {
    return { status: 'warning', message: 'Network experiencing some degradation' };
  } else {
    return { status: 'critical', message: 'Network requires immediate attention' };
  }
}

/**
 * Hook to fetch all nodes with filters
 */
export function useNodes(filters?: NodeFilters) {
  const { data, error, isLoading, mutate } = useSWR<{ nodes: PNode[]; total: number; filtered: number }>(
    'pnodes',
    fetchNodes,
    {
      refreshInterval: UI_CONFIG.refreshInterval,
      revalidateOnFocus: false,
    }
  );

  // Apply client-side filtering
  let filteredData = data;
  if (data && filters) {
    let nodes = [...data.nodes];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      nodes = nodes.filter((n) => n.status === filters.status);
    }

    // Version filter
    if (filters.version && filters.version !== 'all') {
      nodes = nodes.filter((n) => n.version === filters.version);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.pubkey.toLowerCase().includes(searchLower) ||
          n.ip.toLowerCase().includes(searchLower) ||
          n.address.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filters.sortBy) {
      const sortKey = filters.sortBy === 'storage' ? 'storage_committed' : filters.sortBy === 'lastSeen' ? 'last_seen_timestamp' : filters.sortBy;
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      nodes.sort((a, b) => {
        const aVal = a[sortKey as keyof PNode];
        const bVal = b[sortKey as keyof PNode];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        return String(aVal).localeCompare(String(bVal)) * order;
      });
    }

    filteredData = {
      nodes,
      total: data.total,
      filtered: nodes.length,
    };
  }

  return {
    data: filteredData,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Hook to fetch a single node
 */
export function useNode(pubkey: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ nodes: PNode[]; total: number; filtered: number }>(
    pubkey ? 'pnodes' : null,
    fetchNodes,
    {
      refreshInterval: UI_CONFIG.refreshInterval,
      revalidateOnFocus: false,
    }
  );

  const node = data?.nodes.find((n) => n.pubkey === pubkey) || null;
  const healthFactors = node ? calculateHealthFactors(node) : null;

  return {
    data: node && healthFactors ? { node, healthFactors } : undefined,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Hook to fetch network statistics
 */
export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<{ nodes: PNode[]; total: number; filtered: number }>(
    'pnodes',
    fetchNodes,
    {
      refreshInterval: UI_CONFIG.refreshInterval,
      revalidateOnFocus: false,
    }
  );

  if (!data) {
    return { data: undefined, error, isLoading, mutate };
  }

  const nodes = data.nodes;
  const network = calculateNetworkStats(nodes);
  const versionDistribution = getVersionDistribution(nodes);
  const statusDistribution = getStatusDistribution(nodes);
  const topNodes = getTopNodes(nodes, 5);
  const healthSummary = getNetworkHealthSummary(network);

  const outdatedCount = nodes.filter((n) => n.version !== LATEST_VERSION).length;
  const lowHealthCount = nodes.filter((n) => n.healthScore < 50).length;
  const highStorageCount = nodes.filter((n) => n.storage_usage_percent > 80).length;

  return {
    data: {
      network,
      versionDistribution,
      statusDistribution,
      topNodes,
      needsAttention: {
        outdatedCount,
        lowHealthCount,
        highStorageCount,
      },
      healthSummary,
    },
    error,
    isLoading,
    mutate,
  };
}

/**
 * Hook to get unique versions from nodes
 */
export function useVersions() {
  const { data } = useNodes();

  if (!data?.nodes) return [];

  const versions = new Set(data.nodes.map((n) => n.version));
  return Array.from(versions).sort((a, b) => b.localeCompare(a));
}
