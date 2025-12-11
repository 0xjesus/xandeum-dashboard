'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Server, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PNode } from '@/types';
import { truncateMiddle, formatRelativeTime } from '@/lib/utils';

interface LiveActivityProps {
  nodes: PNode[];
  isLoading?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'online' | 'degraded' | 'offline' | 'high_health' | 'low_health';
  node: PNode;
  timestamp: number;
}

export function LiveActivity({ nodes, isLoading }: LiveActivityProps) {
  // Generate activities from REAL node data - no simulation
  const activities = useMemo(() => {
    if (nodes.length === 0) return [];

    // Sort by last_seen_timestamp to show most recent activity
    const sortedNodes = [...nodes]
      .sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp)
      .slice(0, 15);

    return sortedNodes.map((node): ActivityItem => {
      // Determine activity type based on real node status and health
      let type: ActivityItem['type'];
      if (node.status === 'online' && node.healthScore >= 90) {
        type = 'high_health';
      } else if (node.status === 'online') {
        type = 'online';
      } else if (node.status === 'degraded') {
        type = 'degraded';
      } else if (node.healthScore < 50) {
        type = 'low_health';
      } else {
        type = 'offline';
      }

      return {
        id: node.pubkey,
        type,
        node,
        timestamp: node.last_seen_timestamp,
      };
    });
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'high_health':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'online':
        return <Server className="h-4 w-4 text-blue-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low_health':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'offline':
        return <Server className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'high_health':
        return `Excellent health (${activity.node.healthScore}%)`;
      case 'online':
        return `Online (${activity.node.healthScore}% health)`;
      case 'degraded':
        return `Degraded performance`;
      case 'low_health':
        return `Low health (${activity.node.healthScore}%)`;
      case 'offline':
        return `Last seen`;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'high_health':
        return 'border-l-green-500 bg-green-500/5';
      case 'online':
        return 'border-l-blue-500 bg-blue-500/5';
      case 'degraded':
        return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low_health':
        return 'border-l-red-500 bg-red-500/5';
      case 'offline':
        return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  return (
    <Card className="h-[400px] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-xandeum-orange" />
          Recent Node Activity
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            Based on last_seen data
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-lg border-l-2 ${getActivityColor(activity.type)}`}
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {truncateMiddle(activity.node.pubkey, 8, 6)} • {activity.node.ip}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(activity.timestamp)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
