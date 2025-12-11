'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Trail, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Heart, TrendingUp } from 'lucide-react';
import { PNode } from '@/types';
import * as THREE from 'three';

interface FibonacciHealth3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

// Golden ratio constant
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLDEN_ANGLE = Math.PI * 2 / (PHI * PHI);

function FibonacciPoint({
  index,
  total,
  healthScore,
  status,
  delay
}: {
  index: number;
  total: number;
  healthScore: number;
  status: string;
  delay: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Fibonacci spiral positioning
  const theta = index * GOLDEN_ANGLE;
  const radius = Math.sqrt(index / total) * 4;
  const height = (healthScore / 100) * 2 - 1; // -1 to 1 based on health

  const x = Math.cos(theta) * radius;
  const z = Math.sin(theta) * radius;

  const color = status === 'online' ? '#22c55e' :
                status === 'degraded' ? '#F3771F' : '#ef4444';

  const size = 0.08 + (healthScore / 100) * 0.12;

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = height + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1;
      // Pulse based on health
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + delay) * 0.1 * (healthScore / 100);
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <Trail
      width={0.3}
      length={4}
      color={color}
      attenuation={(t) => t * t * (healthScore / 100)}
    >
      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <Sphere ref={meshRef} args={[size, 16, 16]} position={[x, height, z]}>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </Sphere>
      </Float>
    </Trail>
  );
}

function GoldenSpiral() {
  const points: THREE.Vector3[] = [];
  const spiralTurns = 4;
  const pointsPerTurn = 100;

  for (let i = 0; i < spiralTurns * pointsPerTurn; i++) {
    const t = i / pointsPerTurn;
    const theta = t * Math.PI * 2;
    const radius = 0.2 * Math.pow(PHI, t / 2);

    points.push(new THREE.Vector3(
      Math.cos(theta) * radius,
      0,
      Math.sin(theta) * radius
    ));
  }

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#F3771F" transparent opacity={0.3} />
    </line>
  );
}

function CentralFlower({ healthAvg }: { healthAvg: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const petalCount = 8;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central core */}
      <Sphere args={[0.3, 32, 32]}>
        <meshStandardMaterial
          color="#F3771F"
          emissive="#F3771F"
          emissiveIntensity={1}
          metalness={0.9}
          roughness={0.1}
        />
      </Sphere>

      {/* Petals arranged by golden angle */}
      {Array.from({ length: petalCount }).map((_, i) => {
        const angle = i * GOLDEN_ANGLE;
        const petalRadius = 0.6;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * petalRadius,
              0,
              Math.sin(angle) * petalRadius
            ]}
            rotation={[0, -angle, Math.PI / 4]}
          >
            <coneGeometry args={[0.15, 0.4, 8]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#14857C' : '#F3771F'}
              emissive={i % 2 === 0 ? '#14857C' : '#F3771F'}
              emissiveIntensity={0.4}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        );
      })}

      {/* Health indicator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.03, 16, 64, (healthAvg / 100) * Math.PI * 2]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

function FibonacciVisualization({ nodeData, avgHealth }: {
  nodeData: Array<{ healthScore: number; status: string }>;
  avgHealth: number;
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
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#22c55e" />

      <group ref={groupRef}>
        {/* Golden spiral base */}
        <GoldenSpiral />

        {/* Central golden flower */}
        <CentralFlower healthAvg={avgHealth} />

        {/* Fibonacci-positioned nodes */}
        {nodeData.map((node, i) => (
          <FibonacciPoint
            key={i}
            index={i + 1}
            total={nodeData.length}
            healthScore={node.healthScore}
            status={node.status}
            delay={i * 0.1}
          />
        ))}
      </group>

      {/* Floor reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#0a0a0f"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.5}
        />
      </mesh>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxDistance={15}
        minDistance={5}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export function FibonacciHealth3D({ nodes, isLoading }: FibonacciHealth3DProps) {
  const { nodeData, stats } = useMemo(() => {
    const sortedNodes = [...nodes]
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 60);

    const avgHealth = nodes.length > 0
      ? nodes.reduce((a, b) => a + b.healthScore, 0) / nodes.length
      : 0;

    const excellent = nodes.filter(n => n.healthScore >= 90).length;
    const good = nodes.filter(n => n.healthScore >= 70 && n.healthScore < 90).length;
    const poor = nodes.filter(n => n.healthScore < 70).length;

    return {
      nodeData: sortedNodes.map(n => ({
        healthScore: n.healthScore,
        status: n.status
      })),
      stats: {
        avgHealth,
        excellent,
        good,
        poor
      }
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Fibonacci Health Spiral</CardTitle>
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Fibonacci Health Spiral</CardTitle>
              <p className="text-sm text-muted-foreground">Golden ratio distribution of node health</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20">
            <Heart className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">{stats.avgHealth.toFixed(0)}% avg</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[400px] bg-gradient-to-b from-[#030308] to-[#0a0a15]"
        >
          <Canvas camera={{ position: [0, 6, 8], fov: 50 }}>
            <FibonacciVisualization nodeData={nodeData} avgHealth={stats.avgHealth} />
          </Canvas>
        </motion.div>

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4 p-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Excellent (90+)</span>
            </div>
            <p className="text-xl font-bold text-green-400">{stats.excellent}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-xandeum-orange" />
              <span className="text-xs text-muted-foreground">Good (70-89)</span>
            </div>
            <p className="text-xl font-bold text-xandeum-orange">{stats.good}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Needs Work (&lt;70)</span>
            </div>
            <p className="text-xl font-bold text-red-400">{stats.poor}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
