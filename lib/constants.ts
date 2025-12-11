// =============================================================================
// Configuration Constants
// =============================================================================

/**
 * pRPC endpoint configuration
 */
export const PRPC_CONFIG = {
  // Primary public entrypoint
  endpoint: 'http://45.151.122.71:6000/rpc',
  // Fallback endpoints (in order of preference)
  fallbackEndpoints: [
    'http://192.190.136.36:6000/rpc',
    'http://62.171.135.107:6000/rpc',
    'http://173.212.207.32:6000/rpc',
  ],
  // Timeout for requests in ms
  timeout: 10000,
  // Retry attempts
  retries: 3,
  // Retry delay in ms
  retryDelay: 1000,
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Default TTL in seconds
  ttl: parseInt(process.env.CACHE_TTL || '60', 10),
  // Stale-while-revalidate time in seconds
  swr: 300,
};

/**
 * Node status thresholds (in seconds)
 */
export const STATUS_THRESHOLDS = {
  // Considered online if seen within this time
  online: 120,
  // Considered degraded if seen within this time
  degraded: 300,
  // Beyond this is offline
};

/**
 * Health score weights (must sum to 1)
 */
export const HEALTH_WEIGHTS = {
  uptime: 0.3,
  recency: 0.35,
  storage: 0.2,
  version: 0.15,
};

/**
 * Storage size constants
 */
export const STORAGE_UNITS = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
  PB: 1024 ** 5,
};

/**
 * Latest known stable version (update as needed)
 */
export const LATEST_VERSION = '0.7.3';

/**
 * UI configuration
 */
export const UI_CONFIG = {
  // Number of nodes per page in table
  pageSize: 25,
  // Maximum nodes for comparison
  maxCompareNodes: 4,
  // Refresh interval for dashboard (ms)
  refreshInterval: 30000,
  // Animation duration (ms)
  animationDuration: 300,
};

/**
 * Chart colors - Xandeum branded
 */
export const CHART_COLORS = {
  // Primary Xandeum colors
  primary: '#F3771F',     // Xandeum Orange
  secondary: '#1C3850',   // Xandeum Dark Blue
  tertiary: '#5D2554',    // Xandeum Purple
  quaternary: '#0A1039',  // Xandeum Very Dark Blue
  // Status colors
  online: '#22c55e',
  degraded: '#F3771F',    // Use Xandeum orange for degraded
  offline: '#ef4444',
  // Feature colors
  storage: '#5D2554',     // Xandeum Purple
  performance: '#1C3850', // Xandeum Dark Blue
  health: '#F3771F',      // Xandeum Orange
};

/**
 * App metadata
 */
export const APP_META = {
  name: 'Xandeum pNodes Analytics',
  description: 'Real-time analytics platform for Xandeum storage provider nodes',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://xandeum-analytics.vercel.app',
};
