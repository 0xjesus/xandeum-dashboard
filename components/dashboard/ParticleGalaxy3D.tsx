'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Orbit, Star, Sparkles } from 'lucide-react';
import { PNode } from '@/types';
import * as THREE from 'three';

interface ParticleGalaxy3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

function GalaxyParticles({ count, color, radius, speed, size }: {
  count: number;
  color: string;
  radius: number;
  speed: number;
  size: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spiral galaxy distribution
      const angle = Math.random() * Math.PI * 2;
      const armOffset = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3); // 3 spiral arms
      const distance = Math.random() * radius;
      const spiralAngle = angle + (distance / radius) * Math.PI * 2 + armOffset;

      // Add some noise for natural look
      const noise = (Math.random() - 0.5) * 0.5;

      pos[i * 3] = Math.cos(spiralAngle) * distance + noise;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3 * (1 - distance / radius); // Thinner at edges
      pos[i * 3 + 2] = Math.sin(spiralAngle) * distance + noise;
    }

    return pos;
  }, [count, radius]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function NodeStars({ nodes }: { nodes: PNode[] }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = Math.min(nodes.length, 100);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    nodes.slice(0, count).forEach((node, i) => {
      // Distribute based on uptime (longer uptime = closer to center)
      const maxUptime = Math.max(...nodes.map(n => n.uptime), 1);
      const uptimeRatio = node.uptime / maxUptime;
      const distance = 2 + (1 - uptimeRatio) * 3;

      const theta = (i / count) * Math.PI * 2 * 3; // 3 full rotations
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);

      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * distance;
      pos[i * 3 + 1] = Math.cos(phi) * distance * 0.3;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * distance;

      // Color based on status
      const color = new THREE.Color(
        node.status === 'online' ? '#22c55e' :
        node.status === 'degraded' ? '#F3771F' : '#ef4444'
      );
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      // Size based on health
      siz[i] = 0.05 + (node.healthScore / 100) * 0.15;
    });

    return { positions: pos, colors: col, sizes: siz };
  }, [nodes]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CentralBlackHole() {
  const ringRef = useRef<THREE.Mesh>(null);
  const discRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
    if (discRef.current) {
      discRef.current.rotation.z = -state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group>
      {/* Event horizon */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Accretion disk */}
      <mesh ref={discRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 1.2, 64]} />
        <meshBasicMaterial
          color="#F3771F"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 16, 64]} />
        <meshStandardMaterial
          color="#F3771F"
          emissive="#F3771F"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Jets */}
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[0.1, 1.5, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 1.5, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function GalaxyVisualization({ nodes }: { nodes: PNode[] }) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#F3771F" />

      {/* Background stars */}
      <GalaxyParticles count={2000} color="#ffffff" radius={8} speed={0.02} size={0.02} />

      {/* Main galaxy arms */}
      <GalaxyParticles count={3000} color="#6366f1" radius={5} speed={0.05} size={0.03} />
      <GalaxyParticles count={2000} color="#F3771F" radius={4} speed={0.08} size={0.025} />
      <GalaxyParticles count={1500} color="#22c55e" radius={3} speed={0.1} size={0.02} />

      {/* Node stars */}
      <NodeStars nodes={nodes} />

      {/* Central black hole */}
      <CentralBlackHole />

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.2}
        maxDistance={12}
        minDistance={3}
      />
    </>
  );
}

export function ParticleGalaxy3D({ nodes, isLoading }: ParticleGalaxy3DProps) {
  const stats = useMemo(() => {
    const online = nodes.filter(n => n.status === 'online').length;
    const totalUptime = nodes.reduce((a, b) => a + b.uptime, 0);
    const avgUptimeDays = nodes.length > 0 ? (totalUptime / nodes.length) / 86400 : 0;

    return {
      online,
      total: nodes.length,
      avgUptimeDays: avgUptimeDays.toFixed(1)
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Network Galaxy</CardTitle>
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Orbit className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Network Galaxy</CardTitle>
              <p className="text-sm text-muted-foreground">Artistic visualization • Real node stats below</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-muted-foreground">{nodes.length} stars</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[400px] bg-[#000005]"
        >
          <Canvas camera={{ position: [0, 3, 6], fov: 60 }}>
            <GalaxyVisualization nodes={nodes} />
          </Canvas>
        </motion.div>

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4 p-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-3 w-3 text-green-400" />
              <span className="text-xs text-muted-foreground">Online Stars</span>
            </div>
            <p className="text-xl font-bold text-green-400">{stats.online}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Orbit className="h-3 w-3 text-indigo-400" />
              <span className="text-xs text-muted-foreground">Total Stars</span>
            </div>
            <p className="text-xl font-bold text-indigo-400">{stats.total}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Sparkles className="h-3 w-3 text-xandeum-orange" />
              <span className="text-xs text-muted-foreground">Avg Age (days)</span>
            </div>
            <p className="text-xl font-bold text-xandeum-orange">{stats.avgUptimeDays}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
