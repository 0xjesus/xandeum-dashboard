// =============================================================================
// Metrics and Health Score Calculations
// =============================================================================

import {
  PNode,
  PNodeRaw,
  NodeStatus,
  NetworkStats,
  VersionDistributionItem,
  HealthFactors,
} from '@/types';
import { HEALTH_WEIGHTS, LATEST_VERSION, STATUS_THRESHOLDS } from './constants';
import { clamp, calculatePercent, groupBy } from './utils';

/**
 * Calculate health score for a pNode (0-100)
 * Factors: uptime, recency (last seen), storage utilization, version currency
 */
export function calculateHealthScore(
  node: PNodeRaw,
  status: NodeStatus
): number {
  const factors = calculateHealthFactors(node, status);

  const score =
    factors.uptime * HEALTH_WEIGHTS.uptime +
    factors.recency * HEALTH_WEIGHTS.recency +
    factors.storage * HEALTH_WEIGHTS.storage +
    factors.version * HEALTH_WEIGHTS.version;

  return Math.round(clamp(score, 0, 100));
}

/**
 * Calculate individual health factors
 */
export function calculateHealthFactors(
  node: PNodeRaw,
  status: NodeStatus
): HealthFactors {
  // Uptime factor: longer uptime = better (max at 30 days)
  const maxUptime = 30 * 24 * 60 * 60; // 30 days in seconds
  const uptimeFactor = clamp((node.uptime / maxUptime) * 100, 0, 100);

  // Recency factor: based on status
  let recencyFactor: number;
  switch (status) {
    case 'online':
      recencyFactor = 100;
      break;
    case 'degraded':
      recencyFactor = 50;
      break;
    case 'offline':
      recencyFactor = 0;
      break;
  }

  // Storage factor: reasonable utilization (10-80%) is optimal
  // Too low means underutilized, too high means potentially at risk
  const utilization = node.storage_usage_percent;
  let storageFactor: number;
  if (utilization < 5) {
    storageFactor = 50; // Just started or underutilized
  } else if (utilization <= 80) {
    storageFactor = 100; // Optimal range
  } else if (utilization <= 95) {
    storageFactor = 70; // Getting full
  } else {
    storageFactor = 40; // Nearly full
  }

  // Version factor: latest version gets full score
  const isLatestVersion = node.version === LATEST_VERSION;
  const versionFactor = isLatestVersion ? 100 : 60;

  return {
    uptime: uptimeFactor,
    recency: recencyFactor,
    storage: storageFactor,
    version: versionFactor,
  };
}

/**
 * Get health score color class
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get health score background gradient
 */
export function getHealthScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-yellow-500 to-amber-500';
  if (score >= 40) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-red-700';
}

/**
 * Get health score label
 */
export function getHealthScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Poor';
  return 'Critical';
}

/**
 * Calculate aggregate network statistics
 */
export function calculateNetworkStats(nodes: PNode[]): NetworkStats {
  if (nodes.length === 0) {
    return {
      totalNodes: 0,
      onlineNodes: 0,
      degradedNodes: 0,
      offlineNodes: 0,
      totalStorageCommitted: 0,
      totalStorageUsed: 0,
      averageUptime: 0,
      averageHealthScore: 0,
      versionDistribution: {},
      storageUtilization: 0,
    };
  }

  const statusCounts = {
    online: 0,
    degraded: 0,
    offline: 0,
  };

  let totalStorageCommitted = 0;
  let totalStorageUsed = 0;
  let totalUptime = 0;
  let totalHealthScore = 0;
  const versionCounts: Record<string, number> = {};

  for (const node of nodes) {
    statusCounts[node.status]++;
    totalStorageCommitted += node.storage_committed;
    totalStorageUsed += node.storage_used;
    totalUptime += node.uptime;
    totalHealthScore += node.healthScore;

    if (!versionCounts[node.version]) {
      versionCounts[node.version] = 0;
    }
    versionCounts[node.version]++;
  }

  return {
    totalNodes: nodes.length,
    onlineNodes: statusCounts.online,
    degradedNodes: statusCounts.degraded,
    offlineNodes: statusCounts.offline,
    totalStorageCommitted,
    totalStorageUsed,
    averageUptime: Math.round(totalUptime / nodes.length),
    averageHealthScore: Math.round(totalHealthScore / nodes.length),
    versionDistribution: versionCounts,
    storageUtilization:
      totalStorageCommitted > 0
        ? calculatePercent(totalStorageUsed, totalStorageCommitted)
        : 0,
  };
}

/**
 * Get version distribution for charts
 */
export function getVersionDistribution(nodes: PNode[]): VersionDistributionItem[] {
  const grouped = groupBy(nodes, 'version');
  const total = nodes.length;

  return Object.entries(grouped)
    .map(([version, versionNodes]) => ({
      version,
      count: versionNodes.length,
      percentage: calculatePercent(versionNodes.length, total),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get status distribution
 */
export function getStatusDistribution(
  nodes: PNode[]
): { status: NodeStatus; count: number; percentage: number }[] {
  const grouped = groupBy(nodes, 'status');
  const total = nodes.length;
  const statuses: NodeStatus[] = ['online', 'degraded', 'offline'];

  return statuses.map((status) => ({
    status,
    count: grouped[status]?.length || 0,
    percentage: calculatePercent(grouped[status]?.length || 0, total),
  }));
}

/**
 * Rank nodes by health score
 */
export function rankNodesByHealth(nodes: PNode[]): PNode[] {
  return [...nodes].sort((a, b) => b.healthScore - a.healthScore);
}

/**
 * Get top performing nodes
 */
export function getTopNodes(nodes: PNode[], count = 10): PNode[] {
  return rankNodesByHealth(nodes).slice(0, count);
}

/**
 * Identify nodes that need attention
 */
export function getNodesNeedingAttention(nodes: PNode[]): {
  outdated: PNode[];
  lowHealth: PNode[];
  highStorage: PNode[];
} {
  return {
    outdated: nodes.filter((n) => n.version !== LATEST_VERSION),
    lowHealth: nodes.filter((n) => n.healthScore < 50),
    highStorage: nodes.filter((n) => n.storage_usage_percent > 90),
  };
}

/**
 * Calculate network health summary
 */
export function getNetworkHealthSummary(stats: NetworkStats): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
} {
  const onlinePercent = calculatePercent(stats.onlineNodes, stats.totalNodes);
  const offlinePercent = calculatePercent(stats.offlineNodes, stats.totalNodes);

  if (offlinePercent > 30) {
    return {
      status: 'critical',
      message: `${offlinePercent.toFixed(0)}% of nodes are offline`,
    };
  }

  if (offlinePercent > 10 || onlinePercent < 80) {
    return {
      status: 'warning',
      message: `${stats.degradedNodes + stats.offlineNodes} nodes need attention`,
    };
  }

  return {
    status: 'healthy',
    message: `Network is healthy with ${onlinePercent.toFixed(0)}% nodes online`,
  };
}
