'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Sphere, Line, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Network } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StorageBarChart3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

interface NodeSphere {
  node: PNode;
  position: [number, number, number];
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
}

// Central hub representing the network
function CentralHub() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Inner core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.5, 2]} />
        <meshStandardMaterial
          color="#F3771F"
          emissive="#F3771F"
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.2}
          wireframe
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial
          color="#F3771F"
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.02, 16, 100]} />
        <meshStandardMaterial color="#5D2554" emissive="#5D2554" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.1, 0.015, 16, 100]} />
        <meshStandardMaterial color="#1C3850" emissive="#1C3850" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Orbiting node sphere
function NodeSphere3D({
  nodeData,
  onHover,
  isHovered
}: {
  nodeData: NodeSphere;
  onHover: (node: PNode | null) => void;
  isHovered: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Orbit around center
      const angle = state.clock.elapsedTime * nodeData.orbitSpeed + nodeData.orbitOffset;
      groupRef.current.position.x = Math.cos(angle) * nodeData.orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * nodeData.orbitRadius;
      groupRef.current.position.y = Math.sin(angle * 2) * 0.3;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      // Pulse effect
      const pulse = isHovered ? 1.3 : 1 + Math.sin(state.clock.elapsedTime * 3 + nodeData.orbitOffset) * 0.1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh
          ref={meshRef}
          onPointerEnter={() => onHover(nodeData.node)}
          onPointerLeave={() => onHover(null)}
        >
          <sphereGeometry args={[nodeData.size, 16, 16]} />
          <meshStandardMaterial
            color={nodeData.color}
            emissive={nodeData.color}
            emissiveIntensity={isHovered ? 1 : 0.4}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      </Float>


      {/* Tooltip */}
      {isHovered && (
        <Html center distanceFactor={8}>
          <div className="bg-black/95 backdrop-blur-md rounded-lg px-3 py-2 text-xs whitespace-nowrap border border-white/10 shadow-xl pointer-events-none">
            <p className="font-mono text-white font-medium mb-1">{nodeData.node.pubkey.slice(0, 12)}...</p>
            <p className="text-xandeum-orange font-bold">{formatBytes(nodeData.node.storage_committed)}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${nodeData.node.status === 'online' ? 'bg-green-500' : nodeData.node.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <span className="text-white/60 capitalize">{nodeData.node.status}</span>
              <span className="text-white/60">|</span>
              <span className="text-white">{nodeData.node.healthScore}%</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Orbit rings
function OrbitRings() {
  return (
    <>
      {[2, 2.8, 3.6, 4.4].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.005, 16, 100]} />
          <meshBasicMaterial color="#1C3850" transparent opacity={0.3} />
        </mesh>
      ))}
    </>
  );
}

// Stats display
function StatsPanel({ nodes }: { nodes: PNode[] }) {
  const totalStorage = nodes.reduce((acc, n) => acc + n.storage_committed, 0);
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const avgHealth = nodes.reduce((acc, n) => acc + n.healthScore, 0) / nodes.length;

  return (
    <Html position={[-4.5, 2.5, 0]}>
      <div className="bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 min-w-[150px]">
        <p className="text-xs text-white/60 mb-2 font-semibold">Network Stats</p>
        <div className="space-y-2">
          <div>
            <p className="text-lg font-bold text-xandeum-orange">{formatBytes(totalStorage)}</p>
            <p className="text-[10px] text-white/50">Total Storage</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-500">{onlineCount}/{nodes.length}</p>
            <p className="text-[10px] text-white/50">Online Nodes</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{avgHealth.toFixed(1)}%</p>
            <p className="text-[10px] text-white/50">Avg Health</p>
          </div>
        </div>
      </div>
    </Html>
  );
}

function Scene({ nodes }: { nodes: PNode[] }) {
  const [hoveredNode, setHoveredNode] = useState<PNode | null>(null);

  const nodeSpheres = useMemo((): NodeSphere[] => {
    const topNodes = [...nodes]
      .sort((a, b) => b.storage_committed - a.storage_committed)
      .slice(0, 30);

    const maxStorage = Math.max(...topNodes.map(n => n.storage_committed), 1);

    return topNodes.map((node, i) => {
      // Distribute nodes across orbit rings based on storage
      const storageRatio = node.storage_committed / maxStorage;
      const ringIndex = Math.floor((1 - storageRatio) * 3); // Higher storage = closer to center
      const orbitRadius = 2 + ringIndex * 0.8;

      const color = node.status === 'online'
        ? '#22c55e'
        : node.status === 'degraded'
          ? '#F3771F'
          : '#ef4444';

      return {
        node,
        position: [0, 0, 0] as [number, number, number],
        size: 0.1 + storageRatio * 0.2,
        color,
        orbitRadius,
        orbitSpeed: 0.2 + (1 - storageRatio) * 0.3,
        orbitOffset: (i / topNodes.length) * Math.PI * 2,
      };
    });
  }, [nodes]);

  return (
    <>
      <CentralHub />
      <OrbitRings />

      {nodeSpheres.map((sphere, i) => (
        <NodeSphere3D
          key={sphere.node.pubkey}
          nodeData={sphere}
          onHover={setHoveredNode}
          isHovered={hoveredNode?.pubkey === sphere.node.pubkey}
        />
      ))}

      <StatsPanel nodes={nodes} />
      <Stars radius={50} depth={30} count={2000} factor={4} fade speed={0.5} />
    </>
  );
}

export function StorageBarChart3D({ nodes, isLoading }: StorageBarChart3DProps) {
  if (isLoading || nodes.length === 0) {
    return (
      <Card className="h-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Topology 3D
          </CardTitle>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="h-5 w-5 text-xandeum-orange" />
            Network Topology 3D
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px] text-sm">
              <p>3D visualization of network topology. Node size represents storage capacity. Orbit distance shows relative storage ranking. The central hub represents the Xandeum network core.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[350px] bg-gradient-to-b from-slate-900 via-xandeum-dark to-slate-950">
          <Canvas
            camera={{ position: [0, 5, 8], fov: 50 }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} intensity={0.4} color="#5D2554" />
            <pointLight position={[0, 0, 0]} intensity={1} color="#F3771F" />

            <Suspense fallback={null}>
              <Scene nodes={nodes} />
            </Suspense>

            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={5}
              maxDistance={15}
              minPolarAngle={0.5}
              maxPolarAngle={Math.PI / 2}
              autoRotate
              autoRotateSpeed={0.3}
            />
          </Canvas>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-3 border-t border-border bg-background/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-xandeum-orange" />
            <span className="text-xs text-muted-foreground">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Offline</span>
          </div>
          <div className="text-xs text-muted-foreground border-l border-border pl-4">
            Size = Storage capacity
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StorageBarChart3D;
