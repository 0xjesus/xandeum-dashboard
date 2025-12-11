// =============================================================================
// Xandeum pNodes Analytics Platform - Type Definitions
// =============================================================================

/**
 * Raw pNode data as returned from pRPC get-pods-with-stats
 */
export interface PNodeRaw {
  address: string;
  is_public: boolean;
  last_seen_timestamp: number;
  pubkey: string;
  rpc_port: number;
  storage_committed: number;
  storage_usage_percent: number;
  storage_used: number;
  uptime: number;
  version: string;
}

/**
 * Processed pNode with computed fields
 */
export interface PNode extends PNodeRaw {
  id: string; // Same as pubkey, for consistency
  ip: string; // Extracted from address
  gossipPort: number; // Extracted from address
  status: NodeStatus;
  healthScore: number;
  lastSeenDate: Date;
  storageCommittedFormatted: string;
  storageUsedFormatted: string;
  uptimeFormatted: string;
  region?: string; // Derived from IP geolocation if available
}

/**
 * Node status based on last_seen_timestamp
 */
export type NodeStatus = 'online' | 'degraded' | 'offline';

/**
 * pRPC JSON-RPC 2.0 request format
 */
export interface PRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[];
  id: number | string;
}

/**
 * pRPC JSON-RPC 2.0 response format
 */
export interface PRPCResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: PRPCError;
  id: number | string;
}

/**
 * pRPC error object
 */
export interface PRPCError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * get-version response
 */
export interface VersionResponse {
  version: string;
}

/**
 * get-stats response
 */
export interface StatsResponse {
  stats: {
    cpu_percent: number;
    memory_percent: number;
    memory_used: number;
    memory_total: number;
    disk_percent: number;
    disk_used: number;
    disk_total: number;
    packets_recv: number;
    packets_sent: number;
    active_streams: number;
    uptime: number;
  };
  file_size: number;
}

/**
 * get-pods response
 */
export interface PodsResponse {
  pods: PNodeRaw[];
  total_count: number;
}

/**
 * Aggregated network statistics
 */
export interface NetworkStats {
  totalNodes: number;
  onlineNodes: number;
  degradedNodes: number;
  offlineNodes: number;
  totalStorageCommitted: number;
  totalStorageUsed: number;
  averageUptime: number;
  averageHealthScore: number;
  versionDistribution: Record<string, number>;
  storageUtilization: number;
}

/**
 * Chart data point for time series
 */
export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  label?: string;
}

/**
 * Version distribution for charts
 */
export interface VersionDistributionItem {
  version: string;
  count: number;
  percentage: number;
}

/**
 * Filter options for node list
 */
export interface NodeFilters {
  status?: NodeStatus | 'all';
  version?: string | 'all';
  search?: string;
  sortBy?: 'healthScore' | 'uptime' | 'storage' | 'lastSeen';
  sortOrder?: 'asc' | 'desc';
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Comparison selection
 */
export interface CompareSelection {
  nodeIds: string[];
  maxNodes: number;
}

/**
 * Health score factors
 */
export interface HealthFactors {
  uptime: number;
  recency: number;
  storage: number;
  version: number;
}

/**
 * Node history entry for client-side tracking
 */
export interface NodeHistoryEntry {
  timestamp: number;
  uptime: number;
  storageUsed: number;
  storageUsagePercent: number;
  status: NodeStatus;
}

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Navigation item
 */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
}
