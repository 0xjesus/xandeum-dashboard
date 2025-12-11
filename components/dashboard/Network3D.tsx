'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html, Stars, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Globe2, Users, Zap } from 'lucide-react';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';
import * as THREE from 'three';

interface Network3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

interface NodePoint {
  position: [number, number, number];
  color: string;
  size: number;
  node: PNode;
}

function AnimatedNode({ position, color, size, node, onHover }: {
  position: [number, number, number];
  color: string;
  size: number;
  node: PNode;
  onHover: (node: PNode | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = hovered ? 1.5 : 1 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2);
    }
  });

  return (
    <group position={position}>
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[size * 2.5, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.2 : 0.08} />
      </Sphere>
      {/* Core node */}
      <Sphere
        ref={meshRef}
        args={[size, 16, 16]}
        onPointerEnter={() => { setHovered(true); onHover(node); }}
        onPointerLeave={() => { setHovered(false); onHover(null); }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>

      {/* Public node indicator */}
      {node.is_public && (
        <Float speed={3} rotationIntensity={0} floatIntensity={0.5}>
          <mesh position={[0, size + 0.15, 0]}>
            <octahedronGeometry args={[0.06]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} />
          </mesh>
        </Float>
      )}
    </group>
  );
}

function ConnectionLine({ start, end, color, isPublic }: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  isPublic?: boolean;
}) {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <Line
      ref={ref}
      points={[start, end]}
      color={color}
      lineWidth={isPublic ? 1.5 : 0.5}
      transparent
      opacity={0.25}
    />
  );
}

function CentralHub() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.05, 16, 64]} />
        <meshStandardMaterial color="#F3771F" emissive="#F3771F" emissiveIntensity={0.5} metalness={0.9} />
      </mesh>

      {/* Inner sphere */}
      <Sphere args={[0.4, 32, 32]}>
        <meshStandardMaterial
          color="#F3771F"
          emissive="#F3771F"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Core glow */}
      <Sphere args={[0.6, 32, 32]}>
        <meshBasicMaterial color="#F3771F" transparent opacity={0.15} />
      </Sphere>
    </group>
  );
}

function NetworkVisualization({ nodePoints, connections, onHover }: {
  nodePoints: NodePoint[];
  connections: { start: [number, number, number]; end: [number, number, number]; color: string; isPublic?: boolean }[];
  onHover: (node: PNode | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#F3771F" />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#F3771F" />

      <Stars radius={50} depth={50} count={800} factor={4} saturation={0} fade speed={0.5} />

      <group ref={groupRef}>
        {/* Connections */}
        {connections.map((conn, i) => (
          <ConnectionLine key={i} start={conn.start} end={conn.end} color={conn.color} isPublic={conn.isPublic} />
        ))}

        {/* Nodes */}
        {nodePoints.map((np, i) => (
          <AnimatedNode
            key={i}
            position={np.position}
            color={np.color}
            size={np.size}
            node={np.node}
            onHover={onHover}
          />
        ))}

        {/* Central hub */}
        <CentralHub />
      </group>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate={false}
        maxDistance={18}
        minDistance={5}
      />
    </>
  );
}

export function Network3D({ nodes, isLoading }: Network3DProps) {
  const [hoveredNode, setHoveredNode] = useState<PNode | null>(null);

  const { nodePoints, connections, stats } = useMemo(() => {
    const points: NodePoint[] = [];
    const conns: { start: [number, number, number]; end: [number, number, number]; color: string; isPublic?: boolean }[] = [];

    // Sort by status and health to show best nodes first
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { online: 0, degraded: 1, offline: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.healthScore - a.healthScore;
    });

    const maxNodes = Math.min(sortedNodes.length, 80);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < maxNodes; i++) {
      const node = sortedNodes[i];
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / maxNodes);

      // Public nodes closer to center, private nodes outer ring
      const baseRadius = node.is_public ? 3.5 : 5;
      const healthBonus = (node.healthScore / 100) * 0.5;
      const radius = baseRadius + healthBonus;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const color = node.status === 'online' ? '#22c55e' :
                   node.status === 'degraded' ? '#F3771F' : '#ef4444';

      // Size based on storage committed
      const maxStorage = Math.max(...nodes.map(n => n.storage_committed), 1);
      const sizeRatio = Math.sqrt(node.storage_committed / maxStorage);
      const size = 0.08 + sizeRatio * 0.12;

      points.push({
        position: [x, y, z],
        color,
        size,
        node
      });
    }

    // Connect public nodes to center
    const publicPoints = points.filter(p => p.node.is_public);
    publicPoints.forEach(p => {
      conns.push({
        start: p.position,
        end: [0, 0, 0],
        color: '#22c55e',
        isPublic: true
      });
    });

    // Connect nearby online nodes
    const onlinePoints = points.filter(p => p.node.status === 'online');
    for (let i = 0; i < Math.min(onlinePoints.length, 25); i++) {
      for (let j = i + 1; j < Math.min(onlinePoints.length, 25); j++) {
        const p1 = onlinePoints[i];
        const p2 = onlinePoints[j];
        const dist = Math.sqrt(
          Math.pow(p1.position[0] - p2.position[0], 2) +
          Math.pow(p1.position[1] - p2.position[1], 2) +
          Math.pow(p1.position[2] - p2.position[2], 2)
        );

        if (dist < 3.5 && conns.length < 60) {
          conns.push({
            start: p1.position,
            end: p2.position,
            color: '#3b82f6'
          });
        }
      }
    }

    return {
      nodePoints: points,
      connections: conns,
      stats: {
        online: nodes.filter(n => n.status === 'online').length,
        public: nodes.filter(n => n.is_public).length,
        total: nodes.length,
        connections: conns.length
      }
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[550px]">
        <CardHeader>
          <CardTitle className="text-lg">Network Topology 3D</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[470px] animate-pulse bg-muted rounded-lg" />
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
              <p className="text-sm text-muted-foreground">Interactive pNode network visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">{stats.online} online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-green-400" />
              <span className="text-muted-foreground">{stats.public} public</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[450px] bg-gradient-to-b from-[#030308] to-[#080812]"
        >
          <Canvas camera={{ position: [0, 0, 12], fov: 55 }}>
            <NetworkVisualization
              nodePoints={nodePoints}
              connections={connections}
              onHover={setHoveredNode}
            />
          </Canvas>
        </motion.div>

        {/* Hovered node info */}
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 bg-black/90 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10 max-w-xs"
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
              {hoveredNode.is_public && (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">PUBLIC</span>
              )}
            </div>
            <p className="font-mono text-xs text-white/70 mb-2 truncate">
              {hoveredNode.pubkey.slice(0, 20)}...
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-white/50">IP:</span>
                <span className="text-white ml-1">{hoveredNode.ip}</span>
              </div>
              <div>
                <span className="text-white/50">Health:</span>
                <span className="text-green-400 ml-1">{hoveredNode.healthScore}%</span>
              </div>
              <div>
                <span className="text-white/50">Storage:</span>
                <span className="text-blue-400 ml-1">{formatBytes(hoveredNode.storage_committed)}</span>
              </div>
              <div>
                <span className="text-white/50">Version:</span>
                <span className="text-xandeum-orange ml-1">v{hoveredNode.version}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-4 border-t border-border/50 bg-background/50">
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
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <Users className="h-3 w-3 text-green-400" />
            <span className="text-xs text-muted-foreground">Public nodes closer to center</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
