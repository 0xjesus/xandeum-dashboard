'use client';

import { motion } from 'framer-motion';
import {
  Server,
  HardDrive,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { NetworkStats } from '@/types';
import { formatBytes, formatUptime, formatPercent } from '@/lib/utils';

interface StatsOverviewProps {
  stats: NetworkStats | null;
  isLoading?: boolean;
}

const statCards = [
  {
    key: 'totalNodes',
    label: 'Total Nodes',
    icon: Server,
    format: (v: number) => v.toString(),
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    key: 'onlineNodes',
    label: 'Online',
    icon: Activity,
    format: (v: number) => v.toString(),
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
  {
    key: 'totalStorageCommitted',
    label: 'Total Storage',
    icon: HardDrive,
    format: (v: number) => formatBytes(v),
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  {
    key: 'averageUptime',
    label: 'Avg. Uptime',
    icon: Clock,
    format: (v: number) => formatUptime(v),
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    key: 'averageHealthScore',
    label: 'Avg. Health',
    icon: TrendingUp,
    format: (v: number) => v.toString(),
    color: 'from-xandeum-500 to-xandeum-600',
    bgColor: 'bg-xandeum-500/10',
    iconColor: 'text-xandeum-500',
  },
  {
    key: 'storageUtilization',
    label: 'Utilization',
    icon: Activity,
    format: (v: number) => formatPercent(v),
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
  },
];

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.key} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="h-6 w-16 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card, index) => {
        const value = stats[card.key as keyof NetworkStats] as number;
        const Icon = card.icon;

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Gradient accent */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`}
              />

              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  {card.key === 'onlineNodes' && stats.offlineNodes > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                      <AlertTriangle className="h-3 w-3" />
                      {stats.offlineNodes} off
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <motion.p
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                  >
                    {card.format(value)}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:to-muted/50 transition-all" />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
