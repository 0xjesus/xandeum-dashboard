'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Activity, AlertCircle } from 'lucide-react';
import { PNode } from '@/types';

interface NodeTimelineProps {
  nodes: PNode[];
  isLoading?: boolean;
}

export function NodeTimeline({ nodes, isLoading }: NodeTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 200 });
  const [hoveredNode, setHoveredNode] = useState<PNode | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 200 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const timelineData = useMemo(() => {
    const now = Date.now();
    return nodes
      .map(node => ({
        ...node,
        lastSeenMs: node.last_seen_timestamp * 1000,
        minutesAgo: Math.floor((now - node.last_seen_timestamp * 1000) / 60000)
      }))
      .sort((a, b) => b.lastSeenMs - a.lastSeenMs)
      .slice(0, 100);
  }, [nodes]);

  useEffect(() => {
    if (!svgRef.current || timelineData.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const x = d3.scaleTime()
      .domain([oneHourAgo, now])
      .range([0, innerWidth]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Background gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'timeline-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#22c55e')
      .attr('stop-opacity', 0.1);

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'url(#timeline-gradient)')
      .attr('rx', 8);

    // Time axis
    const xAxis = d3.axisBottom(x)
      .ticks(6)
      .tickFormat((d: any) => {
        const date = new Date(d);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.5)
      .attr('font-size', '10px');

    g.selectAll('.domain').attr('stroke', 'white').attr('stroke-opacity', 0.1);
    g.selectAll('.tick line').attr('stroke', 'white').attr('stroke-opacity', 0.1);

    // Plot nodes
    const nodeGroups = g.selectAll('circle')
      .data(timelineData.filter(n => n.lastSeenMs >= oneHourAgo))
      .enter()
      .append('circle')
      .attr('cx', (d: any) => x(d.lastSeenMs))
      .attr('cy', () => innerHeight / 2 + (Math.random() - 0.5) * (innerHeight * 0.6))
      .attr('r', 0)
      .attr('fill', (d: any) => {
        if (d.status === 'online') return '#22c55e';
        if (d.status === 'degraded') return '#F3771F';
        return '#ef4444';
      })
      .attr('fill-opacity', 0.7)
      .attr('stroke', (d: any) => {
        if (d.status === 'online') return '#22c55e';
        if (d.status === 'degraded') return '#F3771F';
        return '#ef4444';
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.3)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event: any, d: any) {
        setHoveredNode(d);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8)
          .attr('fill-opacity', 1)
          .attr('stroke-opacity', 1);
      })
      .on('mouseleave', function() {
        setHoveredNode(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5)
          .attr('fill-opacity', 0.7)
          .attr('stroke-opacity', 0.3);
      });

    // Animate in
    nodeGroups.transition()
      .duration(800)
      .delay((d: any, i: number) => i * 5)
      .attr('r', 5);

    // "Now" indicator
    g.append('line')
      .attr('x1', innerWidth)
      .attr('x2', innerWidth)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', 10)
      .attr('text-anchor', 'end')
      .attr('fill', '#22c55e')
      .attr('font-size', '10px')
      .text('NOW');

  }, [timelineData, dimensions]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last5min = nodes.filter(n => (now - n.last_seen_timestamp * 1000) < 300000).length;
    const last15min = nodes.filter(n => (now - n.last_seen_timestamp * 1000) < 900000).length;
    const last60min = nodes.filter(n => (now - n.last_seen_timestamp * 1000) < 3600000).length;

    return { last5min, last15min, last60min };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[350px]">
        <CardHeader>
          <CardTitle className="text-lg">Node Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[270px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Node Activity Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">Last seen timestamps (past hour)</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-gradient-to-r from-slate-900 to-slate-800"
          style={{ height: 200 }}
        >
          <svg ref={svgRef} width={dimensions.width} height={200} />

          {/* Tooltip */}
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 bg-black/95 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10 z-10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: hoveredNode.status === 'online' ? '#22c55e' :
                      hoveredNode.status === 'degraded' ? '#F3771F' : '#ef4444'
                  }}
                />
                <span className="text-white font-medium capitalize">{hoveredNode.status}</span>
              </div>
              <p className="font-mono text-xs text-white/70 mb-1">
                {hoveredNode.pubkey.slice(0, 16)}...
              </p>
              <p className="text-xs text-white/50">
                Last seen: {new Date(hoveredNode.last_seen_timestamp * 1000).toLocaleTimeString()}
              </p>
            </motion.div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-around py-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-green-400" />
              <span className="text-xs text-muted-foreground">5 min</span>
            </div>
            <p className="text-lg font-bold text-green-400">{stats.last5min}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-xandeum-orange" />
              <span className="text-xs text-muted-foreground">15 min</span>
            </div>
            <p className="text-lg font-bold text-xandeum-orange">{stats.last15min}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-muted-foreground">60 min</span>
            </div>
            <p className="text-lg font-bold text-blue-400">{stats.last60min}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
