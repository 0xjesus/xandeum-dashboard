// =============================================================================
// Client-side pRPC fetcher
// Fetches directly from pRPC endpoints from the browser
// =============================================================================

import { PNodeRaw, PNode, NodeStatus } from '@/types';
import { PRPC_CONFIG, STATUS_THRESHOLDS, LATEST_VERSION, HEALTH_WEIGHTS } from './constants';
import { formatBytes, formatUptime, parseAddress } from './utils';

/**
 * Calculate health score for a node (client-side version)
 */
function calculateHealthScore(node: PNodeRaw, status: NodeStatus): number {
  let score = 0;

  // Uptime factor (30%)
  const uptimeHours = (node.uptime ?? 0) / 3600;
  const uptimeScore = Math.min(uptimeHours / 168, 1); // Max at 1 week
  score += uptimeScore * HEALTH_WEIGHTS.uptime * 100;

  // Recency factor (35%)
  const now = Math.floor(Date.now() / 1000);
  const secondsSinceLastSeen = now - node.last_seen_timestamp;
  const recencyScore = Math.max(0, 1 - secondsSinceLastSeen / 300);
  score += recencyScore * HEALTH_WEIGHTS.recency * 100;

  // Storage factor (20%)
  const storagePercent = node.storage_usage_percent ?? 0;
  const storageScore = storagePercent < 80 ? 1 : storagePercent < 95 ? 0.7 : 0.3;
  score += storageScore * HEALTH_WEIGHTS.storage * 100;

  // Version factor (15%)
  const versionScore = node.version === LATEST_VERSION ? 1 : node.version?.startsWith('0.7') ? 0.8 : 0.5;
  score += versionScore * HEALTH_WEIGHTS.version * 100;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Determine node status based on last seen timestamp
 */
function determineStatus(lastSeenTimestamp: number): NodeStatus {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - lastSeenTimestamp;

  if (diff <= STATUS_THRESHOLDS.online) return 'online';
  if (diff <= STATUS_THRESHOLDS.degraded) return 'degraded';
  return 'offline';
}

/**
 * Transform raw pNode data to processed format
 */
function transformPNode(raw: PNodeRaw): PNode {
  const { ip, port } = parseAddress(raw.address);
  const status = determineStatus(raw.last_seen_timestamp);

  const safeRaw = {
    ...raw,
    storage_committed: raw.storage_committed ?? 0,
    storage_used: raw.storage_used ?? 0,
    storage_usage_percent: raw.storage_usage_percent ?? 0,
    uptime: raw.uptime ?? 0,
    rpc_port: raw.rpc_port ?? 6000,
    is_public: raw.is_public ?? false,
    version: raw.version ?? 'unknown',
  };

  const healthScore = calculateHealthScore(safeRaw, status);

  return {
    ...safeRaw,
    id: safeRaw.pubkey,
    ip,
    gossipPort: port,
    status,
    healthScore,
    lastSeenDate: new Date(safeRaw.last_seen_timestamp * 1000),
    storageCommittedFormatted: formatBytes(safeRaw.storage_committed),
    storageUsedFormatted: formatBytes(safeRaw.storage_used),
    uptimeFormatted: formatUptime(safeRaw.uptime),
  };
}

// Proxy URL - deployed on Vercel as separate project
const PROXY_URL = 'https://proxy-server-tan.vercel.app';

/**
 * Fetch pNodes via external proxy (to bypass network restrictions)
 */
export async function fetchPodsClient(): Promise<PNode[]> {
  console.log('[Client pRPC] Fetching via proxy:', PROXY_URL);

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'get-pods-with-stats',
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || data.error || 'pRPC error');
  }

  const result = data.result;
  let rawPods: PNodeRaw[];

  if (Array.isArray(result)) {
    rawPods = result;
  } else if (result && 'pods' in result && Array.isArray(result.pods)) {
    rawPods = result.pods;
  } else {
    rawPods = [];
  }

  // Filter valid pods and transform
  const validPods = rawPods.filter(
    (pod) => pod.pubkey && pod.address && pod.last_seen_timestamp != null
  );

  const nodes = validPods.map(transformPNode);
  console.log(`[Client pRPC] Success: ${nodes.length} nodes`);
  return nodes;
}
