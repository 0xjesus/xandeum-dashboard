'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, TrendingUp, Award } from 'lucide-react';
import { PNode } from '@/types';
import * as THREE from 'three';

interface UptimeDistribution3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

function UptimeColumn({
  position,
  height,
  color,
  label,
  count,
  delay
}: {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  count: number;
  delay: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = height / 2 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.05;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1);
    }
  });

  return (
    <group position={position}>
      {/* Base glow */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={glowRef}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* Column */}
      <Float speed={1} rotationIntensity={0} floatIntensity={0.1}>
        <RoundedBox
          ref={meshRef}
          args={[0.8, height, 0.8]}
          radius={0.1}
          smoothness={4}
        >
          <meshStandardMaterial
            color={color}
            metalness={0.6}
            roughness={0.3}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </RoundedBox>
      </Float>

      {/* Label */}
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>

      {/* Count */}
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.25}
        color={color}
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
      >
        {count}
      </Text>
    </group>
  );
}

function UptimeVisualization({ distribution }: {
  distribution: Array<{ label: string; count: number; color: string }>;
}) {
  const maxCount = Math.max(...distribution.map(d => d.count), 1);
  const maxHeight = 3;

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F3771F" />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.5} penumbra={1} />

      {distribution.map((d, i) => {
        const height = Math.max((d.count / maxCount) * maxHeight, 0.2);
        const xPos = (i - (distribution.length - 1) / 2) * 1.5;
        return (
          <UptimeColumn
            key={d.label}
            position={[xPos, 0, 0]}
            height={height}
            color={d.color}
            label={d.label}
            count={d.count}
            delay={i * 0.5}
          />
        );
      })}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#0a0a0f" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Grid */}
      <gridHelper args={[12, 24, '#1a1a2e', '#0f0f1a']} position={[0, 0, 0]} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}

export function UptimeDistribution3D({ nodes, isLoading }: UptimeDistribution3DProps) {
  const distribution = useMemo(() => {
    const buckets = [
      { label: '<1h', min: 0, max: 3600, color: '#ef4444', count: 0 },
      { label: '1-6h', min: 3600, max: 21600, color: '#f97316', count: 0 },
      { label: '6-24h', min: 21600, max: 86400, color: '#F3771F', count: 0 },
      { label: '1-7d', min: 86400, max: 604800, color: '#22c55e', count: 0 },
      { label: '>7d', min: 604800, max: Infinity, color: '#10b981', count: 0 },
    ];

    nodes.forEach(node => {
      for (const bucket of buckets) {
        if (node.uptime >= bucket.min && node.uptime < bucket.max) {
          bucket.count++;
          break;
        }
      }
    });

    return buckets;
  }, [nodes]);

  const stats = useMemo(() => {
    const totalUptime = nodes.reduce((a, b) => a + b.uptime, 0);
    const avgUptime = nodes.length > 0 ? totalUptime / nodes.length : 0;
    const maxUptime = Math.max(...nodes.map(n => n.uptime), 0);
    const longestNode = nodes.find(n => n.uptime === maxUptime);

    const formatTime = (seconds: number) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      if (days > 0) return `${days}d ${hours}h`;
      return `${hours}h`;
    };

    return {
      avgUptime: formatTime(avgUptime),
      maxUptime: formatTime(maxUptime),
      longestNodeIp: longestNode?.ip || 'N/A',
      healthyCount: distribution[3].count + distribution[4].count,
    };
  }, [nodes, distribution]);

  if (isLoading) {
    return (
      <Card className="h-[450px]">
        <CardHeader>
          <CardTitle className="text-lg">Uptime Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[370px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
              <Timer className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Uptime Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">3D histogram of node uptime ranges</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20">
            <Award className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">{stats.healthyCount} stable</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[320px] bg-gradient-to-b from-[#050510] to-[#0a0a1a]"
        >
          <Canvas camera={{ position: [0, 4, 7], fov: 50 }}>
            <UptimeVisualization distribution={distribution} />
          </Canvas>
        </motion.div>

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4 p-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-muted-foreground">Avg Uptime</span>
            </div>
            <p className="text-lg font-bold text-blue-400">{stats.avgUptime}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="h-3 w-3 text-green-400" />
              <span className="text-xs text-muted-foreground">Best Uptime</span>
            </div>
            <p className="text-lg font-bold text-green-400">{stats.maxUptime}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer className="h-3 w-3 text-xandeum-orange" />
              <span className="text-xs text-muted-foreground">Champion</span>
            </div>
            <p className="text-sm font-bold text-xandeum-orange font-mono truncate">{stats.longestNodeIp}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 py-3 border-t border-border/30 bg-background/30 flex-wrap">
          {distribution.map(d => (
            <div key={d.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
