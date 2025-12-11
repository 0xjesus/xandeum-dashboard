'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Tube, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna, GitBranch, CheckCircle2 } from 'lucide-react';
import { PNode } from '@/types';
import * as THREE from 'three';

interface VersionHelix3DProps {
  nodes: PNode[];
  isLoading?: boolean;
}

// Create a helix curve for the tube
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  height: number;
  turns: number;

  constructor(radius = 1, height = 5, turns = 3) {
    super();
    this.radius = radius;
    this.height = height;
    this.turns = turns;
  }

  getPoint(t: number): THREE.Vector3 {
    const angle = t * Math.PI * 2 * this.turns;
    const x = Math.cos(angle) * this.radius;
    const y = t * this.height - this.height / 2;
    const z = Math.sin(angle) * this.radius;
    return new THREE.Vector3(x, y, z);
  }
}

function HelixStrand({ offset, color }: { offset: number; color: string }) {
  const curve = new HelixCurve(1.2, 6, 2);
  const ref = useRef<THREE.Mesh>(null);

  // Offset the curve
  const offsetCurve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const point = curve.getPoint(t);
      const angle = t * Math.PI * 2 * 2 + offset;
      point.x = Math.cos(angle) * 1.2;
      point.z = Math.sin(angle) * 1.2;
      points.push(point);
    }
    return new THREE.CatmullRomCurve3(points);
  }, [offset]);

  return (
    <Tube args={[offsetCurve, 100, 0.08, 8, false]} ref={ref}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.7}
        roughness={0.3}
      />
    </Tube>
  );
}

function VersionNode({
  position,
  version,
  count,
  maxCount,
  color
}: {
  position: [number, number, number];
  version: string;
  count: number;
  maxCount: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const size = 0.15 + (count / maxCount) * 0.25;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + position[1]) * 0.1);
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[size, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      <Text
        position={[0.4, 0, 0]}
        fontSize={0.15}
        color="white"
        anchorX="left"
      >
        v{version}
      </Text>
      <Text
        position={[0.4, -0.2, 0]}
        fontSize={0.1}
        color={color}
        anchorX="left"
      >
        {count} nodes
      </Text>
    </group>
  );
}

function ConnectorBar({
  start,
  end,
  color
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const midPoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ];

  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) +
    Math.pow(end[1] - start[1], 2) +
    Math.pow(end[2] - start[2], 2)
  );

  const direction = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ).normalize();

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  return (
    <mesh position={midPoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.03, 0.03, length, 8]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function HelixVisualization({ versionData }: {
  versionData: Array<{ version: string; count: number; isLatest: boolean }>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const maxCount = Math.max(...versionData.map(v => v.count), 1);
  const heightRange = 5;

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F3771F" />

      <group ref={groupRef}>
        {/* Double helix strands */}
        <HelixStrand offset={0} color="#14857C" />
        <HelixStrand offset={Math.PI} color="#F3771F" />

        {/* Version nodes along the helix */}
        {versionData.map((v, i) => {
          const t = i / (versionData.length - 1 || 1);
          const y = t * heightRange - heightRange / 2;
          const angle = t * Math.PI * 2 * 2; // 2 full turns

          // Position on first strand
          const x1 = Math.cos(angle) * 1.2;
          const z1 = Math.sin(angle) * 1.2;

          // Position on second strand (opposite)
          const x2 = Math.cos(angle + Math.PI) * 1.2;
          const z2 = Math.sin(angle + Math.PI) * 1.2;

          const color = v.isLatest ? '#22c55e' : '#6366f1';

          return (
            <group key={v.version}>
              {/* Connector bar between strands */}
              <ConnectorBar
                start={[x1, y, z1]}
                end={[x2, y, z2]}
                color={color}
              />

              {/* Version node */}
              <VersionNode
                position={[0, y, 0]}
                version={v.version}
                count={v.count}
                maxCount={maxCount}
                color={color}
              />
            </group>
          );
        })}
      </group>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxDistance={12}
        minDistance={4}
      />
    </>
  );
}

export function VersionHelix3D({ nodes, isLoading }: VersionHelix3DProps) {
  const { versionData, stats } = useMemo(() => {
    const versionMap = new Map<string, number>();
    nodes.forEach(node => {
      const count = versionMap.get(node.version) || 0;
      versionMap.set(node.version, count + 1);
    });

    const versions = Array.from(versionMap.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => {
        // Sort by semantic versioning
        const aParts = a.version.split('.').map(Number);
        const bParts = b.version.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if ((bParts[i] || 0) !== (aParts[i] || 0)) {
            return (bParts[i] || 0) - (aParts[i] || 0);
          }
        }
        return 0;
      });

    const latestVersion = versions[0]?.version || '';

    return {
      versionData: versions.map(v => ({
        ...v,
        isLatest: v.version === latestVersion
      })),
      stats: {
        latestVersion,
        latestCount: versions[0]?.count || 0,
        totalVersions: versions.length,
        complianceRate: nodes.length > 0
          ? ((versions[0]?.count || 0) / nodes.length) * 100
          : 0
      }
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg">Version DNA Helix</CardTitle>
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30">
              <Dna className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Version DNA Helix</CardTitle>
              <p className="text-sm text-muted-foreground">Software evolution visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">v{stats.latestVersion}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[400px] bg-gradient-to-b from-[#030308] to-[#0a0a15]"
        >
          <Canvas camera={{ position: [4, 0, 4], fov: 50 }}>
            <HelixVisualization versionData={versionData} />
          </Canvas>
        </motion.div>

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4 p-4 border-t border-border/50 bg-background/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <GitBranch className="h-3 w-3 text-green-400" />
              <span className="text-xs text-muted-foreground">On Latest</span>
            </div>
            <p className="text-xl font-bold text-green-400">{stats.latestCount}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Dna className="h-3 w-3 text-indigo-400" />
              <span className="text-xs text-muted-foreground">Versions</span>
            </div>
            <p className="text-xl font-bold text-indigo-400">{stats.totalVersions}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-xandeum-orange" />
              <span className="text-xs text-muted-foreground">Compliance</span>
            </div>
            <p className="text-xl font-bold text-xandeum-orange">{stats.complianceRate.toFixed(0)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
