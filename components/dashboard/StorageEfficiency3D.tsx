'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, TrendingUp } from 'lucide-react';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';
import * as THREE from 'three';

interface StorageEfficiency3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

function StorageBar({ position, height, color, label, value }: {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  value: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + position[0]) * 0.05;
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <RoundedBox
          ref={meshRef}
          args={[0.8, height, 0.8]}
          radius={0.1}
          smoothness={4}
          position={[0, height / 2, 0]}
        >
          <meshStandardMaterial
            color={color}
            metalness={0.3}
            roughness={0.4}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </RoundedBox>
      </Float>
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="bottom"
      >
        {value}
      </Text>
    </group>
  );
}

function StorageVisualization({ committed, used, efficiency }: {
  committed: number;
  used: number;
  efficiency: number;
}) {
  const maxHeight = 3;
  const committedHeight = maxHeight;
  const usedHeight = (used / committed) * maxHeight || 0.1;
  const efficiencyHeight = (efficiency / 100) * maxHeight;

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F3771F" />

      <StorageBar
        position={[-2, 0, 0]}
        height={committedHeight}
        color="#3b82f6"
        label="Committed"
        value={formatBytes(committed)}
      />
      <StorageBar
        position={[0, 0, 0]}
        height={usedHeight}
        color="#22c55e"
        label="Used"
        value={formatBytes(used)}
      />
      <StorageBar
        position={[2, 0, 0]}
        height={efficiencyHeight}
        color="#F3771F"
        label="Efficiency"
        value={`${efficiency.toFixed(1)}%`}
      />

      {/* Grid floor */}
      <gridHelper args={[10, 20, '#333', '#222']} position={[0, 0, 0]} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}

export function StorageEfficiency3D({ nodes, isLoading }: StorageEfficiency3DProps) {
  const stats = useMemo(() => {
    const committed = nodes.reduce((a, b) => a + b.storage_committed, 0);
    const used = nodes.reduce((a, b) => a + b.storage_used, 0);
    const efficiency = committed > 0 ? (used / committed) * 100 : 0;

    return { committed, used, efficiency };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Storage Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Storage Efficiency</CardTitle>
              <p className="text-sm text-muted-foreground">3D visualization of network storage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-lg font-bold text-green-400">{stats.efficiency.toFixed(1)}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[320px] bg-gradient-to-b from-slate-900 to-slate-800"
        >
          <Canvas camera={{ position: [5, 4, 5], fov: 50 }}>
            <StorageVisualization
              committed={stats.committed}
              used={stats.used}
              efficiency={stats.efficiency}
            />
          </Canvas>
        </motion.div>

        {/* Stats footer */}
        <div className="flex items-center justify-around py-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Committed</p>
            <p className="text-sm font-bold text-blue-400">{formatBytes(stats.committed)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Used</p>
            <p className="text-sm font-bold text-green-400">{formatBytes(stats.used)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-sm font-bold text-gray-400">{formatBytes(stats.committed - stats.used)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
