'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NetworkStats } from '@/types';

interface NetworkHealthChartProps {
  stats: NetworkStats | null;
  isLoading?: boolean;
}

interface HistoryPoint {
  time: string;
  timestamp: number;
  onlinePercentage: number;
  avgHealth: number;
  storageUtil: number;
}

export function NetworkHealthChart({ stats, isLoading }: NetworkHealthChartProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const lastUpdateRef = useRef<number>(0);

  // Add new data point every time stats updates
  useEffect(() => {
    if (!stats) return;

    const now = Date.now();
    // Only add point if at least 10 seconds have passed
    if (now - lastUpdateRef.current < 10000) return;
    lastUpdateRef.current = now;

    const onlinePercentage = (stats.onlineNodes / stats.totalNodes) * 100;

    const newPoint: HistoryPoint = {
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      timestamp: now,
      onlinePercentage: Math.round(onlinePercentage * 10) / 10,
      avgHealth: Math.round(stats.averageHealthScore * 10) / 10,
      storageUtil: Math.round(stats.storageUtilization * 10) / 10,
    };

    setHistory(prev => {
      const updated = [...prev, newPoint];
      // Keep last 30 points (5 minutes of data at 10s intervals)
      return updated.slice(-30);
    });
  }, [stats]);

  // Calculate trend
  const trend = useMemo(() => {
    if (history.length < 3) return { direction: 'stable', change: 0 };
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) return { direction: 'stable', change: 0 };

    const recentAvg = recent.reduce((a, b) => a + b.avgHealth, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.avgHealth, 0) / older.length;
    const change = recentAvg - olderAvg;

    return {
      direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable',
      change: Math.abs(change),
    };
  }, [history]);

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Network Health Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div className="bg-black/95 backdrop-blur-md rounded-lg px-4 py-3 border border-white/10 shadow-xl">
        <p className="text-white/60 text-xs mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-xs">
            <span className="text-green-400">Online:</span>
            <span className="text-white font-medium ml-2">{payload[0]?.value?.toFixed(1)}%</span>
          </p>
          <p className="text-xs">
            <span className="text-xandeum-orange">Health:</span>
            <span className="text-white font-medium ml-2">{payload[1]?.value?.toFixed(1)}%</span>
          </p>
          <p className="text-xs">
            <span className="text-xandeum-purple">Storage:</span>
            <span className="text-white font-medium ml-2">{payload[2]?.value?.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Network Health Timeline
            </CardTitle>
            {trend.direction === 'up' && (
              <Badge variant="outline" className="border-green-500/50 text-green-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{trend.change.toFixed(1)}%
              </Badge>
            )}
            {trend.direction === 'down' && (
              <Badge variant="outline" className="border-red-500/50 text-red-500">
                <TrendingDown className="h-3 w-3 mr-1" />
                -{trend.change.toFixed(1)}%
              </Badge>
            )}
          </div>
          <TooltipUI>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px] text-sm">
              <p>Real-time health metrics tracking. Shows online percentage, average health score, and storage utilization over time.</p>
            </TooltipContent>
          </TooltipUI>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {history.length < 2 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Collecting data...</p>
                <p className="text-xs text-muted-foreground mt-1">Chart will appear shortly</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F3771F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F3771F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5D2554" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5D2554" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  tickLine={{ stroke: '#374151' }}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  tickLine={{ stroke: '#374151' }}
                  axisLine={{ stroke: '#374151' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
                <Area
                  type="monotone"
                  dataKey="onlinePercentage"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorOnline)"
                  name="Online %"
                />
                <Area
                  type="monotone"
                  dataKey="avgHealth"
                  stroke="#F3771F"
                  strokeWidth={2}
                  fill="url(#colorHealth)"
                  name="Health %"
                />
                <Area
                  type="monotone"
                  dataKey="storageUtil"
                  stroke="#5D2554"
                  strokeWidth={2}
                  fill="url(#colorStorage)"
                  name="Storage %"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-xandeum-orange" />
            <span className="text-xs text-muted-foreground">Health</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-xandeum-purple" />
            <span className="text-xs text-muted-foreground">Storage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NetworkHealthChart;
