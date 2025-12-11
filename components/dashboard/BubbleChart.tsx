'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Filter, ZoomIn, RotateCcw, Sparkles, Database, Activity, TrendingUp, Eye } from 'lucide-react';
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

interface TooltipData {
  x: number;
  y: number;
  data: BubbleNode;
}

export function BubbleChart({ nodes, isLoading, fullSection = false }: BubbleChartProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: fullSection ? 800 : 400 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [fullSection]);

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

  // Transform data for D3
  const bubbleData = useMemo((): BubbleNode[] => {
    const sorted = [...filteredNodes]
      .sort((a, b) => b.storage_committed - a.storage_committed)
      .slice(0, fullSection ? 150 : 50);

    return sorted.map((node) => ({
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
  }, [filteredNodes, fullSection]);

  const stats = useMemo(() => ({
    total: filteredNodes.length,
    online: filteredNodes.filter(n => n.status === 'online').length,
    totalStorage: filteredNodes.reduce((a, b) => a + b.storage_committed, 0),
    avgHealth: Math.round(filteredNodes.reduce((a, b) => a + b.healthScore, 0) / filteredNodes.length || 0),
  }), [filteredNodes]);

  // D3 bubble layout
  useEffect(() => {
    if (!svgRef.current || bubbleData.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create hierarchy
    const hierarchy = d3.hierarchy({ children: bubbleData })
      .sum((d: any) => d.value);

    // Create pack layout
    const pack = d3.pack<any>()
      .size([width - 40, height - 40])
      .padding(fullSection ? 8 : 4);

    const root = pack(hierarchy);

    // Create container group with centering
    const g = svg.append('g')
      .attr('transform', `translate(20, 20)`);

    // Add circles with smooth transitions
    const circles = g.selectAll('circle')
      .data(root.leaves())
      .enter()
      .append('circle')
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .attr('r', 0) // Start at 0 for animation
      .attr('fill', (d: any) => d.data.color)
      .attr('fill-opacity', 0.85)
      .attr('stroke', (d: any) => d.data.color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.5)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))')
      .on('mouseenter', function(event: any, d: any) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            data: d.data
          });
        }

        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 1)
          .style('filter', `drop-shadow(0 8px 25px ${d.data.color}50)`);
      })
      .on('mousemove', function(event: any, d: any) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            data: d.data
          });
        }
      })
      .on('mouseleave', function(event: any, d: any) {
        setTooltip(null);

        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.85)
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.5)
          .style('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))');
      })
      .on('click', function(event: any, d: any) {
        event.stopPropagation();
        if (selectedNode === d.data.pubkey) {
          router.push(`/nodes/${d.data.pubkey}`);
        } else {
          setSelectedNode(d.data.pubkey);

          // Highlight selected
          g.selectAll('circle')
            .transition()
            .duration(300)
            .attr('fill-opacity', (node: any) => node.data.pubkey === d.data.pubkey ? 1 : 0.4)
            .attr('stroke-opacity', (node: any) => node.data.pubkey === d.data.pubkey ? 1 : 0.2);
        }
      });

    // Animate circles in
    circles.transition()
      .duration(800)
      .delay((d: any, i: number) => i * 10)
      .ease(d3.easeCubicOut)
      .attr('r', (d: any) => d.r);

    // Add labels for larger circles
    const labels = g.selectAll('text')
      .data(root.leaves().filter((d: any) => d.r > (fullSection ? 25 : 30)))
      .enter()
      .append('text')
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', (d: any) => Math.min(d.r / 3, 12))
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .attr('opacity', 0)
      .text((d: any) => d.data.name);

    // Animate labels in
    labels.transition()
      .duration(500)
      .delay(800)
      .attr('opacity', 0.9);

    // Click outside to deselect
    svg.on('click', () => {
      setSelectedNode(null);
      g.selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill-opacity', 0.85)
        .attr('stroke-opacity', 0.5);
    });

  }, [bubbleData, dimensions, fullSection, selectedNode, router]);

  const resetSelection = useCallback(() => {
    setSelectedNode(null);
    if (svgRef.current) {
      d3.select(svgRef.current)
        .selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill-opacity', 0.85)
        .attr('stroke-opacity', 0.5);
    }
  }, []);

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
                Explore storage allocation across the network. Click any node to select, click again to view details.
              </p>
            </motion.div>

            {/* Filter controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {selectedNode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-xandeum-orange/50 hover:bg-xandeum-orange/10 text-xandeum-orange"
                  onClick={resetSelection}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Selection
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
                      setSelectedNode(null);
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
              <p className="text-xs text-muted-foreground">{stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% active</p>
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
                  <p>Interactive bubble visualization. Click a node to select, click again to view details.</p>
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
                    setSelectedNode(null);
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
          ref={containerRef}
          className={`relative overflow-hidden ${fullSection ? 'bg-gradient-to-br from-[#050810] via-[#0a1020] to-[#050810]' : 'bg-gradient-to-br from-xandeum-dark/80 via-slate-900 to-xandeum-purple/20'}`}
          style={{ height: chartHeight }}
        >
          {/* Premium background effects for full section */}
          {fullSection && (
            <>
              <motion.div
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-xandeum-orange/8 rounded-full blur-[150px] pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-xandeum-purple/10 rounded-full blur-[120px] pointer-events-none"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-green-500/5 rounded-full blur-[180px] pointer-events-none"
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }}
              />
            </>
          )}

          {/* D3 SVG Container */}
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={chartHeight}
            className="relative z-10"
          />

          {/* Custom Tooltip */}
          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 pointer-events-none"
                style={{
                  left: tooltip.x + 15,
                  top: tooltip.y - 10,
                  transform: tooltip.x > dimensions.width - 280 ? 'translateX(-110%)' : 'none'
                }}
              >
                <div
                  className="bg-black/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-2xl border border-white/10 min-w-[240px]"
                  style={{ boxShadow: `0 25px 50px -12px ${tooltip.data.color}30, 0 0 0 1px ${tooltip.data.color}20` }}
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                    <div
                      className="h-5 w-5 rounded-full ring-2 ring-white/20"
                      style={{ backgroundColor: tooltip.data.color, boxShadow: `0 0 30px ${tooltip.data.color}60` }}
                    />
                    <span className="text-white font-semibold capitalize">{tooltip.data.status}</span>
                    <div className="ml-auto flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="h-3 w-3 text-xandeum-orange" />
                      <span className="text-xandeum-orange font-bold text-sm">{tooltip.data.healthScore}%</span>
                    </div>
                  </div>
                  <p className="font-mono text-white/80 text-xs mb-3 bg-white/5 px-2 py-1.5 rounded-lg">{tooltip.data.pubkey?.slice(0, 24)}...</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-sm">Storage</span>
                      <span className="text-xandeum-orange font-semibold">{tooltip.data.storageFormatted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-sm">Health Score</span>
                      <span className="text-green-400 font-semibold">{tooltip.data.healthScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-sm">Utilization</span>
                      <span className="text-white font-semibold">{tooltip.data.usagePercent?.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-xandeum-orange text-xs font-medium">
                      <Eye className="h-3.5 w-3.5" />
                      {selectedNode === tooltip.data.pubkey ? 'Click to view details' : 'Click to select'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selection indicator */}
          <AnimatePresence>
            {fullSection && selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute top-6 left-6 bg-black/90 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 shadow-2xl z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-xandeum-orange to-orange-600 shadow-lg shadow-xandeum-orange/30">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Node Selected</p>
                    <p className="text-xs text-white/50">Click again to view details</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-3 h-9 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl"
                    onClick={resetSelection}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions overlay */}
          <AnimatePresence>
            {fullSection && !selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-xl rounded-xl px-5 py-3 border border-white/10 z-20"
              >
                <p className="text-sm text-white/80">
                  <span className="text-xandeum-orange font-semibold">Click</span> node to select
                  <span className="mx-2 text-white/30">•</span>
                  <span className="text-xandeum-orange font-semibold">Click again</span> for details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className={`flex items-center justify-center gap-10 border-t border-white/5 bg-gradient-to-r from-transparent via-background/80 to-transparent flex-wrap ${fullSection ? 'py-6' : 'py-3'}`}>
          {[
            { color: 'bg-green-500', shadow: 'shadow-green-500/40', label: 'Online', count: filteredNodes.filter(n => n.status === 'online').length, textColor: 'text-green-400' },
            { color: 'bg-xandeum-orange', shadow: 'shadow-xandeum-orange/40', label: 'Degraded', count: filteredNodes.filter(n => n.status === 'degraded').length, textColor: 'text-xandeum-orange' },
            { color: 'bg-red-500', shadow: 'shadow-red-500/40', label: 'Offline', count: filteredNodes.filter(n => n.status === 'offline').length, textColor: 'text-red-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${item.color} shadow-lg ${item.shadow} ring-2 ring-white/10`} />
              <span className={`${fullSection ? 'text-sm' : 'text-xs'} text-white/60`}>
                {item.label} <span className={`font-bold ${item.textColor}`}>({item.count})</span>
              </span>
            </div>
          ))}
          <div className={`text-white/40 border-l border-white/10 pl-10 flex items-center gap-2 ${fullSection ? 'text-sm' : 'text-xs'}`}>
            <Database className="h-4 w-4 text-xandeum-purple" />
            <span>Size represents storage capacity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
