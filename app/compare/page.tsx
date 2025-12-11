'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  GitCompare,
  Plus,
  X,
  Search,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/nodes/StatusBadge';
import { HealthScore } from '@/components/nodes/HealthScore';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { useNodes } from '@/hooks/useNodes';
import { PNode } from '@/types';
import { truncateMiddle, formatBytes } from '@/lib/utils';
import { UI_CONFIG, CHART_COLORS } from '@/lib/constants';

const RADAR_COLORS = ['#F3771F', '#5D2554', '#1C3850', '#22c55e'];

// Radar chart component for visual comparison
function RadarComparisonChart({ nodes }: { nodes: PNode[] }) {
  const radarData = useMemo(() => {
    // Find max values for normalization
    const maxStorage = Math.max(...nodes.map(n => n.storage_committed), 1);
    const maxUptime = Math.max(...nodes.map(n => n.uptime), 1);

    const metrics = [
      { name: 'Health', key: 'healthScore', max: 100 },
      { name: 'Storage', key: 'storage_committed', max: maxStorage },
      { name: 'Uptime', key: 'uptime', max: maxUptime },
      { name: 'Utilization', key: 'storage_usage_percent', max: 100 },
      { name: 'Version', key: 'version', max: 100 },
    ];

    return metrics.map(metric => {
      const dataPoint: Record<string, string | number> = { metric: metric.name };
      nodes.forEach((node, i) => {
        let value: number;
        if (metric.key === 'version') {
          // Convert version to score (0.7.3 = 100, 0.7.2 = 90, etc)
          value = node.version === '0.7.3' ? 100 : node.version?.startsWith('0.7') ? 85 : 50;
        } else {
          const rawValue = node[metric.key as keyof PNode] as number;
          value = (rawValue / metric.max) * 100;
        }
        dataPoint[`node${i}`] = Math.round(value);
      });
      return dataPoint;
    });
  }, [nodes]);

  if (nodes.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickCount={5}
              />
              {nodes.map((node, i) => (
                <Radar
                  key={node.pubkey}
                  name={truncateMiddle(node.pubkey, 4, 4)}
                  dataKey={`node${i}`}
                  stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                  fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Insights component
function ComparisonInsights({ nodes }: { nodes: PNode[] }) {
  if (nodes.length < 2) return null;

  const insights = useMemo(() => {
    const results: { label: string; winner: string; metric: string; icon: 'up' | 'down' }[] = [];

    // Best health score
    const bestHealth = nodes.reduce((a, b) => a.healthScore > b.healthScore ? a : b);
    results.push({
      label: 'Highest Health',
      winner: truncateMiddle(bestHealth.pubkey, 4, 4),
      metric: `${bestHealth.healthScore}%`,
      icon: 'up',
    });

    // Most storage
    const mostStorage = nodes.reduce((a, b) => a.storage_committed > b.storage_committed ? a : b);
    results.push({
      label: 'Most Storage',
      winner: truncateMiddle(mostStorage.pubkey, 4, 4),
      metric: formatBytes(mostStorage.storage_committed),
      icon: 'up',
    });

    // Longest uptime
    const longestUptime = nodes.reduce((a, b) => a.uptime > b.uptime ? a : b);
    results.push({
      label: 'Longest Uptime',
      winner: truncateMiddle(longestUptime.pubkey, 4, 4),
      metric: longestUptime.uptimeFormatted,
      icon: 'up',
    });

    // Lowest utilization (more capacity available)
    const lowestUtil = nodes.reduce((a, b) =>
      a.storage_usage_percent < b.storage_usage_percent ? a : b
    );
    results.push({
      label: 'Most Available',
      winner: truncateMiddle(lowestUtil.pubkey, 4, 4),
      metric: `${(100 - lowestUtil.storage_usage_percent).toFixed(1)}% free`,
      icon: 'down',
    });

    return results;
  }, [nodes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className={`p-2 rounded-full ${
                insight.icon === 'up' ? 'bg-green-500/20' : 'bg-blue-500/20'
              }`}>
                {insight.icon === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{insight.label}</p>
                <p className="font-medium text-sm">{insight.winner}</p>
                <p className="text-xs text-muted-foreground">{insight.metric}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComparePage() {
  const [selectedNodes, setSelectedNodes] = useState<PNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, error, isLoading, mutate } = useNodes();

  const filteredNodes = data?.nodes.filter(
    (node) =>
      !selectedNodes.find((s) => s.pubkey === node.pubkey) &&
      (node.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.ip.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddNode = (node: PNode) => {
    if (selectedNodes.length < UI_CONFIG.maxCompareNodes) {
      setSelectedNodes([...selectedNodes, node]);
    }
  };

  const handleRemoveNode = (pubkey: string) => {
    setSelectedNodes(selectedNodes.filter((n) => n.pubkey !== pubkey));
  };

  if (error) {
    return (
      <div className="container py-8">
        <ErrorState
          title="Failed to load nodes"
          message="Could not fetch node data for comparison."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitCompare className="h-8 w-8 text-xandeum-500" />
            Compare Nodes
          </h1>
          <p className="text-muted-foreground mt-1">
            Select up to {UI_CONFIG.maxCompareNodes} nodes to compare their metrics
            side by side
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Selected Nodes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Selected Nodes ({selectedNodes.length}/{UI_CONFIG.maxCompareNodes})
              </CardTitle>
              {selectedNodes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNodes([])}
                >
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedNodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select nodes from the list below to compare</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedNodes.map((node, index) => (
                  <motion.div
                    key={node.pubkey}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative p-4 rounded-lg border bg-muted/50"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveNode(node.pubkey)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="text-center">
                      <p className="font-mono text-sm font-medium">
                        {truncateMiddle(node.pubkey)}
                      </p>
                      <StatusBadge status={node.status} size="sm" />
                    </div>
                  </motion.div>
                ))}

                {/* Empty slots */}
                {Array.from({
                  length: UI_CONFIG.maxCompareNodes - selectedNodes.length,
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="p-4 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground"
                  >
                    <Plus className="h-6 w-6" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Radar Chart & Insights */}
      {selectedNodes.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <RadarComparisonChart nodes={selectedNodes} />
          <ComparisonInsights nodes={selectedNodes} />
        </motion.div>
      )}

      {/* Comparison Table */}
      {selectedNodes.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Metric</th>
                      {selectedNodes.map((node) => (
                        <th
                          key={node.pubkey}
                          className="text-center py-3 px-4 font-medium"
                        >
                          {truncateMiddle(node.pubkey, 4, 4)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow
                      label="Status"
                      values={selectedNodes.map((n) => (
                        <StatusBadge key={n.pubkey} status={n.status} size="sm" />
                      ))}
                    />
                    <CompareRow
                      label="Health Score"
                      values={selectedNodes.map((n) => (
                        <HealthScore key={n.pubkey} score={n.healthScore} size="sm" />
                      ))}
                      highlight="max"
                      rawValues={selectedNodes.map((n) => n.healthScore)}
                    />
                    <CompareRow
                      label="Version"
                      values={selectedNodes.map((n) => (
                        <Badge key={n.pubkey} variant="version">
                          v{n.version}
                        </Badge>
                      ))}
                    />
                    <CompareRow
                      label="Uptime"
                      values={selectedNodes.map((n) => n.uptimeFormatted)}
                      highlight="max"
                      rawValues={selectedNodes.map((n) => n.uptime)}
                    />
                    <CompareRow
                      label="Storage Committed"
                      values={selectedNodes.map((n) => formatBytes(n.storage_committed))}
                      highlight="max"
                      rawValues={selectedNodes.map((n) => n.storage_committed)}
                    />
                    <CompareRow
                      label="Storage Used"
                      values={selectedNodes.map((n) => formatBytes(n.storage_used))}
                    />
                    <CompareRow
                      label="Utilization"
                      values={selectedNodes.map(
                        (n) => `${n.storage_usage_percent.toFixed(1)}%`
                      )}
                    />
                    <CompareRow
                      label="IP Address"
                      values={selectedNodes.map((n) => n.ip)}
                    />
                    <CompareRow
                      label="Public"
                      values={selectedNodes.map((n) =>
                        n.is_public ? (
                          <CheckCircle
                            key={n.pubkey}
                            className="h-4 w-4 text-green-500 mx-auto"
                          />
                        ) : (
                          <X key={n.pubkey} className="h-4 w-4 text-red-500 mx-auto" />
                        )
                      )}
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Node Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Nodes</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pubkey or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <PageLoader />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredNodes?.slice(0, 50).map((node) => (
                  <motion.div
                    key={node.pubkey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-xandeum-500/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleAddNode(node)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HealthScore score={node.healthScore} size="sm" />
                      <div className="min-w-0">
                        <p className="font-mono text-sm truncate">
                          {truncateMiddle(node.pubkey)}
                        </p>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={node.status} size="sm" showDot={false} />
                          <span className="text-xs text-muted-foreground">
                            {node.ip}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      disabled={selectedNodes.length >= UI_CONFIG.maxCompareNodes}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function CompareRow({
  label,
  values,
  highlight,
  rawValues,
}: {
  label: string;
  values: React.ReactNode[];
  highlight?: 'max' | 'min';
  rawValues?: number[];
}) {
  let highlightIndex = -1;
  if (highlight && rawValues) {
    const targetValue =
      highlight === 'max' ? Math.max(...rawValues) : Math.min(...rawValues);
    highlightIndex = rawValues.indexOf(targetValue);
  }

  return (
    <tr className="border-b">
      <td className="py-3 px-4 text-sm text-muted-foreground">{label}</td>
      {values.map((value, index) => (
        <td
          key={index}
          className={`py-3 px-4 text-center text-sm ${
            index === highlightIndex ? 'bg-xandeum-500/10 font-medium' : ''
          }`}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}
