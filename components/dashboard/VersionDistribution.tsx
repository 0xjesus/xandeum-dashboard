'use client';

import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VersionDistributionItem } from '@/types';
import { CHART_COLORS, LATEST_VERSION } from '@/lib/constants';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface VersionDistributionProps {
  data: VersionDistributionItem[];
  isLoading?: boolean;
}

const COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  '#8b5cf6',
  '#ec4899',
];

export function VersionDistribution({ data, isLoading }: VersionDistributionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Version Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse h-32 w-32 rounded-full bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: `v${item.version}`,
    value: item.count,
    percentage: item.percentage,
    isLatest: item.version === LATEST_VERSION,
  }));

  const latestVersionCount = data.find((d) => d.version === LATEST_VERSION)?.count || 0;
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const latestPercentage =
    totalCount > 0 ? ((latestVersionCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Version Distribution</CardTitle>
          {Number(latestPercentage) >= 80 ? (
            <Badge variant="online" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {latestPercentage}% on latest
            </Badge>
          ) : (
            <Badge variant="degraded" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {latestPercentage}% on latest
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isLatest ? CHART_COLORS.primary : COLORS[index % COLORS.length]}
                    className="transition-all hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value} nodes ({data.percentage.toFixed(1)}%)
                        </p>
                        {data.isLatest && (
                          <p className="text-xs text-green-500 mt-1">Latest version</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {payload?.map((entry, index) => (
                      <div
                        key={`legend-${index}`}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Version List */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 4).map((item, index) => (
            <motion.div
              key={item.version}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      item.version === LATEST_VERSION
                        ? CHART_COLORS.primary
                        : COLORS[index % COLORS.length],
                  }}
                />
                <span className="text-sm">v{item.version}</span>
                {item.version === LATEST_VERSION && (
                  <Badge variant="online" className="text-[10px] px-1.5">
                    Latest
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
