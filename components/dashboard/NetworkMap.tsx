'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PNode } from '@/types';
import { CHART_COLORS } from '@/lib/constants';

interface NetworkMapProps {
  nodes: PNode[];
  isLoading?: boolean;
}

// Generate pseudo-coordinates from IP
function ipToCoords(ip: string): { x: number; y: number } {
  const parts = ip.split('.').map(Number);
  // Map IP octets to a 2D space
  const x = ((parts[0] * 256 + parts[1]) / 65535) * 100;
  const y = ((parts[2] * 256 + parts[3]) / 65535) * 100;
  return { x, y };
}

export function NetworkMap({ nodes, isLoading }: NetworkMapProps) {
  const nodePositions = useMemo(() => {
    return nodes.slice(0, 100).map((node) => ({
      ...node,
      coords: ipToCoords(node.ip),
    }));
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Network Topology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Network Topology</span>
          <span className="text-sm font-normal text-muted-foreground">
            {nodes.length} nodes
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* Grid background */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22c55e" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full">
            {nodePositions.slice(0, 30).map((node, i) => {
              const nextNode = nodePositions[(i + 1) % nodePositions.length];
              if (!nextNode || node.status !== 'online') return null;
              return (
                <motion.line
                  key={`line-${node.pubkey}`}
                  x1={`${node.coords.x}%`}
                  y1={`${node.coords.y}%`}
                  x2={`${nextNode.coords.x}%`}
                  y2={`${nextNode.coords.y}%`}
                  stroke="#22c55e"
                  strokeWidth="1"
                  strokeOpacity="0.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: i * 0.05 }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodePositions.map((node, index) => (
            <motion.div
              key={node.pubkey}
              className="absolute"
              style={{
                left: `${node.coords.x}%`,
                top: `${node.coords.y}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
            >
              {/* Pulse effect for online nodes */}
              {node.status === 'online' && (
                <motion.div
                  className="absolute -inset-2 rounded-full bg-green-500/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div
                className={`w-3 h-3 rounded-full border-2 shadow-lg cursor-pointer
                  ${node.status === 'online'
                    ? 'bg-green-500 border-green-400 shadow-green-500/50'
                    : node.status === 'degraded'
                      ? 'bg-yellow-500 border-yellow-400 shadow-yellow-500/50'
                      : 'bg-red-500 border-red-400 shadow-red-500/50'
                  }`}
                title={`${node.pubkey.slice(0, 8)}... - ${node.status}`}
              />
            </motion.div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-black/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-white/70">Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-white/70">Degraded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-white/70">Offline</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
