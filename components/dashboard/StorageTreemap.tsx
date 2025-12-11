'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Layers } from 'lucide-react';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';

interface StorageTreemapProps {
  nodes: PNode[];
  isLoading?: boolean;
}

interface RegionData {
  name: string;
  value: number;
  count: number;
  color: string;
  children?: RegionData[];
}

// Get region from IP
function getRegionFromIP(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0]);

  if (firstOctet >= 3 && firstOctet <= 56) return 'North America';
  if (firstOctet >= 57 && firstOctet <= 76) return 'Canada';
  if (firstOctet >= 77 && firstOctet <= 95) return 'Western Europe';
  if (firstOctet >= 96 && firstOctet <= 126) return 'Asia Pacific';
  if (firstOctet >= 128 && firstOctet <= 144) return 'East Asia';
  if (firstOctet >= 145 && firstOctet <= 176) return 'Eastern Europe';
  if (firstOctet >= 177 && firstOctet <= 191) return 'South America';
  if (firstOctet >= 192 && firstOctet <= 210) return 'Oceania';
  return 'Other';
}

const regionColors: Record<string, string> = {
  'North America': '#F3771F',
  'Canada': '#ef4444',
  'Western Europe': '#22c55e',
  'Asia Pacific': '#3b82f6',
  'East Asia': '#8b5cf6',
  'Eastern Europe': '#ec4899',
  'South America': '#14b8a6',
  'Oceania': '#f59e0b',
  'Other': '#6b7280',
};

export function StorageTreemap({ nodes, isLoading }: StorageTreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: RegionData } | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 400 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const treemapData = useMemo(() => {
    const regionMap = new Map<string, { storage: number; count: number }>();

    nodes.forEach(node => {
      const region = getRegionFromIP(node.ip);
      const existing = regionMap.get(region) || { storage: 0, count: 0 };
      regionMap.set(region, {
        storage: existing.storage + node.storage_committed,
        count: existing.count + 1
      });
    });

    const children: RegionData[] = Array.from(regionMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.storage,
        count: data.count,
        color: regionColors[name] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value);

    return {
      name: 'Storage',
      children
    };
  }, [nodes]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    const root = d3.hierarchy<any>(treemapData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemap = d3.treemap<any>()
      .size([width, height])
      .padding(3)
      .round(true);

    treemap(root);

    const leaves = root.leaves();

    // Add rectangles
    const rects = svg.selectAll('rect')
      .data(leaves)
      .enter()
      .append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d: any) => d.data.color)
      .attr('fill-opacity', 0)
      .attr('stroke', (d: any) => d.data.color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.5)
      .attr('rx', 8)
      .style('cursor', 'pointer')
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
          .attr('fill-opacity', 0.9)
          .attr('stroke-width', 3);
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
      .on('mouseleave', function() {
        setTooltip(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.75)
          .attr('stroke-width', 2);
      });

    // Animate in
    rects.transition()
      .duration(800)
      .delay((d: any, i: number) => i * 50)
      .attr('fill-opacity', 0.75);

    // Add labels
    svg.selectAll('text.region-name')
      .data(leaves.filter((d: any) => (d.x1 - d.x0) > 80 && (d.y1 - d.y0) > 50))
      .enter()
      .append('text')
      .attr('class', 'region-name')
      .attr('x', (d: any) => d.x0 + 10)
      .attr('y', (d: any) => d.y0 + 25)
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .attr('opacity', 0)
      .text((d: any) => d.data.name)
      .transition()
      .duration(500)
      .delay(800)
      .attr('opacity', 1);

    svg.selectAll('text.region-value')
      .data(leaves.filter((d: any) => (d.x1 - d.x0) > 80 && (d.y1 - d.y0) > 70))
      .enter()
      .append('text')
      .attr('class', 'region-value')
      .attr('x', (d: any) => d.x0 + 10)
      .attr('y', (d: any) => d.y0 + 45)
      .attr('fill', 'white')
      .attr('fill-opacity', 0.7)
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
      .attr('opacity', 0)
      .text((d: any) => formatBytes(d.data.value))
      .transition()
      .duration(500)
      .delay(800)
      .attr('opacity', 1);

    svg.selectAll('text.region-count')
      .data(leaves.filter((d: any) => (d.x1 - d.x0) > 80 && (d.y1 - d.y0) > 90))
      .enter()
      .append('text')
      .attr('class', 'region-count')
      .attr('x', (d: any) => d.x0 + 10)
      .attr('y', (d: any) => d.y0 + 62)
      .attr('fill', 'white')
      .attr('fill-opacity', 0.5)
      .attr('font-size', '11px')
      .attr('pointer-events', 'none')
      .attr('opacity', 0)
      .text((d: any) => `${d.data.count} nodes`)
      .transition()
      .duration(500)
      .delay(800)
      .attr('opacity', 1);

  }, [treemapData, dimensions, nodes.length]);

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Regional Storage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const totalStorage = nodes.reduce((a, b) => a + b.storage_committed, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-xandeum-purple to-purple-600">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Regional Storage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Storage capacity by geographic region</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatBytes(totalStorage)}</p>
            <p className="text-xs text-muted-foreground">Total Network Storage</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/30"
          style={{ height: 400 }}
        >
          <svg ref={svgRef} width={dimensions.width} height={400} />

          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute z-50 pointer-events-none bg-black/95 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10 min-w-[180px]"
              style={{
                left: Math.min(tooltip.x + 15, dimensions.width - 200),
                top: tooltip.y - 10
              }}
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: tooltip.data.color }} />
                <span className="text-white font-semibold">{tooltip.data.name}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Storage:</span>
                  <span className="text-xandeum-orange font-medium">{formatBytes(tooltip.data.value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Nodes:</span>
                  <span className="text-white font-medium">{tooltip.data.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Share:</span>
                  <span className="text-green-400 font-medium">{((tooltip.data.value / totalStorage) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-4 px-4 border-t border-border/50 bg-background/50">
          {treemapData.children?.slice(0, 6).map(region => (
            <div key={region.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: region.color }} />
              <span className="text-xs text-muted-foreground">{region.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
