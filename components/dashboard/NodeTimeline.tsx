'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Activity, TrendingUp, Users } from 'lucide-react';
import { PNode } from '@/types';

interface NodeTimelineProps {
  nodes: PNode[];
  isLoading?: boolean;
}

export function NodeTimeline({ nodes, isLoading }: NodeTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });
  const [hoveredBucket, setHoveredBucket] = useState<{ time: string; count: number; status: { online: number; degraded: number; offline: number } } | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 280 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Create time buckets for the last hour (5-minute intervals)
  const timeData = useMemo(() => {
    const now = Date.now();
    const buckets: Array<{
      time: Date;
      label: string;
      nodes: PNode[];
      online: number;
      degraded: number;
      offline: number;
    }> = [];

    // Create 12 buckets (5 min each = 1 hour)
    for (let i = 11; i >= 0; i--) {
      const bucketStart = now - (i + 1) * 5 * 60 * 1000;
      const bucketEnd = now - i * 5 * 60 * 1000;
      const time = new Date(bucketEnd);

      const nodesInBucket = nodes.filter(n => {
        const lastSeen = n.last_seen_timestamp * 1000;
        return lastSeen >= bucketStart && lastSeen < bucketEnd;
      });

      buckets.push({
        time,
        label: `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`,
        nodes: nodesInBucket,
        online: nodesInBucket.filter(n => n.status === 'online').length,
        degraded: nodesInBucket.filter(n => n.status === 'degraded').length,
        offline: nodesInBucket.filter(n => n.status === 'offline').length,
      });
    }

    return buckets;
  }, [nodes]);

  useEffect(() => {
    if (!svgRef.current || timeData.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const margin = { top: 30, right: 20, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const maxCount = Math.max(...timeData.map(d => d.online + d.degraded + d.offline), 1);

    const x = d3.scaleBand()
      .domain(timeData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.1])
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(y.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', 'white')
      .attr('stroke-opacity', 0.05);

    // Stacked bars
    const stack = d3.stack<any>()
      .keys(['offline', 'degraded', 'online']);

    const stackedData = stack(timeData);

    const colors: Record<string, string> = {
      online: '#22c55e',
      degraded: '#F3771F',
      offline: '#ef4444'
    };

    g.selectAll('.layer')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('fill', d => colors[d.key])
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.data.label) || 0)
      .attr('y', innerHeight)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event: any, d: any) {
        const data = d.data;
        setHoveredBucket({
          time: data.label,
          count: data.online + data.degraded + data.offline,
          status: {
            online: data.online,
            degraded: data.degraded,
            offline: data.offline
          }
        });
        d3.select(this).attr('fill-opacity', 1);
      })
      .on('mouseleave', function() {
        setHoveredBucket(null);
        d3.select(this).attr('fill-opacity', 0.8);
      })
      .transition()
      .duration(800)
      .delay((d: any, i: number) => i * 50)
      .attr('y', (d: any) => y(d[1]))
      .attr('height', (d: any) => y(d[0]) - y(d[1]))
      .attr('fill-opacity', 0.8);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.5)
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em');

    g.select('.domain').attr('stroke', 'white').attr('stroke-opacity', 0.1);

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
      .selectAll('text')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.5)
      .attr('font-size', '10px');

    g.selectAll('.tick line').attr('stroke', 'white').attr('stroke-opacity', 0.05);
    g.select('.domain').remove();

    // Title
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.7)
      .attr('font-size', '11px')
      .text('Node Activity by 5-minute Intervals (Last Hour)');

    // "Now" indicator
    g.append('line')
      .attr('x1', innerWidth)
      .attr('x2', innerWidth)
      .attr('y1', -20)
      .attr('y2', innerHeight + 5)
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.6);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .attr('fill', '#22c55e')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('NOW');

  }, [timeData, dimensions]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last5min = nodes.filter(n => (now - n.last_seen_timestamp * 1000) < 300000).length;
    const last15min = nodes.filter(n => (now - n.last_seen_timestamp * 1000) < 900000).length;
    const last60min = nodes.filter(n => (now - n.last_seen_timestamp * 1000) < 3600000).length;
    const avgPerBucket = last60min / 12;

    return { last5min, last15min, last60min, avgPerBucket };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[420px]">
        <CardHeader>
          <CardTitle className="text-lg">Node Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Node Activity Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">Last seen activity distribution</p>
            </div>
          </div>
          {hoveredBucket && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-right bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2"
            >
              <p className="text-xs text-muted-foreground">{hoveredBucket.time}</p>
              <p className="text-lg font-bold">{hoveredBucket.count} nodes</p>
              <div className="flex gap-2 text-[10px]">
                <span className="text-green-400">{hoveredBucket.status.online} online</span>
                <span className="text-xandeum-orange">{hoveredBucket.status.degraded} degraded</span>
                <span className="text-red-400">{hoveredBucket.status.offline} offline</span>
              </div>
            </motion.div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-gradient-to-b from-slate-900/50 to-slate-800/50"
          style={{ height: 280 }}
        >
          <svg ref={svgRef} width={dimensions.width} height={280} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-green-400" />
              <span className="text-xs text-muted-foreground">Last 5 min</span>
            </div>
            <p className="text-xl font-bold text-green-400">{stats.last5min}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-xandeum-orange" />
              <span className="text-xs text-muted-foreground">Last 15 min</span>
            </div>
            <p className="text-xl font-bold text-xandeum-orange">{stats.last15min}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-muted-foreground">Last Hour</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.last60min}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-purple-400" />
              <span className="text-xs text-muted-foreground">Avg/5min</span>
            </div>
            <p className="text-xl font-bold text-purple-400">{stats.avgPerBucket.toFixed(1)}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-3 border-t border-border/30 bg-background/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-xandeum-orange" />
            <span className="text-xs text-muted-foreground">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-muted-foreground">Offline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
