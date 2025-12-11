'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';
import { useMemo } from 'react';

interface StorageChartProps {
  nodes: PNode[];
  isLoading?: boolean;
}

export function StorageChart({ nodes, isLoading }: StorageChartProps) {
  const chartData = useMemo(() => {
    // Group nodes by storage ranges
    const ranges = [
      { min: 0, max: 100 * 1024 * 1024, label: '0-100MB' },
      { min: 100 * 1024 * 1024, max: 500 * 1024 * 1024, label: '100-500MB' },
      { min: 500 * 1024 * 1024, max: 1024 * 1024 * 1024, label: '500MB-1GB' },
      { min: 1024 * 1024 * 1024, max: 5 * 1024 * 1024 * 1024, label: '1-5GB' },
      { min: 5 * 1024 * 1024 * 1024, max: Infinity, label: '5GB+' },
    ];

    return ranges.map((range) => {
      const nodesInRange = nodes.filter(
        (n) => n.storage_committed >= range.min && n.storage_committed < range.max
      );
      const totalStorage = nodesInRange.reduce((sum, n) => sum + n.storage_committed, 0);
      return {
        name: range.label,
        count: nodesInRange.length,
        storage: totalStorage,
        avgHealth: nodesInRange.length > 0
          ? Math.round(nodesInRange.reduce((sum, n) => sum + n.healthScore, 0) / nodesInRange.length)
          : 0,
      };
    });
  }, [nodes]);

  const topStorageNodes = useMemo(() => {
    return [...nodes]
      .sort((a, b) => b.storage_committed - a.storage_committed)
      .slice(0, 10)
      .map((n) => ({
        name: n.pubkey.slice(0, 8),
        storage: n.storage_committed,
        used: n.storage_used,
        health: n.healthScore,
      }));
  }, [nodes]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Storage Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution">
          <TabsList className="mb-4">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="top">Top Nodes</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'storage') return [formatBytes(value), 'Total Storage'];
                      if (name === 'count') return [value, 'Node Count'];
                      return [value, name];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgHealth"
                    stroke="#22c55e"
                    fillOpacity={0.3}
                    fill="url(#colorStorage)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="top">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStorageNodes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatBytes(v)} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={60} className="text-xs font-mono" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'storage' || name === 'used') return [formatBytes(value), name === 'storage' ? 'Committed' : 'Used'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="storage" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="used" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
