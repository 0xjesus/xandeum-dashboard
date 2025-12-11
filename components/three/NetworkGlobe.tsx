'use client';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PNode } from '@/types';

// Dynamically import react-globe.gl to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-xandeum-dark to-slate-900 rounded-2xl">
      <div className="text-muted-foreground animate-pulse">Loading globe...</div>
    </div>
  ),
});

interface NetworkGlobeProps {
  nodes: PNode[];
  className?: string;
  size?: 'normal' | 'large' | 'hero';
  showLegend?: boolean;
  showStats?: boolean;
}

interface GeoFeature {
  type: string;
  properties: {
    NAME?: string;
    ADMIN?: string;
    ISO_A2?: string;
    POP_EST?: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoData {
  type: string;
  features: GeoFeature[];
}

// IP to coordinates mapping
function ipToCoordinates(ip: string): { lat: number; lng: number; country: string } {
  const parts = ip.split('.').map(Number);
  const firstOctet = parts[0];
  const secondOctet = parts[1];
  const thirdOctet = parts[2];

  // North America (USA)
  if (firstOctet >= 3 && firstOctet <= 56) {
    return {
      lat: 30 + (secondOctet / 255) * 18 + (Math.random() - 0.5) * 5,
      lng: -120 + (thirdOctet / 255) * 50 + (Math.random() - 0.5) * 10,
      country: 'United States'
    };
  }
  // Canada
  if (firstOctet >= 57 && firstOctet <= 76) {
    return {
      lat: 45 + (secondOctet / 255) * 15 + (Math.random() - 0.5) * 5,
      lng: -100 + (thirdOctet / 255) * 40 + (Math.random() - 0.5) * 10,
      country: 'Canada'
    };
  }
  // Europe
  if (firstOctet >= 77 && firstOctet <= 95) {
    return {
      lat: 45 + (secondOctet / 255) * 15 + (Math.random() - 0.5) * 5,
      lng: 0 + (thirdOctet / 255) * 30 + (Math.random() - 0.5) * 10,
      country: 'Europe'
    };
  }
  // Asia Pacific
  if (firstOctet >= 96 && firstOctet <= 126) {
    return {
      lat: 20 + (secondOctet / 255) * 30 + (Math.random() - 0.5) * 5,
      lng: 100 + (thirdOctet / 255) * 40 + (Math.random() - 0.5) * 10,
      country: 'Asia'
    };
  }
  // Japan/Korea
  if (firstOctet >= 128 && firstOctet <= 144) {
    return {
      lat: 33 + (secondOctet / 255) * 10 + (Math.random() - 0.5) * 3,
      lng: 130 + (thirdOctet / 255) * 15 + (Math.random() - 0.5) * 5,
      country: 'Japan'
    };
  }
  // Europe (secondary range)
  if (firstOctet >= 145 && firstOctet <= 176) {
    return {
      lat: 48 + (secondOctet / 255) * 15 + (Math.random() - 0.5) * 5,
      lng: 5 + (thirdOctet / 255) * 25 + (Math.random() - 0.5) * 10,
      country: 'Europe'
    };
  }
  // South America
  if (firstOctet >= 177 && firstOctet <= 191) {
    return {
      lat: -25 + (secondOctet / 255) * 20 + (Math.random() - 0.5) * 5,
      lng: -55 + (thirdOctet / 255) * 25 + (Math.random() - 0.5) * 10,
      country: 'Brazil'
    };
  }
  // Australia/Oceania
  if (firstOctet >= 192 && firstOctet <= 210) {
    return {
      lat: -28 + (secondOctet / 255) * 15 + (Math.random() - 0.5) * 5,
      lng: 135 + (thirdOctet / 255) * 20 + (Math.random() - 0.5) * 10,
      country: 'Australia'
    };
  }

  // Default global distribution
  const hash = (parts[0] * 7 + parts[1] * 13 + parts[2] * 17) % 6;
  const regions = [
    { lat: 40, lng: -100, country: 'United States' },
    { lat: 50, lng: 10, country: 'Germany' },
    { lat: 35, lng: 139, country: 'Japan' },
    { lat: -25, lng: 135, country: 'Australia' },
    { lat: 30, lng: 120, country: 'China' },
    { lat: -15, lng: -55, country: 'Brazil' },
  ];
  const base = regions[hash];
  return {
    lat: base.lat + (secondOctet / 255 - 0.5) * 15,
    lng: base.lng + (thirdOctet / 255 - 0.5) * 20,
    country: base.country
  };
}

export function NetworkGlobe({ nodes, className, size = 'normal', showLegend = true, showStats = true }: NetworkGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<GeoData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle responsive sizing based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use the smaller of width/height to ensure globe fits and is centered
        const containerWidth = rect.width || window.innerWidth;
        const containerHeight = rect.height || window.innerHeight * 0.7;

        // Make both dimensions equal to the smaller one for perfect centering
        const minDim = Math.min(containerWidth, containerHeight);

        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    // Initial update with slight delay to ensure container is mounted
    const timer = setTimeout(updateDimensions, 100);

    // Use ResizeObserver for accurate container size tracking
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [size]);

  // Load GeoJSON countries data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then((data: GeoData) => setCountries(data))
      .catch(err => console.error('Failed to load countries:', err));
  }, []);

  // Configure globe when ready
  useEffect(() => {
    if (globeRef.current && globeReady) {
      const globe = globeRef.current;
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;
      globe.controls().enableZoom = true;
      // Closer view for hero size
      const altitude = size === 'hero' ? 1.8 : 2.5;
      globe.pointOfView({ lat: 20, lng: 0, altitude });
    }
  }, [globeReady, size]);

  // Prepare node points for the globe
  const nodePoints = useMemo(() => {
    return nodes.slice(0, 300).map(node => {
      const coords = ipToCoordinates(node.ip);
      return {
        lat: coords.lat,
        lng: coords.lng,
        size: 0.3 + (node.healthScore / 100) * 0.5,
        color: node.status === 'online' ? '#22c55e' : node.status === 'degraded' ? '#F3771F' : '#ef4444',
        node: node,
        country: coords.country,
      };
    });
  }, [nodes]);

  // Create arcs between nearby online nodes
  const arcsData = useMemo(() => {
    const onlineNodes = nodePoints.filter(n => n.node.status === 'online');
    const arcs: any[] = [];

    for (let i = 0; i < Math.min(onlineNodes.length, 40); i++) {
      for (let j = i + 1; j < Math.min(onlineNodes.length, 40); j++) {
        const n1 = onlineNodes[i];
        const n2 = onlineNodes[j];
        const distance = Math.sqrt(
          Math.pow(n1.lat - n2.lat, 2) + Math.pow(n1.lng - n2.lng, 2)
        );

        if (distance < 50 && distance > 10 && arcs.length < 60) {
          arcs.push({
            startLat: n1.lat,
            startLng: n1.lng,
            endLat: n2.lat,
            endLng: n2.lng,
            color: ['rgba(243, 119, 31, 0.6)', 'rgba(34, 197, 94, 0.6)'],
          });
        }
      }
    }
    return arcs;
  }, [nodePoints]);

  // Calculate stats
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const degradedCount = nodes.filter(n => n.status === 'degraded').length;
  const offlineCount = nodes.filter(n => n.status === 'offline').length;

  if (nodes.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-xandeum-dark to-slate-900 rounded-2xl`}>
        <div className="text-muted-foreground animate-pulse">Loading network...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
      <Globe
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl={size === 'hero' ? undefined : "//unpkg.com/three-globe/example/img/night-sky.png"}

        // Countries polygons
        polygonsData={countries?.features || []}
        polygonAltitude={0.01}
        polygonCapColor={() => 'rgba(28, 56, 80, 0.7)'}
        polygonSideColor={() => 'rgba(93, 37, 84, 0.3)'}
        polygonStrokeColor={() => '#4AAEFF'}
        polygonLabel={(d: any) => `
          <div class="bg-black/90 backdrop-blur-md rounded-lg px-3 py-2 text-xs border border-white/20">
            <b class="text-white">${d.properties?.ADMIN || d.properties?.NAME || 'Unknown'}</b>
          </div>
        `}

        // Node points
        pointsData={nodePoints}
        pointAltitude={0.02}
        pointRadius="size"
        pointColor="color"
        pointLabel={(d: any) => `
          <div class="bg-black/95 backdrop-blur-md rounded-xl px-4 py-3 text-xs shadow-2xl border border-xandeum-orange/40 min-w-[200px]">
            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
              <div class="w-3 h-3 rounded-full ${d.node.status === 'online' ? 'bg-green-500' : d.node.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}"></div>
              <span class="text-white font-semibold capitalize">${d.node.status}</span>
              <span class="ml-auto text-orange-400 font-bold">${d.node.healthScore}%</span>
            </div>
            <p class="font-mono text-white/90 text-sm mb-2">${d.node.pubkey.slice(0, 16)}...</p>
            <div class="space-y-1 text-white/70">
              <p>IP: <span class="text-white">${d.node.ip}</span></p>
              <p>Region: <span class="text-orange-400">${d.country}</span></p>
              <p>Storage: <span class="text-white">${d.node.storageCommittedFormatted}</span></p>
              <p>Version: <span class="text-green-400">v${d.node.version}</span></p>
            </div>
          </div>
        `}
        onPointHover={setHoveredNode}

        // Connection arcs
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={size === 'hero' ? 0.8 : 0.5}

        // Atmosphere - more prominent for hero size
        atmosphereColor="#F3771F"
        atmosphereAltitude={size === 'hero' ? 0.35 : 0.25}

        // Performance
        animateIn={true}
        width={dimensions.width}
        height={dimensions.height}
      />
      )}

      {/* Legend - conditionally rendered */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
          <p className="text-xs text-white/70 font-semibold mb-1">Node Status</p>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
            <span className="text-xs text-white">Online ({onlineCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
            <span className="text-xs text-white">Degraded ({degradedCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <span className="text-xs text-white">Offline ({offlineCount})</span>
          </div>
        </div>
      )}

      {/* Total nodes counter - conditionally rendered */}
      {showStats && (
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
          <p className="text-xs text-white/60 mb-1">Global Network</p>
          <p className="text-3xl font-bold text-white">{nodes.length}</p>
          <p className="text-xs text-xandeum-orange font-medium">pNodes worldwide</p>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
        <p className="text-[10px] text-white/50">Drag to rotate • Scroll to zoom • Hover for details</p>
      </div>
    </div>
  );
}

export default NetworkGlobe;
