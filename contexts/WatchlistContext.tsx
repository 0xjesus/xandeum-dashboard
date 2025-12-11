'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PNode } from '@/types';

const WATCHLIST_KEY = 'xandeum_watchlist';
const ALERTS_ENABLED_KEY = 'xandeum_alerts_enabled';
const LAST_STATUS_KEY = 'xandeum_last_status';

export interface WatchedNode {
  pubkey: string;
  addedAt: number;
  label?: string;
}

interface WatchlistContextType {
  watchlist: WatchedNode[];
  alertsEnabled: boolean;
  addToWatchlist: (pubkey: string, label?: string) => void;
  removeFromWatchlist: (pubkey: string) => void;
  isWatched: (pubkey: string) => boolean;
  toggleWatchlist: (pubkey: string, label?: string) => void;
  toggleAlerts: () => Promise<boolean>;
  checkNodesAndAlert: (nodes: PNode[]) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchedNode[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [lastStatus, setLastStatus] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      if (saved) {
        try {
          setWatchlist(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse watchlist:', e);
        }
      }

      const alertsSaved = localStorage.getItem(ALERTS_ENABLED_KEY);
      setAlertsEnabled(alertsSaved === 'true');

      const statusSaved = localStorage.getItem(LAST_STATUS_KEY);
      if (statusSaved) {
        try {
          setLastStatus(JSON.parse(statusSaved));
        } catch (e) {
          console.error('Failed to parse last status:', e);
        }
      }

      setIsHydrated(true);
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    }
  }, [watchlist, isHydrated]);

  // Add node to watchlist
  const addToWatchlist = useCallback((pubkey: string, label?: string) => {
    setWatchlist(prev => {
      if (prev.some(w => w.pubkey === pubkey)) return prev;
      return [...prev, { pubkey, addedAt: Date.now(), label }];
    });
  }, []);

  // Remove node from watchlist
  const removeFromWatchlist = useCallback((pubkey: string) => {
    setWatchlist(prev => prev.filter(w => w.pubkey !== pubkey));
  }, []);

  // Check if node is in watchlist
  const isWatched = useCallback((pubkey: string) => {
    return watchlist.some(w => w.pubkey === pubkey);
  }, [watchlist]);

  // Toggle watchlist
  const toggleWatchlist = useCallback((pubkey: string, label?: string) => {
    setWatchlist(prev => {
      const exists = prev.some(w => w.pubkey === pubkey);
      if (exists) {
        return prev.filter(w => w.pubkey !== pubkey);
      } else {
        return [...prev, { pubkey, addedAt: Date.now(), label }];
      }
    });
  }, []);

  // Enable/disable alerts
  const toggleAlerts = useCallback(async () => {
    if (!alertsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setAlertsEnabled(true);
          localStorage.setItem(ALERTS_ENABLED_KEY, 'true');
          return true;
        }
        return false;
      }
      return false;
    } else {
      setAlertsEnabled(false);
      localStorage.setItem(ALERTS_ENABLED_KEY, 'false');
      return true;
    }
  }, [alertsEnabled]);

  // Check nodes and send alerts
  const checkNodesAndAlert = useCallback((nodes: PNode[]) => {
    if (!alertsEnabled || watchlist.length === 0) return;

    const newStatus: Record<string, string> = {};

    watchlist.forEach(watched => {
      const node = nodes.find(n => n.pubkey === watched.pubkey);
      const currentStatus = node?.status || 'missing';
      newStatus[watched.pubkey] = currentStatus;

      const previousStatus = lastStatus[watched.pubkey];

      if (previousStatus && previousStatus !== currentStatus) {
        if (currentStatus === 'offline' || currentStatus === 'missing') {
          sendNotification(
            'Node Alert',
            `Node ${watched.label || watched.pubkey.slice(0, 8)}... is now ${currentStatus === 'missing' ? 'not in gossip' : currentStatus}!`,
            'warning'
          );
        } else if (currentStatus === 'degraded' && previousStatus === 'online') {
          sendNotification(
            'Node Degraded',
            `Node ${watched.label || watched.pubkey.slice(0, 8)}... performance is degraded.`,
            'info'
          );
        } else if (currentStatus === 'online' && (previousStatus === 'offline' || previousStatus === 'missing')) {
          sendNotification(
            'Node Online',
            `Node ${watched.label || watched.pubkey.slice(0, 8)}... is back online!`,
            'success'
          );
        }
      }
    });

    setLastStatus(newStatus);
    localStorage.setItem(LAST_STATUS_KEY, JSON.stringify(newStatus));
  }, [alertsEnabled, watchlist, lastStatus]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        alertsEnabled,
        addToWatchlist,
        removeFromWatchlist,
        isWatched,
        toggleWatchlist,
        toggleAlerts,
        checkNodesAndAlert,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

// Send browser notification
function sendNotification(title: string, body: string, type: 'warning' | 'info' | 'success') {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: `xandeum-${Date.now()}`,
      requireInteraction: type === 'warning',
    });
  }
}
