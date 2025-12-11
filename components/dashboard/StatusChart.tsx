'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NodeStatus } from '@/types';
import { CHART_COLORS } from '@/lib/constants';

interface StatusChartProps {
  data: { status: NodeStatus; count: number; percentage: number }[];
  isLoading?: boolean;
}

const statusColors = {
  online: CHART_COLORS.online,
  degraded: CHART_COLORS.degraded,
  offline: CHART_COLORS.offline,
};

const statusLabels = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
};

export function StatusChart({ data, isLoading }: StatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Network Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse w-full space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-1/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: statusLabels[item.status],
    value: item.count,
    percentage: item.percentage,
    status: item.status,
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const onlinePercentage = data.find((d) => d.status === 'online')?.percentage || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Network Status</CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-500">
              {onlinePercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Network Health</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Status Bars */}
        <div className="space-y-4 mb-4">
          {chartData.map((item, index) => (
            <motion.div
              key={item.status}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: statusColors[item.status as NodeStatus] }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{item.value}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: statusColors[item.status as NodeStatus] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">
                {data.find((d) => d.status === 'online')?.count || 0}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {data.find((d) => d.status === 'degraded')?.count || 0}
              </p>
              <p className="text-xs text-muted-foreground">Degraded</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">
                {data.find((d) => d.status === 'offline')?.count || 0}
              </p>
              <p className="text-xs text-muted-foreground">Offline</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
