'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveCirclePacking } from '@nivo/circle-packing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Filter, ZoomIn, RotateCcw, Sparkles, Database, Activity, TrendingUp } from 'lucide-react';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface BubbleChartProps {
  nodes: PNode[];
  isLoading?: boolean;
  fullSection?: boolean;
}

type FilterType = 'all' | 'online' | 'high-storage' | 'healthy';

interface BubbleNode {
  id: string;
  name: string;
  value: number;
  color: string;
  status: string;
  healthScore: number;
  storage: number;
  storageFormatted: string;
  usagePercent: number;
  pubkey: string;
}

interface HierarchyNode {
  id: string;
  name: string;
  children: BubbleNode[];
}

export function BubbleChart({ nodes, isLoading, fullSection = false }: BubbleChartProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [zoomedId, setZoomedId] = useState<string | null>(null);

  const filteredNodes = useMemo(() => {
    let filtered = [...nodes];

    switch (filter) {
      case 'online':
        filtered = filtered.filter(n => n.status === 'online');
        break;
      case 'high-storage':
        const avgStorage = nodes.reduce((a, b) => a + b.storage_committed, 0) / nodes.length;
        filtered = filtered.filter(n => n.storage_committed >= avgStorage);
        break;
      case 'healthy':
        filtered = filtered.filter(n => n.healthScore >= 80);
        break;
    }

    return filtered;
  }, [nodes, filter]);

  // Transform data for Nivo circle packing - show more nodes in full section
  const chartData = useMemo((): HierarchyNode => {
    const sorted = [...filteredNodes]
      .sort((a, b) => b.storage_committed - a.storage_committed)
      .slice(0, fullSection ? 150 : 50);

    const children: BubbleNode[] = sorted.map((node) => ({
      id: node.pubkey,
      name: node.pubkey.slice(0, 8) + '...',
      value: Math.max(node.storage_committed, 1000000),
      color: node.status === 'online'
        ? '#22c55e'
        : node.status === 'degraded'
          ? '#F3771F'
          : '#ef4444',
      status: node.status,
      healthScore: node.healthScore,
      storage: node.storage_committed,
      storageFormatted: formatBytes(node.storage_committed),
      usagePercent: node.storage_usage_percent,
      pubkey: node.pubkey,
    }));

    return {
      id: 'root',
      name: 'Network',
      children,
    };
  }, [filteredNodes, fullSection]);

  const stats = useMemo(() => ({
    total: filteredNodes.length,
    online: filteredNodes.filter(n => n.status === 'online').length,
    totalStorage: filteredNodes.reduce((a, b) => a + b.storage_committed, 0),
    avgHealth: Math.round(filteredNodes.reduce((a, b) => a + b.healthScore, 0) / filteredNodes.length || 0),
  }), [filteredNodes]);

  const handleNodeClick = useCallback((node: any) => {
    if (node.depth === 0) {
      // Clicking root resets zoom
      setZoomedId(null);
    } else if (node.data.pubkey) {
      // Toggle zoom or navigate
      if (zoomedId === node.id) {
        // Already zoomed, navigate to node
        router.push(`/nodes/${node.data.pubkey}`);
      } else {
        // Zoom into this node
        setZoomedId(node.id);
      }
    }
  }, [router, zoomedId]);

  const resetZoom = () => setZoomedId(null);

  if (isLoading) {
    return (
      <Card className={fullSection ? "min-h-[800px]" : "h-[450px]"}>
        <CardHeader>
          <CardTitle className="text-lg">Storage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`${fullSection ? "h-[700px]" : "h-[350px]"} animate-pulse bg-muted rounded-lg`} />
        </CardContent>
      </Card>
    );
  }

  // Much larger chart for full section mode
  const chartHeight = fullSection ? 800 : 400;

  return (
    <Card className={`overflow-hidden ${fullSection ? 'border-0 shadow-2xl' : ''}`}>
      {/* Header Section - Enhanced for full section */}
      {fullSection ? (
        <CardHeader className="pb-6 pt-8 px-6 lg:px-10 bg-gradient-to-r from-xandeum-dark/50 via-transparent to-xandeum-purple/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title and description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-xandeum-orange to-orange-500 shadow-lg shadow-xandeum-orange/30">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl lg:text-3xl font-bold">
                  Storage Distribution
                </CardTitle>
                <motion.span
                  className="px-3 py-1 rounded-full bg-xandeum-orange/20 border border-xandeum-orange/30 text-xs font-medium text-xandeum-orange"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  Interactive
                </motion.span>
              </div>
              <p className="text-muted-foreground text-sm lg:text-base">
                Explore storage allocation across the network. Click any node to zoom in and view details.
              </p>
            </motion.div>

            {/* Filter controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {zoomedId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-xandeum-orange/50 hover:bg-xandeum-orange/10 text-xandeum-orange"
                  onClick={resetZoom}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset View
                </Button>
              )}

              <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-lg p-1.5 border border-border/50">
                <Filter className="h-4 w-4 text-muted-foreground ml-2" />
                {[
                  { key: 'all', label: 'All Nodes' },
                  { key: 'online', label: 'Online' },
                  { key: 'high-storage', label: 'High Storage' },
                  { key: 'healthy', label: 'Healthy' },
                ].map((f) => (
                  <Button
                    key={f.key}
                    variant={filter === f.key ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-8 text-sm transition-all ${filter === f.key ? 'bg-xandeum-orange hover:bg-xandeum-orange/90 shadow-md' : 'hover:bg-white/10'}`}
                    onClick={() => {
                      setFilter(f.key as FilterType);
                      setZoomedId(null);
                    }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats cards - Enhanced for full section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
          >
            <div className="bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-xandeum-orange" />
                <span className="text-xs text-muted-foreground">Displaying</span>
              </div>
              <p className="text-2xl font-bold">{Math.min(stats.total, 150)}</p>
              <p className="text-xs text-muted-foreground">of {stats.total} nodes</p>
            </div>
            <div className="bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.online}</p>
              <p className="text-xs text-muted-foreground">{Math.round((stats.online / stats.total) * 100)}% active</p>
            </div>
            <div className="bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-xandeum-purple" />
                <span className="text-xs text-muted-foreground">Total Storage</span>
              </div>
              <p className="text-2xl font-bold">{formatBytes(stats.totalStorage)}</p>
              <p className="text-xs text-muted-foreground">committed capacity</p>
            </div>
            <div className="bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Avg Health</span>
              </div>
              <p className="text-2xl font-bold">{stats.avgHealth}%</p>
              <p className="text-xs text-muted-foreground">network score</p>
            </div>
          </motion.div>
        </CardHeader>
      ) : (
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Storage Distribution</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px] text-sm">
                  <p>Interactive circle packing visualization. Click a node to zoom in, click again to view details.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-muted-foreground mr-1" />
              {[
                { key: 'all', label: 'All' },
                { key: 'online', label: 'Online' },
                { key: 'high-storage', label: 'High Storage' },
                { key: 'healthy', label: 'Healthy' },
              ].map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-7 text-xs ${filter === f.key ? 'bg-xandeum-orange hover:bg-xandeum-orange/90' : ''}`}
                  onClick={() => {
                    setFilter(f.key as FilterType);
                    setZoomedId(null);
                  }}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div
          className={`relative overflow-hidden ${fullSection ? 'bg-gradient-to-br from-[#0a0f1c] via-[#0d1425] to-[#0a0f1c]' : 'bg-gradient-to-br from-xandeum-dark/80 via-slate-900 to-xandeum-purple/20'}`}
          style={{ height: chartHeight }}
        >
          {/* Background glow effects for full section */}
          {fullSection && (
            <>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-xandeum-orange/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-xandeum-purple/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/3 rounded-full blur-[120px] pointer-events-none" />
            </>
          )}

          <ResponsiveCirclePacking
            data={chartData}
            margin={fullSection ? { top: 40, right: 40, bottom: 40, left: 40 } : { top: 20, right: 20, bottom: 20, left: 20 }}
            id="id"
            value="value"
            colors={(node: any) => node.data.color || '#666'}
            childColor={{ from: 'color', modifiers: [['brighter', 0.4]] }}
            padding={fullSection ? 8 : 4}
            leavesOnly={false}
            enableLabels={true}
            labelsFilter={(node: any) => node.depth === 1}
            labelsSkipRadius={fullSection ? 12 : 20}
            labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
            borderWidth={fullSection ? 3 : 2}
            borderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
            animate={true}
            motionConfig="gentle"
            zoomedId={zoomedId}
            onClick={handleNodeClick}
            tooltip={({ id, value, color, data, depth }: any) => (
              <div className={`bg-black/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-2xl border border-xandeum-orange/30 pointer-events-none min-w-[220px] ${depth === 0 ? 'hidden' : ''}`}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                  <motion.div
                    className="h-4 w-4 rounded-full shadow-lg"
                    style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}50` }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <span className="text-white font-semibold capitalize text-sm">{data.status}</span>
                  <span className="ml-auto text-xandeum-orange font-bold">{data.healthScore}%</span>
                </div>
                <p className="font-mono text-white/90 text-sm mb-3">{data.pubkey?.slice(0, 20)}...</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <p className="text-white/50">Storage:</p>
                  <p className="text-xandeum-orange font-semibold">{data.storageFormatted}</p>
                  <p className="text-white/50">Health:</p>
                  <p className="text-green-400 font-semibold">{data.healthScore}%</p>
                  <p className="text-white/50">Usage:</p>
                  <p className="text-white font-semibold">{data.usagePercent?.toFixed(1)}%</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-center">
                  <p className="text-xandeum-orange text-xs font-medium">
                    {zoomedId === id ? '→ Click to view node details' : '→ Click to zoom in'}
                  </p>
                </div>
              </div>
            )}
          />

          {/* Zoom indicator - Enhanced */}
          {fullSection && zoomedId && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 left-6 bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 border border-xandeum-orange/40 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-xandeum-orange/20">
                  <ZoomIn className="h-5 w-5 text-xandeum-orange" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Zoomed View</p>
                  <p className="text-xs text-white/60">Click node to view details</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-8 hover:bg-xandeum-orange/20 text-white"
                  onClick={resetZoom}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </motion.div>
          )}

          {/* Instructions overlay for full section */}
          {fullSection && !zoomedId && (
            <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <p className="text-xs text-white/70">
                <span className="text-xandeum-orange font-medium">Click</span> node to zoom • <span className="text-xandeum-orange font-medium">Click again</span> for details
              </p>
            </div>
          )}
        </div>

        {/* Legend - Enhanced for full section */}
        <div className={`flex items-center justify-center gap-8 py-4 border-t border-border bg-background/50 flex-wrap ${fullSection ? 'py-5' : 'py-3'}`}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/30" />
            <span className={`text-muted-foreground ${fullSection ? 'text-sm' : 'text-xs'}`}>
              Online <span className="font-semibold text-green-500">({filteredNodes.filter(n => n.status === 'online').length})</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-xandeum-orange shadow-lg shadow-xandeum-orange/30" />
            <span className={`text-muted-foreground ${fullSection ? 'text-sm' : 'text-xs'}`}>
              Degraded <span className="font-semibold text-xandeum-orange">({filteredNodes.filter(n => n.status === 'degraded').length})</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
            <span className={`text-muted-foreground ${fullSection ? 'text-sm' : 'text-xs'}`}>
              Offline <span className="font-semibold text-red-500">({filteredNodes.filter(n => n.status === 'offline').length})</span>
            </span>
          </div>
          <div className={`text-muted-foreground border-l border-border pl-8 ${fullSection ? 'text-sm' : 'text-xs'}`}>
            <Database className="h-4 w-4 inline mr-1 text-xandeum-purple" />
            Circle size = Storage capacity
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
