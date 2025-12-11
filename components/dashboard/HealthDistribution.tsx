'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, TrendingUp } from 'lucide-react';
import { PNode } from '@/types';

interface HealthDistributionProps {
  nodes: PNode[];
  isLoading?: boolean;
}

export function HealthDistribution({ nodes, isLoading }: HealthDistributionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });
  const [hoveredBar, setHoveredBar] = useState<{ x: number; y: number; range: string; count: number; percent: number } | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 300 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const histogramData = useMemo(() => {
    const bins = [
      { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
      { range: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
      { range: '41-60', min: 41, max: 60, count: 0, color: '#eab308' },
      { range: '61-80', min: 61, max: 80, count: 0, color: '#84cc16' },
      { range: '81-100', min: 81, max: 100, count: 0, color: '#22c55e' },
    ];

    nodes.forEach(node => {
      const bin = bins.find(b => node.healthScore >= b.min && node.healthScore <= b.max);
      if (bin) bin.count++;
    });

    return bins;
  }, [nodes]);

  const avgHealth = useMemo(() => {
    if (nodes.length === 0) return 0;
    return Math.round(nodes.reduce((a, b) => a + b.healthScore, 0) / nodes.length);
  }, [nodes]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxCount = d3.max(histogramData, d => d.count) || 0;

    const x = d3.scaleBand()
      .domain(histogramData.map(d => d.range))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.1])
      .range([innerHeight, 0]);

    // Add grid lines
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

    // Add bars with gradient
    const defs = svg.append('defs');
    histogramData.forEach((d, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `bar-gradient-${i}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d.color)
        .attr('stop-opacity', 1);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.color)
        .attr('stop-opacity', 0.5);
    });

    const bars = g.selectAll('rect')
      .data(histogramData)
      .enter()
      .append('rect')
      .attr('x', d => x(d.range) || 0)
      .attr('y', innerHeight)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', (d, i) => `url(#bar-gradient-${i})`)
      .attr('rx', 6)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event: any, d: any) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setHoveredBar({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            range: d.range,
            count: d.count,
            percent: (d.count / nodes.length) * 100
          });
        }
        d3.select(this)
          .transition()
          .duration(200)
          .attr('filter', 'brightness(1.2)');
      })
      .on('mouseleave', function() {
        setHoveredBar(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('filter', 'none');
      });

    // Animate bars
    bars.transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.count))
      .attr('height', d => innerHeight - y(d.count));

    // Add value labels
    g.selectAll('text.value')
      .data(histogramData)
      .enter()
      .append('text')
      .attr('class', 'value')
      .attr('x', d => (x(d.range) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('opacity', 0)
      .text(d => d.count)
      .transition()
      .duration(500)
      .delay(800)
      .attr('opacity', 1);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.6)
      .attr('font-size', '11px');

    g.selectAll('.domain').attr('stroke', 'white').attr('stroke-opacity', 0.1);
    g.selectAll('.tick line').attr('stroke', 'white').attr('stroke-opacity', 0.1);

    // X axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.5)
      .attr('font-size', '12px')
      .text('Health Score Range (%)');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.6)
      .attr('font-size', '11px');

  }, [histogramData, dimensions, nodes.length]);

  if (isLoading) {
    return (
      <Card className="h-[420px]">
        <CardHeader>
          <CardTitle className="text-lg">Health Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const healthyNodes = nodes.filter(n => n.healthScore >= 80).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Health Score Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Network-wide node health analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{avgHealth}%</p>
              <p className="text-xs text-muted-foreground">Avg Health</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{healthyNodes}</p>
              <p className="text-xs text-muted-foreground">Healthy (80%+)</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/30"
          style={{ height: 300 }}
        >
          <svg ref={svgRef} width={dimensions.width} height={300} />

          {hoveredBar && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute z-50 pointer-events-none bg-black/95 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10"
              style={{
                left: Math.min(hoveredBar.x + 15, dimensions.width - 150),
                top: hoveredBar.y - 10
              }}
            >
              <p className="text-white font-semibold mb-1">{hoveredBar.range}% Health</p>
              <div className="space-y-1 text-sm">
                <p className="text-white/70">Nodes: <span className="text-white font-medium">{hoveredBar.count}</span></p>
                <p className="text-white/70">Share: <span className="text-xandeum-orange font-medium">{hoveredBar.percent.toFixed(1)}%</span></p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-center gap-6 py-4 border-t border-border/50 bg-background/50">
          {histogramData.map(bin => (
            <div key={bin.range} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: bin.color }} />
              <span className="text-xs text-muted-foreground">{bin.range}%: {bin.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
