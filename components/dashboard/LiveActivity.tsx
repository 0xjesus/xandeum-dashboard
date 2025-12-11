'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Server, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PNode } from '@/types';
import { truncateMiddle, formatRelativeTime } from '@/lib/utils';

interface LiveActivityProps {
  nodes: PNode[];
  isLoading?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'online' | 'heartbeat' | 'storage';
  node: PNode;
  timestamp: number;
}

export function LiveActivity({ nodes, isLoading }: LiveActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;

    // Generate initial activities from recent nodes
    const recentNodes = [...nodes]
      .sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp)
      .slice(0, 10);

    const initialActivities: ActivityItem[] = recentNodes.map((node, i) => ({
      id: `${node.pubkey}-${i}`,
      type: node.status === 'online' ? 'heartbeat' : 'online',
      node,
      timestamp: node.last_seen_timestamp,
    }));

    setActivities(initialActivities);

    // Simulate live activity updates
    const interval = setInterval(() => {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (randomNode) {
        const types: ActivityItem['type'][] = ['online', 'heartbeat', 'storage'];
        const newActivity: ActivityItem = {
          id: `${randomNode.pubkey}-${Date.now()}`,
          type: types[Math.floor(Math.random() * types.length)],
          node: randomNode,
          timestamp: Math.floor(Date.now() / 1000),
        };

        setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
      }
    }, 3000);

    return () => clearInterval(interval);
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
      case 'online':
        return <Server className="h-4 w-4 text-green-500" />;
      case 'heartbeat':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'storage':
        return <Activity className="h-4 w-4 text-purple-500" />;
    }
  };

  const getActivityText = (type: ActivityItem['type']) => {
    switch (type) {
      case 'online':
        return 'Node came online';
      case 'heartbeat':
        return 'Heartbeat received';
      case 'storage':
        return 'Storage updated';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'online':
        return 'border-l-green-500 bg-green-500/5';
      case 'heartbeat':
        return 'border-l-blue-500 bg-blue-500/5';
      case 'storage':
        return 'border-l-purple-500 bg-purple-500/5';
    }
  };

  return (
    <Card className="h-[400px] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Activity className="h-5 w-5 text-green-500" />
          </motion.div>
          Live Activity
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-lg border-l-2 ${getActivityColor(activity.type)}`}
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getActivityText(activity.type)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {truncateMiddle(activity.node.pubkey, 8, 6)}
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
