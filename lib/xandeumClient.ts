// =============================================================================
// Xandeum pRPC Client
// Handles all communication with pNode RPC endpoints
// =============================================================================

import {
  PNodeRaw,
  PNode,
  PRPCRequest,
  PRPCResponse,
  VersionResponse,
  StatsResponse,
  PodsResponse,
  NodeStatus,
} from '@/types';
import { PRPC_CONFIG, STATUS_THRESHOLDS, LATEST_VERSION } from './constants';
import { delay, formatBytes, formatUptime, parseAddress } from './utils';
import { calculateHealthScore } from './metrics';

// In-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get cached data if valid
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl * 1000) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cache data
 */
function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Make a pRPC request to a single endpoint
 */
async function tryPrpcRequest<T>(
  url: string,
  requestBody: PRPCRequest
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PRPC_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: PRPCResponse<T> = await response.json();

    if (data.error) {
      throw new Error(`pRPC error: ${data.error.message} (code: ${data.error.code})`);
    }

    if (data.result === undefined) {
      throw new Error('No result in pRPC response');
    }

    return data.result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Make a pRPC request with retry logic and fallback endpoints
 */
async function prpcRequest<T>(
  method: string,
  params?: unknown[],
  endpoint?: string
): Promise<T> {
  const requestBody: PRPCRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(),
  };

  // If a specific endpoint is provided, only try that one
  if (endpoint) {
    return tryPrpcRequest<T>(endpoint, requestBody);
  }

  // Build list of endpoints to try: primary + fallbacks
  const endpoints = [PRPC_CONFIG.endpoint, ...PRPC_CONFIG.fallbackEndpoints];
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      console.log(`Trying pRPC endpoint: ${url}`);
      const result = await tryPrpcRequest<T>(url, requestBody);
      console.log(`Success with endpoint: ${url}`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Failed endpoint ${url}: ${lastError.message}`);
      // Continue to next endpoint
    }
  }

  throw lastError || new Error('All pRPC endpoints failed');
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
 * Handles null/undefined values from pRPC
 */
function transformPNode(raw: PNodeRaw): PNode {
  const { ip, port } = parseAddress(raw.address);
  const status = determineStatus(raw.last_seen_timestamp);

  // Safely handle nullable values
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

// =============================================================================
// Public API
// =============================================================================

/**
 * Fetch pNode version
 */
export async function fetchVersion(endpoint?: string): Promise<VersionResponse> {
  const cacheKey = `version:${endpoint || 'default'}`;
  const cached = getFromCache<VersionResponse>(cacheKey);
  if (cached) return cached;

  const result = await prpcRequest<VersionResponse>('get-version', undefined, endpoint);
  setCache(cacheKey, result, 300); // Cache for 5 minutes
  return result;
}

/**
 * Fetch node stats
 */
export async function fetchStats(endpoint?: string): Promise<StatsResponse> {
  const cacheKey = `stats:${endpoint || 'default'}`;
  const cached = getFromCache<StatsResponse>(cacheKey);
  if (cached) return cached;

  const result = await prpcRequest<StatsResponse>('get-stats', undefined, endpoint);
  setCache(cacheKey, result, 30); // Cache for 30 seconds
  return result;
}

/**
 * Fetch all pods (pNodes) with stats
 */
export async function fetchPods(endpoint?: string): Promise<PNode[]> {
  const cacheKey = `pods:${endpoint || 'default'}`;
  const cached = getFromCache<PNode[]>(cacheKey);
  if (cached) return cached;

  // Try get-pods-with-stats first (more detailed)
  try {
    const result = await prpcRequest<{ pods: PNodeRaw[] } | PNodeRaw[]>('get-pods-with-stats', undefined, endpoint);

    // Handle both response formats: { pods: [...] } or direct array
    let rawPods: PNodeRaw[];
    if (Array.isArray(result)) {
      rawPods = result;
    } else if (result && 'pods' in result && Array.isArray(result.pods)) {
      rawPods = result.pods;
    } else {
      rawPods = [];
    }

    // Filter out nodes with null/missing essential fields and transform
    const validPods = rawPods.filter(pod =>
      pod.pubkey &&
      pod.address &&
      pod.last_seen_timestamp != null
    );

    const nodes = validPods.map(transformPNode);
    setCache(cacheKey, nodes, 60);
    return nodes;
  } catch (e) {
    console.error('Failed to fetch pods:', e);
    throw e;
  }
}

/**
 * Fetch a single pNode by pubkey
 */
export async function fetchNode(pubkey: string, endpoint?: string): Promise<PNode | null> {
  const nodes = await fetchPods(endpoint);
  return nodes.find((n) => n.pubkey === pubkey) || null;
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
}
