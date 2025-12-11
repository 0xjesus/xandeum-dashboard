'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html, Trail } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow, Zap, Database } from 'lucide-react';
import { PNode } from '@/types';
import * as THREE from 'three';

interface DataFlowVisualizationProps {
  nodes: PNode[];
  isLoading?: boolean;
}

// Data packet moving along a path
function DataPacket({
  startPos,
  endPos,
  color,
  delay,
  speed
}: {
  startPos: [number, number, number];
  endPos: [number, number, number];
  color: string;
  delay: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = ((state.clock.elapsedTime * speed + delay) % 1);
      meshRef.current.position.x = startPos[0] + (endPos[0] - startPos[0]) * t;
      meshRef.current.position.y = startPos[1] + (endPos[1] - startPos[1]) * t;
      meshRef.current.position.z = startPos[2] + (endPos[2] - startPos[2]) * t;

      // Pulse effect
      const scale = 0.8 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Trail
      width={0.5}
      length={6}
      color={color}
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
        />
      </mesh>
    </Trail>
  );
}

// Node in the network
function NetworkNode({
  position,
  color,
  size,
  label,
  isCore
}: {
  position: [number, number, number];
  color: string;
  size: number;
  label: string;
  isCore?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (isCore) {
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      }
      const targetScale = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group position={position}>
      {/* Glow effect */}
      <Sphere args={[size * 1.8, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </Sphere>

      {/* Main node */}
      <Sphere
        ref={meshRef}
        args={[size, isCore ? 32 : 16, isCore ? 32 : 16]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCore ? 1 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>

      {/* Label on hover */}
      {hovered && (
        <Html position={[0, size + 0.3, 0]} center>
          <div className="bg-black/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-white whitespace-nowrap">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function FlowVisualization({
  flowStats
}: {
  flowStats: {
    publicNodes: Array<{ pos: [number, number, number]; node: PNode }>;
    privateNodes: Array<{ pos: [number, number, number]; node: PNode }>;
    totalDataFlow: number;
  };
}) {
  // Create data packets from public nodes to center and back
  const packets = useMemo(() => {
    const result: Array<{
      start: [number, number, number];
      end: [number, number, number];
      color: string;
      delay: number;
      speed: number;
    }> = [];

    // Data flowing from public nodes to center
    flowStats.publicNodes.slice(0, 10).forEach((n, i) => {
      result.push({
        start: n.pos,
        end: [0, 0, 0],
        color: '#22c55e',
        delay: i * 0.15,
        speed: 0.3
      });
      // Return flow
      result.push({
        start: [0, 0, 0],
        end: n.pos,
        color: '#3b82f6',
        delay: i * 0.15 + 0.5,
        speed: 0.25
      });
    });

    // Data flowing between private nodes
    flowStats.privateNodes.slice(0, 8).forEach((n, i) => {
      const nextIdx = (i + 1) % Math.min(flowStats.privateNodes.length, 8);
      result.push({
        start: n.pos,
        end: flowStats.privateNodes[nextIdx].pos,
        color: '#F3771F',
        delay: i * 0.2,
        speed: 0.2
      });
    });

    return result;
  }, [flowStats]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#F3771F" />

      {/* Central hub */}
      <NetworkNode
        position={[0, 0, 0]}
        color="#F3771F"
        size={0.4}
        label="Xandeum Network Core"
        isCore
      />

      {/* Connection lines */}
      {flowStats.publicNodes.map((n, i) => (
        <Line
          key={`pub-line-${i}`}
          points={[n.pos, [0, 0, 0]]}
          color="#22c55e"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}

      {flowStats.privateNodes.slice(0, 8).map((n, i) => {
        const nextIdx = (i + 1) % Math.min(flowStats.privateNodes.length, 8);
        return (
          <Line
            key={`priv-line-${i}`}
            points={[n.pos, flowStats.privateNodes[nextIdx].pos]}
            color="#F3771F"
            lineWidth={0.5}
            transparent
            opacity={0.15}
          />
        );
      })}

      {/* Public nodes */}
      {flowStats.publicNodes.map((n, i) => (
        <NetworkNode
          key={`pub-${i}`}
          position={n.pos}
          color="#22c55e"
          size={0.15}
          label={`Public: ${n.node.ip}`}
        />
      ))}

      {/* Private nodes */}
      {flowStats.privateNodes.slice(0, 15).map((n, i) => (
        <NetworkNode
          key={`priv-${i}`}
          position={n.pos}
          color="#6366f1"
          size={0.12}
          label={`Private: ${n.node.ip}`}
        />
      ))}

      {/* Data packets */}
      {packets.map((p, i) => (
        <DataPacket
          key={`packet-${i}`}
          startPos={p.start}
          endPos={p.end}
          color={p.color}
          delay={p.delay}
          speed={p.speed}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.2}
        maxDistance={15}
        minDistance={5}
      />
    </>
  );
}

export function DataFlowVisualization({ nodes, isLoading }: DataFlowVisualizationProps) {
  const flowStats = useMemo(() => {
    const publicNodes = nodes.filter(n => n.is_public);
    const privateNodes = nodes.filter(n => !n.is_public);

    // Distribute public nodes in a ring
    const publicPositions = publicNodes.slice(0, 15).map((node, i) => {
      const angle = (i / Math.min(publicNodes.length, 15)) * Math.PI * 2;
      const radius = 3;
      return {
        pos: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 1.5,
          Math.sin(angle) * radius
        ] as [number, number, number],
        node
      };
    });

    // Distribute private nodes in outer ring
    const privatePositions = privateNodes.slice(0, 20).map((node, i) => {
      const angle = (i / Math.min(privateNodes.length, 20)) * Math.PI * 2;
      const radius = 4.5;
      return {
        pos: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * radius
        ] as [number, number, number],
        node
      };
    });

    return {
      publicNodes: publicPositions,
      privateNodes: privatePositions,
      totalDataFlow: nodes.reduce((a, b) => a + b.storage_used, 0)
    };
  }, [nodes]);

  const stats = useMemo(() => ({
    publicCount: nodes.filter(n => n.is_public).length,
    privateCount: nodes.filter(n => !n.is_public).length,
    onlineCount: nodes.filter(n => n.status === 'online').length,
    totalStorage: nodes.reduce((a, b) => a + b.storage_committed, 0)
  }), [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Real-time Data Flow</CardTitle>
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Real-time Data Flow</CardTitle>
              <p className="text-sm text-muted-foreground">Network communication visualization</p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Zap className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[380px] bg-gradient-to-b from-[#050510] to-[#0a0a1a]"
        >
          <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
            <FlowVisualization flowStats={flowStats} />
          </Canvas>
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 py-4 border-t border-border/50 bg-background/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
            <span className="text-xs text-muted-foreground">Public ({stats.publicCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
            <span className="text-xs text-muted-foreground">Private ({stats.privateCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-xandeum-orange shadow-lg shadow-xandeum-orange/50" />
            <span className="text-xs text-muted-foreground">Core Hub</span>
          </div>
          <div className="text-xs text-muted-foreground border-l border-border pl-4">
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
