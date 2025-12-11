'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Ring, Torus } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, Database, Server } from 'lucide-react';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';
import * as THREE from 'three';

interface StorageCapacity3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

function CapacityRing({
  radius,
  thickness,
  fillPercent,
  color,
  label,
  yOffset
}: {
  radius: number;
  thickness: number;
  fillPercent: number;
  color: string;
  label: string;
  yOffset: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const fillRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  const fillAngle = (fillPercent / 100) * Math.PI * 2;

  return (
    <group position={[0, yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Background ring */}
      <Torus args={[radius, thickness, 16, 64]} ref={ringRef}>
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.5}
          metalness={0.5}
          roughness={0.5}
        />
      </Torus>

      {/* Fill ring - partial */}
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[radius, thickness * 1.1, 16, 64, fillAngle]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0, thickness + 0.3]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {label}
      </Text>

      {/* Percentage */}
      <Text
        position={[radius + 0.8, 0, 0]}
        fontSize={0.2}
        color={color}
        anchorX="left"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {fillPercent.toFixed(1)}%
      </Text>
    </group>
  );
}

function CentralCore({ nodeCount, onlinePercent }: { nodeCount: number; onlinePercent: number }) {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#F3771F"
          transparent
          opacity={0.1}
          emissive="#F3771F"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#F3771F"
          emissive="#F3771F"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Node count */}
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.3}
        color="#F3771F"
        anchorX="center"
        anchorY="middle"
      >
        {nodeCount} NODES
      </Text>
    </group>
  );
}

function StorageVisualization({ stats }: {
  stats: {
    totalCommitted: number;
    totalUsed: number;
    utilizationPercent: number;
    nodeCount: number;
    onlinePercent: number;
    avgPerNode: number;
    publicNodes: number;
    publicPercent: number;
  }
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F3771F" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#3b82f6" />

      <CentralCore nodeCount={stats.nodeCount} onlinePercent={stats.onlinePercent} />

      {/* Utilization Ring - innermost */}
      <CapacityRing
        radius={1.5}
        thickness={0.15}
        fillPercent={stats.utilizationPercent * 10000} // Scale up tiny percentage for visibility
        color="#22c55e"
        label="Storage Used"
        yOffset={0}
      />

      {/* Online Ring - middle */}
      <CapacityRing
        radius={2.2}
        thickness={0.12}
        fillPercent={stats.onlinePercent}
        color="#3b82f6"
        label="Online"
        yOffset={0}
      />

      {/* Public Nodes Ring - outer */}
      <CapacityRing
        radius={2.9}
        thickness={0.1}
        fillPercent={stats.publicPercent}
        color="#F3771F"
        label="Public"
        yOffset={0}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}

export function StorageCapacity3D({ nodes, isLoading }: StorageCapacity3DProps) {
  const stats = useMemo(() => {
    const totalCommitted = nodes.reduce((a, b) => a + b.storage_committed, 0);
    const totalUsed = nodes.reduce((a, b) => a + b.storage_used, 0);
    const utilizationPercent = totalCommitted > 0 ? (totalUsed / totalCommitted) * 100 : 0;
    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const publicNodes = nodes.filter(n => n.is_public).length;

    return {
      totalCommitted,
      totalUsed,
      utilizationPercent,
      nodeCount: nodes.length,
      onlinePercent: nodes.length > 0 ? (onlineNodes / nodes.length) * 100 : 0,
      avgPerNode: nodes.length > 0 ? totalCommitted / nodes.length : 0,
      publicNodes,
      publicPercent: nodes.length > 0 ? (publicNodes / nodes.length) * 100 : 0,
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Network Capacity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-xandeum-orange to-orange-600 shadow-lg shadow-xandeum-orange/30">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Network Capacity Overview</CardTitle>
              <p className="text-sm text-muted-foreground">3D visualization of storage rings</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[380px] bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]"
        >
          <Canvas camera={{ position: [0, 4, 6], fov: 50 }}>
            <StorageVisualization stats={stats} />
          </Canvas>
        </motion.div>

        {/* Stats footer */}
        <div className="grid grid-cols-4 gap-4 p-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Used</span>
            </div>
            <p className="text-sm font-bold text-green-400">{formatBytes(stats.totalUsed)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Committed</span>
            </div>
            <p className="text-sm font-bold text-blue-400">{formatBytes(stats.totalCommitted)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-xandeum-orange" />
              <span className="text-xs text-muted-foreground">Public</span>
            </div>
            <p className="text-sm font-bold text-xandeum-orange">{stats.publicNodes} nodes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Server className="w-3 h-3 text-white/50" />
              <span className="text-xs text-muted-foreground">Avg/Node</span>
            </div>
            <p className="text-sm font-bold text-white">{formatBytes(stats.avgPerNode)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
