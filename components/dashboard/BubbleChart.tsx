'use client';

import { useMemo, useState, useCallback } from 'react';
import { ResponsiveCirclePacking } from '@nivo/circle-packing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Filter, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
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

  // Transform data for Nivo circle packing
  const chartData = useMemo((): HierarchyNode => {
    const sorted = [...filteredNodes]
      .sort((a, b) => b.storage_committed - a.storage_committed)
      .slice(0, fullSection ? 100 : 50);

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
      <Card className={fullSection ? "h-[600px]" : "h-[450px]"}>
        <CardHeader>
          <CardTitle className="text-lg">Storage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`${fullSection ? "h-[500px]" : "h-[350px]"} animate-pulse bg-muted rounded-lg`} />
        </CardContent>
      </Card>
    );
  }

  const chartHeight = fullSection ? 600 : 400;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className={`${fullSection ? 'text-xl' : 'text-lg'}`}>
              Storage Distribution
            </CardTitle>
            {fullSection && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                Interactive
              </span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px] text-sm">
                <p>Interactive circle packing visualization. Click a node to zoom in, click again to view details. {fullSection && 'Drag to pan, scroll to zoom.'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom controls for full section */}
            {fullSection && zoomedId && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={resetZoom}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset View
              </Button>
            )}

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
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div>
            <span className="text-muted-foreground">Showing: </span>
            <span className="font-medium">{Math.min(stats.total, fullSection ? 100 : 50)} nodes</span>
          </div>
          <div>
            <span className="text-muted-foreground">Online: </span>
            <span className="font-medium text-green-500">{stats.online}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Storage: </span>
            <span className="font-medium">{formatBytes(stats.totalStorage)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Health: </span>
            <span className="font-medium">{stats.avgHealth}%</span>
          </div>
          {fullSection && (
            <div className="ml-auto text-xs text-muted-foreground">
              <span className="hidden sm:inline">Click node to zoom • Click again to view details • </span>
              <span className="text-xandeum-orange">Drag to explore</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          className="bg-gradient-to-br from-xandeum-dark/80 via-slate-900 to-xandeum-purple/20 relative"
          style={{ height: chartHeight }}
        >
          <ResponsiveCirclePacking
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            id="id"
            value="value"
            colors={(node: any) => node.data.color || '#666'}
            childColor={{ from: 'color', modifiers: [['brighter', 0.4]] }}
            padding={fullSection ? 6 : 4}
            leavesOnly={false}
            enableLabels={true}
            labelsFilter={(node: any) => node.depth === 1}
            labelsSkipRadius={fullSection ? 15 : 20}
            labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
            borderWidth={2}
            borderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
            animate={true}
            motionConfig="gentle"
            zoomedId={zoomedId}
            onClick={handleNodeClick}
            tooltip={({ id, value, color, data, depth }: any) => (
              <div className={`bg-black/95 backdrop-blur-md rounded-lg px-4 py-3 text-xs shadow-xl border border-white/10 pointer-events-none ${depth === 0 ? 'hidden' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-white font-medium capitalize">{data.status}</span>
                </div>
                <p className="font-mono text-white mb-2">{data.pubkey?.slice(0, 16)}...</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-white/10">
                  <p className="text-white/60">Storage:</p>
                  <p className="text-xandeum-orange font-medium">{data.storageFormatted}</p>
                  <p className="text-white/60">Health:</p>
                  <p className="text-green-400 font-medium">{data.healthScore}%</p>
                  <p className="text-white/60">Used:</p>
                  <p className="text-white font-medium">{data.usagePercent?.toFixed(1)}%</p>
                </div>
                <p className="text-xandeum-orange/70 text-[10px] mt-2 text-center">
                  {zoomedId === id ? 'Click to view details' : 'Click to zoom'}
                </p>
              </div>
            )}
          />

          {/* Zoom indicator */}
          {fullSection && zoomedId && (
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-xandeum-orange/30">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-xandeum-orange" />
                <span className="text-xs text-white">Zoomed in</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-[10px]"
                  onClick={resetZoom}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-3 border-t border-border bg-background/50 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Online ({filteredNodes.filter(n => n.status === 'online').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-xandeum-orange" />
            <span className="text-xs text-muted-foreground">Degraded ({filteredNodes.filter(n => n.status === 'degraded').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Offline ({filteredNodes.filter(n => n.status === 'offline').length})</span>
          </div>
          <div className="text-xs text-muted-foreground border-l border-border pl-4">
            Size = Storage capacity
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
