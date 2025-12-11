'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Star,
  Bell,
  BellOff,
  Trash2,
  ExternalLink,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/nodes/StatusBadge';
import { HealthScore } from '@/components/nodes/HealthScore';
import { InfoTooltip } from '@/components/common/MetricTooltip';
import { useWatchlist } from '@/hooks/useWatchlist';
import { PNode } from '@/types';
import { truncateMiddle } from '@/lib/utils';

interface OperatorToolsProps {
  nodes: PNode[];
  isLoading?: boolean;
}

export function OperatorTools({ nodes, isLoading }: OperatorToolsProps) {
  const {
    watchlist,
    alertsEnabled,
    toggleWatchlist,
    toggleAlerts,
    checkNodesAndAlert,
    removeFromWatchlist,
  } = useWatchlist();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Check nodes and trigger alerts when nodes data changes
  useEffect(() => {
    if (nodes.length > 0 && alertsEnabled) {
      checkNodesAndAlert(nodes);
    }
  }, [nodes, alertsEnabled, checkNodesAndAlert]);

  // Get watched nodes with their current data
  const watchedNodesWithData = watchlist.map(watched => {
    const nodeData = nodes.find(n => n.pubkey === watched.pubkey);
    return {
      ...watched,
      node: nodeData,
      status: nodeData?.status || 'missing',
    };
  });

  const handleToggleAlerts = async () => {
    const success = await toggleAlerts();
    if (success && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Operator Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Operator Tools
                <InfoTooltip term="watchlist" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">Monitor your nodes & get alerts</p>
            </div>
          </div>

          {/* Alerts Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {alertsEnabled ? (
                <Bell className="h-4 w-4 text-green-500" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">Alerts</span>
              <InfoTooltip term="alerts" />
            </div>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={handleToggleAlerts}
              disabled={notificationPermission === 'denied'}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Permission Warning */}
        {notificationPermission === 'denied' && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500">
              Notifications blocked. Enable them in browser settings.
            </span>
          </div>
        )}

        {/* Watchlist */}
        {watchlist.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-2">No nodes in watchlist</p>
            <p className="text-sm text-muted-foreground">
              Click the <Star className="h-3 w-3 inline mx-1" /> icon on any node to add it
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {watchedNodesWithData.map((watched) => (
                <motion.div
                  key={watched.pubkey}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    watched.status === 'online'
                      ? 'bg-green-500/5 border-green-500/20'
                      : watched.status === 'degraded'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {watched.status === 'online' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : watched.status === 'degraded' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  {/* Node Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium truncate">
                        {truncateMiddle(watched.pubkey, 8, 6)}
                      </span>
                      {watched.node && (
                        <HealthScore score={watched.node.healthScore} size="sm" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={watched.status as any} size="sm" />
                      {watched.label && (
                        <span className="text-xs text-muted-foreground">{watched.label}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {watched.node && (
                      <Link href={`/nodes/${watched.pubkey}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => removeFromWatchlist(watched.pubkey)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats Footer */}
        {watchlist.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-green-500">
                {watchedNodesWithData.filter(w => w.status === 'online').length}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-500">
                {watchedNodesWithData.filter(w => w.status === 'degraded').length}
              </p>
              <p className="text-xs text-muted-foreground">Degraded</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">
                {watchedNodesWithData.filter(w => w.status === 'offline' || w.status === 'missing').length}
              </p>
              <p className="text-xs text-muted-foreground">Offline</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
