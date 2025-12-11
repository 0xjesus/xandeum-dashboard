'use client';

import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NetworkStats } from '@/types';

interface PerformanceGaugeProps {
  stats: NetworkStats | null;
  isLoading?: boolean;
}

interface GaugeConfig {
  value: number;
  label: string;
  color: string;
  tooltip: string;
  maxValue?: number;
}

function Gauge({ value, label, color, tooltip, maxValue = 100 }: GaugeConfig) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const angle = (percentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-24 h-12 sm:w-32 sm:h-16 overflow-hidden cursor-help">
            {/* Background arc */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
              <path
                d="M 5 50 A 45 45 0 0 1 95 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <motion.path
                d="M 5 50 A 45 45 0 0 1 95 50"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: percentage / 100 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>

            {/* Needle */}
            <motion.div
              className="absolute bottom-0 left-1/2 origin-bottom"
              style={{ width: 2, height: '75%' }}
              initial={{ rotate: -90 }}
              animate={{ rotate: angle }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
            </motion.div>

            {/* Center dot */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-sm">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>

      <motion.p
        className="text-xl sm:text-2xl font-bold mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {value.toFixed(1)}%
      </motion.p>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center">{label}</p>
    </div>
  );
}

export function PerformanceGauge({ stats, isLoading }: PerformanceGaugeProps) {
  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            Network Performance
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex flex-col items-center">
                <div className="w-20 h-10 sm:w-32 sm:h-16 bg-muted rounded-t-full" />
                <div className="h-5 w-12 bg-muted rounded mt-2" />
                <div className="h-3 w-16 bg-muted rounded mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlinePercentage = (stats.onlineNodes / stats.totalNodes) * 100 || 0;

  const gauges: GaugeConfig[] = [
    {
      value: onlinePercentage,
      label: 'Network Uptime',
      color: '#22c55e',
      tooltip: 'Percentage of nodes currently online and responsive. Higher uptime indicates a healthier, more reliable network.',
    },
    {
      value: stats.storageUtilization,
      label: 'Storage Utilization',
      color: '#5D2554',
      tooltip: 'Percentage of committed storage currently in use across all pNodes. Shows how much of the network capacity is being utilized by sedApps.',
    },
    {
      value: stats.averageHealthScore,
      label: 'Average Health',
      color: '#F3771F',
      tooltip: 'Average health score across all pNodes. Computed from uptime, response time, storage efficiency, and software version.',
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Network Performance</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[250px] text-sm">
              <p>Real-time performance metrics for the Xandeum pNode network. These gauges show the current health and utilization of the distributed storage system.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid grid-cols-3 gap-2 sm:gap-6 min-w-[280px]">
          {gauges.map((gauge, i) => (
            <Gauge key={i} {...gauge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
