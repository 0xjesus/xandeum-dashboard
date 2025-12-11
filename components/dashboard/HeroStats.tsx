'use client';

import { motion } from 'framer-motion';
import { Server, HardDrive, Activity, Zap, HelpCircle } from 'lucide-react';
import { NetworkStats } from '@/types';
import { formatBytes } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeroStatsProps {
  stats: NetworkStats | null;
  isLoading?: boolean;
}

const statsConfig = [
  {
    key: 'totalNodes',
    label: 'Total Nodes',
    icon: Server,
    format: (v: number) => v.toString(),
    color: 'from-xandeum-blue to-blue-400',
    glow: 'shadow-xandeum-blue/20',
    tooltip: 'Total number of pNodes registered in the Xandeum network. Each pNode provides distributed storage capacity for sedApps.',
  },
  {
    key: 'onlineNodes',
    label: 'Online',
    icon: Activity,
    format: (v: number) => v.toString(),
    color: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/20',
    tooltip: 'pNodes currently active and responding to network requests. A node is considered online if seen within the last 2 minutes.',
  },
  {
    key: 'totalStorageCommitted',
    label: 'Network Storage',
    icon: HardDrive,
    format: (v: number) => formatBytes(v),
    color: 'from-xandeum-purple to-pink-500',
    glow: 'shadow-xandeum-purple/20',
    tooltip: 'Total storage capacity committed to the Xandeum network by all pNodes. This represents the combined storage available for sedApps.',
  },
  {
    key: 'averageHealthScore',
    label: 'Avg Health',
    icon: Zap,
    format: (v: number) => `${Math.round(v)}%`,
    color: 'from-xandeum-orange to-amber-400',
    glow: 'shadow-xandeum-orange/20',
    tooltip: 'Average health score across all nodes. Health is calculated from: uptime (30%), recency (35%), storage efficiency (20%), and software version (15%).',
  },
];

export function HeroStats({ stats: networkStats, isLoading }: HeroStatsProps) {
  if (isLoading || !networkStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10" />
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-10 bg-muted rounded-xl" />
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat, i) => {
        const value = networkStats[stat.key as keyof NetworkStats] as number;
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative group cursor-pointer"
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl blur-xl -z-10`} />

            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 shadow-lg ${stat.glow} group-hover:shadow-xl transition-all`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-grid-pattern" />
              </div>

              {/* Header with icon and tooltip */}
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </motion.div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] text-sm">
                    <p>{stat.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Value */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: i * 0.1 + 0.2 }}
              >
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  {stat.format(value)}
                </p>
              </motion.div>

              {/* Label */}
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>

              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100`}
                  style={{
                    maskImage: 'linear-gradient(transparent 50%, black)',
                    WebkitMaskImage: 'linear-gradient(transparent 50%, black)',
                  }}
                  initial={{ y: '100%' }}
                  whileHover={{ y: '50%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
