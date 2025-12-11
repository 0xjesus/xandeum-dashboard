'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, Medal, Crown, Zap } from 'lucide-react';
import { PNode } from '@/types';

interface UptimeLeaderboardProps {
  nodes: PNode[];
  isLoading?: boolean;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function UptimeLeaderboard({ nodes, isLoading }: UptimeLeaderboardProps) {
  const topNodes = useMemo(() => {
    return [...nodes]
      .filter(n => n.status === 'online')
      .sort((a, b) => b.uptime - a.uptime)
      .slice(0, 10);
  }, [nodes]);

  const maxUptime = topNodes[0]?.uptime || 1;

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Uptime Champions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-white/50">#{rank + 1}</span>;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 0:
        return 'from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/30';
      case 1:
        return 'from-gray-300/20 via-gray-300/10 to-transparent border-gray-300/30';
      case 2:
        return 'from-amber-600/20 via-amber-600/10 to-transparent border-amber-600/30';
      default:
        return 'from-white/5 to-transparent border-white/10';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Uptime Champions</CardTitle>
              <p className="text-sm text-muted-foreground">Top performing nodes by uptime</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Live ranking</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {topNodes.map((node, index) => {
          const uptimePercent = (node.uptime / maxUptime) * 100;

          return (
            <motion.div
              key={node.pubkey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${getRankGradient(index)} p-3`}
            >
              {/* Progress bar background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-xandeum-orange/20 to-transparent"
                initial={{ width: 0 }}
                animate={{ width: `${uptimePercent}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />

              <div className="relative flex items-center gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>

                {/* Node info */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-white truncate">
                    {node.pubkey.slice(0, 12)}...{node.pubkey.slice(-8)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/50">{node.ip}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                      v{node.version}
                    </span>
                  </div>
                </div>

                {/* Uptime */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-xandeum-orange" />
                    <span className="text-lg font-bold text-white">
                      {formatUptime(node.uptime)}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    {node.healthScore}% health
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {topNodes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No online nodes available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
