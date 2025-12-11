'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Layers } from 'lucide-react';
import { PNode } from '@/types';
import * as THREE from 'three';

interface Network3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

interface NodePoint {
  position: [number, number, number];
  color: string;
  node: PNode;
}

function AnimatedNode({ position, color, size = 0.15 }: {
  position: [number, number, number];
  color: string;
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2);
    }
  });

  return (
    <group position={position}>
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[size * 2, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </Sphere>
      {/* Core node */}
      <Sphere ref={meshRef} args={[size, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
    </group>
  );
}

function ConnectionLine({ start, end, color }: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <Line
      ref={ref}
      points={[start, end]}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.3}
    />
  );
}

function NetworkVisualization({ nodePoints, connections }: {
  nodePoints: NodePoint[];
  connections: { start: [number, number, number]; end: [number, number, number]; color: string }[];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F3771F" />

      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

      <group ref={groupRef}>
        {/* Connections */}
        {connections.map((conn, i) => (
          <ConnectionLine key={i} start={conn.start} end={conn.end} color={conn.color} />
        ))}

        {/* Nodes */}
        {nodePoints.map((np, i) => (
          <AnimatedNode
            key={i}
            position={np.position}
            color={np.color}
            size={0.1 + (np.node.healthScore / 100) * 0.1}
          />
        ))}

        {/* Central core */}
        <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#F3771F"
            emissive="#F3771F"
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.8}
          />
        </Sphere>
      </group>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate={false}
        maxDistance={20}
        minDistance={5}
      />
    </>
  );
}

export function Network3D({ nodes, isLoading }: Network3DProps) {
  const { nodePoints, connections, stats } = useMemo(() => {
    const points: NodePoint[] = [];
    const conns: { start: [number, number, number]; end: [number, number, number]; color: string }[] = [];

    // Create sphere distribution
    const maxNodes = Math.min(nodes.length, 100);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < maxNodes; i++) {
      const node = nodes[i];
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / maxNodes);
      const radius = 4 + (node.healthScore / 100) * 2;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const color = node.status === 'online' ? '#22c55e' :
                   node.status === 'degraded' ? '#F3771F' : '#ef4444';

      points.push({
        position: [x, y, z],
        color,
        node
      });
    }

    // Create connections between nearby online nodes
    const onlinePoints = points.filter(p => p.node.status === 'online');
    for (let i = 0; i < Math.min(onlinePoints.length, 30); i++) {
      for (let j = i + 1; j < Math.min(onlinePoints.length, 30); j++) {
        const p1 = onlinePoints[i];
        const p2 = onlinePoints[j];
        const dist = Math.sqrt(
          Math.pow(p1.position[0] - p2.position[0], 2) +
          Math.pow(p1.position[1] - p2.position[1], 2) +
          Math.pow(p1.position[2] - p2.position[2], 2)
        );

        if (dist < 4 && conns.length < 50) {
          conns.push({
            start: p1.position,
            end: p2.position,
            color: '#22c55e'
          });
        }
      }
    }

    // Also connect some to center
    for (let i = 0; i < Math.min(onlinePoints.length, 15); i++) {
      conns.push({
        start: onlinePoints[i].position,
        end: [0, 0, 0],
        color: '#F3771F'
      });
    }

    return {
      nodePoints: points,
      connections: conns,
      stats: {
        online: nodes.filter(n => n.status === 'online').length,
        total: nodes.length,
        connections: conns.length
      }
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Network Topology 3D</CardTitle>
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
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Network Topology 3D</CardTitle>
              <p className="text-sm text-muted-foreground">Interactive node network visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">{stats.online} online</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="h-4 w-4 text-xandeum-orange" />
              <span className="text-muted-foreground">{stats.connections} links</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[420px] bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]"
        >
          <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
            <NetworkVisualization nodePoints={nodePoints} connections={connections} />
          </Canvas>
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 py-4 border-t border-border/50 bg-background/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-xandeum-orange shadow-lg shadow-xandeum-orange/50" />
            <span className="text-xs text-muted-foreground">Degraded / Core</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <span className="text-xs text-muted-foreground">Offline</span>
          </div>
          <div className="text-xs text-muted-foreground border-l border-border pl-4">
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
