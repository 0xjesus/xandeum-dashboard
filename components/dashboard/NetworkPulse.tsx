'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Radio, Wifi, Clock } from 'lucide-react';
import { PNode } from '@/types';

interface NetworkPulseProps {
  nodes: PNode[];
  isLoading?: boolean;
}

export function NetworkPulse({ nodes, isLoading }: NetworkPulseProps) {
  const [pulseCount, setPulseCount] = useState(0);
  const [lastPulse, setLastPulse] = useState(Date.now());

  // Simulate heartbeat every 30 seconds as per Xandeum docs
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
      setLastPulse(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const online = nodes.filter(n => n.status === 'online');
    const recentlyActive = nodes.filter(n => {
      const lastSeen = new Date(n.last_seen_timestamp * 1000);
      const now = new Date();
      return (now.getTime() - lastSeen.getTime()) < 60000; // Last 60 seconds
    });

    return {
      online: online.length,
      total: nodes.length,
      recentlyActive: recentlyActive.length,
      avgUptime: online.length > 0
        ? Math.round(online.reduce((a, b) => a + b.uptime, 0) / online.length)
        : 0
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[300px]">
        <CardHeader>
          <CardTitle className="text-lg">Network Pulse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const healthPercent = stats.total > 0 ? (stats.online / stats.total) * 100 : 0;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-lg text-white">Network Pulse</CardTitle>
              <p className="text-sm text-white/50">Real-time heartbeat monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-green-400">LIVE</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* Central pulse visualization */}
        <div className="relative h-[200px] flex items-center justify-center">
          {/* Pulse rings */}
          <AnimatePresence>
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={`ring-${ring}-${pulseCount}`}
                className="absolute rounded-full border-2 border-green-500/30"
                initial={{ width: 80, height: 80, opacity: 0.8 }}
                animate={{
                  width: [80, 300],
                  height: [80, 300],
                  opacity: [0.8, 0]
                }}
                transition={{
                  duration: 3,
                  delay: ring * 0.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}
          </AnimatePresence>

          {/* Central core */}
          <motion.div
            className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.online}</p>
              <p className="text-[10px] text-white/70 uppercase">Active</p>
            </div>
          </motion.div>

          {/* Orbiting dots representing active nodes */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-xandeum-orange shadow-lg shadow-xandeum-orange/50"
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                transformOrigin: '50px 50px',
                left: 'calc(50% - 6px)',
                top: 'calc(50% - 50px - 6px)'
              }}
            />
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <Radio className="h-4 w-4 mx-auto mb-1 text-green-400" />
            <p className="text-lg font-bold text-white">{healthPercent.toFixed(0)}%</p>
            <p className="text-[10px] text-white/50">Network Health</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <Wifi className="h-4 w-4 mx-auto mb-1 text-xandeum-orange" />
            <p className="text-lg font-bold text-white">{stats.recentlyActive}</p>
            <p className="text-[10px] text-white/50">Active (60s)</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold text-white">30s</p>
            <p className="text-[10px] text-white/50">Heartbeat</p>
          </div>
        </div>

        {/* Last pulse indicator */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/40">
            Last network pulse: {new Date(lastPulse).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
