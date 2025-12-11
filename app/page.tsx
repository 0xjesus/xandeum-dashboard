'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowRight, Server, Activity, Zap, RefreshCw, Globe2, ChevronDown, FileJson, FileSpreadsheet, TableIcon, MapPin, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroStats } from '@/components/dashboard/HeroStats';
import { VersionDistribution } from '@/components/dashboard/VersionDistribution';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { TopNodes } from '@/components/dashboard/TopNodes';
import { NetworkMap } from '@/components/dashboard/NetworkMap';
import { BubbleChart } from '@/components/dashboard/BubbleChart';
import { LiveActivity } from '@/components/dashboard/LiveActivity';
import { PerformanceGauge } from '@/components/dashboard/PerformanceGauge';
import { StorageChart } from '@/components/dashboard/StorageChart';
import { RegionalDistribution } from '@/components/dashboard/RegionalDistribution';
import { NetworkHealthChart } from '@/components/dashboard/NetworkHealthChart';
import { StorageTreemap } from '@/components/dashboard/StorageTreemap';
import { HealthDistribution } from '@/components/dashboard/HealthDistribution';
import { UptimeLeaderboard } from '@/components/dashboard/UptimeLeaderboard';
import { NetworkPulse } from '@/components/dashboard/NetworkPulse';
import { NodeTimeline } from '@/components/dashboard/NodeTimeline';
import { VersionCompliance } from '@/components/dashboard/VersionCompliance';
import { OperatorTools } from '@/components/dashboard/OperatorTools';
import { CityMap } from '@/components/dashboard/CityMap';
import { ErrorState } from '@/components/common/ErrorState';
import { InfoTooltip } from '@/components/common/MetricTooltip';
import { NodeTable } from '@/components/nodes/NodeTable';
import { QuickCompare } from '@/components/dashboard/QuickCompare';
import { useStats, useNodes } from '@/hooks/useNodes';

// Dynamically import 3D components
const StorageCapacity3D = dynamic(
  () => import('@/components/dashboard/StorageCapacity3D').then((mod) => mod.StorageCapacity3D),
  { ssr: false, loading: () => <div className="h-[500px] animate-pulse bg-muted rounded-lg" /> }
);

const DataFlowVisualization = dynamic(
  () => import('@/components/dashboard/DataFlowVisualization').then((mod) => mod.DataFlowVisualization),
  { ssr: false, loading: () => <div className="h-[500px] animate-pulse bg-muted rounded-lg" /> }
);

const UptimeDistribution3D = dynamic(
  () => import('@/components/dashboard/UptimeDistribution3D').then((mod) => mod.UptimeDistribution3D),
  { ssr: false, loading: () => <div className="h-[450px] animate-pulse bg-muted rounded-lg" /> }
);

const Network3D = dynamic(
  () => import('@/components/dashboard/Network3D').then((mod) => mod.Network3D),
  { ssr: false, loading: () => <div className="h-[550px] animate-pulse bg-muted rounded-lg" /> }
);

const FibonacciHealth3D = dynamic(
  () => import('@/components/dashboard/FibonacciHealth3D').then((mod) => mod.FibonacciHealth3D),
  { ssr: false, loading: () => <div className="h-[500px] animate-pulse bg-muted rounded-lg" /> }
);

const ParticleGalaxy3D = dynamic(
  () => import('@/components/dashboard/ParticleGalaxy3D').then((mod) => mod.ParticleGalaxy3D),
  { ssr: false, loading: () => <div className="h-[500px] animate-pulse bg-muted rounded-lg" /> }
);

const VersionHelix3D = dynamic(
  () => import('@/components/dashboard/VersionHelix3D').then((mod) => mod.VersionHelix3D),
  { ssr: false, loading: () => <div className="h-[500px] animate-pulse bg-muted rounded-lg" /> }
);

// Dynamically import 3D components to avoid SSR issues
const NetworkGlobe = dynamic(
  () => import('@/components/three/NetworkGlobe').then((mod) => mod.NetworkGlobe),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse bg-gradient-to-br from-xandeum-dark to-slate-900 rounded-lg" /> }
);


export default function DashboardPage() {
  const { data: statsData, error: statsError, isLoading: statsLoading, mutate: mutateStats } = useStats();
  const { data: nodesData, error: nodesError, isLoading: nodesLoading, mutate: mutateNodes } = useNodes();
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const isLoading = statsLoading || nodesLoading;
  const error = statsError || nodesError;

  const handleRefresh = () => {
    mutateStats();
    mutateNodes();
  };

  const exportToJSON = () => {
    if (!nodesData?.nodes) return;
    const dataStr = JSON.stringify(nodesData.nodes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-pnodes-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!nodesData?.nodes) return;
    const headers = ['pubkey', 'ip', 'status', 'healthScore', 'uptime', 'version', 'storage_committed', 'storage_used', 'is_public'];
    const rows = nodesData.nodes.map(n => [
      n.pubkey, n.ip, n.status, n.healthScore, n.uptime, n.version, n.storage_committed, n.storage_used, n.is_public
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-pnodes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="container py-8">
        <ErrorState
          title="Failed to load dashboard"
          message="Could not connect to pRPC endpoint. Please check your configuration."
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  const onlineNodes = nodesData?.nodes?.filter(n => n.status === 'online').length || 0;
  const totalNodes = nodesData?.nodes?.length || 0;

  return (
    <div className="min-h-screen">
      {/* FULLSCREEN MAP MODAL */}
      {isMapModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={() => setIsMapModalOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setIsMapModalOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
            {nodesData?.nodes && nodesData.nodes.length > 0 && (
              <NetworkGlobe
                nodes={nodesData.nodes}
                className="w-full h-full"
                size="hero"
                showLegend={true}
                showStats={true}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* HERO SECTION - Two columns layout */}
      <section className="relative min-h-[80vh] lg:min-h-[90vh] overflow-hidden py-8 lg:py-12">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-xandeum-dark via-[#050a1a] to-background" />

        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-10 w-[400px] h-[400px] bg-xandeum-orange/10 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-xandeum-purple/20 rounded-full blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="container relative z-10 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[70vh] lg:min-h-[80vh]">
            {/* LEFT COLUMN - Title, description, buttons, stats */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center"
            >
              {/* Branding */}
              <div className="flex items-center gap-3 mb-6">
                <Image src="/favicon.png" alt="Xandeum" width={48} height={48} className="drop-shadow-lg" />
                <motion.div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">LIVE</span>
                </motion.div>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                <span className="text-white">Xandeum</span>{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-xandeum-orange via-orange-400 to-yellow-500">
                  pNodes
                </span>
              </h1>

              <p className="text-lg text-white/60 mb-8 max-w-lg">
                Global decentralized storage network powering the future of Web3
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Link href="/nodes">
                  <Button size="lg" className="bg-gradient-to-r from-xandeum-orange to-orange-500 hover:from-xandeum-orange/90 hover:to-orange-500/90 shadow-lg shadow-xandeum-orange/25 text-white font-semibold">
                    <Server className="mr-2 h-5 w-5" />
                    Explore All Nodes
                  </Button>
                </Link>
                <Link href="/compare">
                  <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/10 text-white">
                    Compare Nodes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-6 lg:gap-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm w-fit">
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-white">{totalNodes}</p>
                  <p className="text-xs lg:text-sm text-white/50">Total Nodes</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-green-500">{onlineNodes}</p>
                  <p className="text-xs lg:text-sm text-white/50">Online</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-xandeum-orange">
                    {totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0}%
                  </p>
                  <p className="text-xs lg:text-sm text-white/50">Uptime</p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN - Map */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <div className="relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-sm shadow-2xl shadow-black/50">
                {/* Globe */}
                <div className="absolute inset-0">
                  {nodesData?.nodes && nodesData.nodes.length > 0 ? (
                    <NetworkGlobe
                      nodes={nodesData.nodes}
                      className="w-full h-full"
                      size="large"
                      showLegend={false}
                      showStats={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Globe2 className="h-20 w-20 text-xandeum-orange/30 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Expand button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 h-9 px-3 rounded-lg bg-black/50 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-sm border border-white/10"
                  onClick={() => setIsMapModalOpen(true)}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Expand
                </Button>

                {/* Label */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                  <MapPin className="h-3.5 w-3.5 text-xandeum-orange" />
                  <span className="text-sm text-white/80">Global Network</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator - Mobile centered, Desktop bottom-center */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:bottom-8"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="h-8 w-8 text-white/30" />
          </motion.div>
        </div>
      </section>

      {/* NODE TABLE - Primary Feature after Hero */}
      <section className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-xandeum-orange to-orange-600 shadow-lg shadow-xandeum-orange/30">
                    <TableIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      All pNodes
                      <InfoTooltip term="pnodes" />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select nodes to compare performance metrics
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportToJSON} disabled={!nodesData?.nodes}>
                    <FileJson className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!nodesData?.nodes}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Compare - Shows when 2+ nodes selected */}
              {compareSelection.length >= 2 && (
                <QuickCompare
                  selectedPubkeys={compareSelection}
                  nodes={nodesData?.nodes || []}
                  onClear={() => setCompareSelection([])}
                  onRemove={(pubkey) => setCompareSelection(prev => prev.filter(p => p !== pubkey))}
                />
              )}

              <NodeTable
                nodes={nodesData?.nodes || []}
                showSearch={true}
                showPagination={true}
                showCompare={true}
                pageSize={15}
                selectedForCompare={compareSelection}
                onCompareSelectionChange={setCompareSelection}
              />
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="container py-12 space-y-8">
        {/* Hero Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HeroStats stats={statsData?.network || null} isLoading={isLoading} />
        </motion.section>

        {/* Performance Gauges */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <PerformanceGauge stats={statsData?.network || null} isLoading={isLoading} />
        </motion.section>

        {/* Operator Tools & Network Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <OperatorTools nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <NetworkPulse nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <LiveActivity nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* City Map - Real GeoIP Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <CityMap nodes={nodesData?.nodes || []} isLoading={isLoading} />
        </motion.div>

        {/* Node Activity Timeline - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <NodeTimeline nodes={nodesData?.nodes || []} isLoading={isLoading} />
        </motion.div>

        {/* Network Topology & Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <NetworkMap nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <VersionCompliance nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <StatusChart
              data={statsData?.statusDistribution || []}
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <VersionDistribution
              data={statsData?.versionDistribution || []}
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <TopNodes nodes={statsData?.topNodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Storage Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <StorageChart nodes={nodesData?.nodes || []} isLoading={isLoading} />
        </motion.div>

        {/* Network 3D Topology - Full Width Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Network3D nodes={nodesData?.nodes || []} isLoading={isLoading} />
        </motion.div>

        {/* 3D Visualizations Row - Data Flow & Storage Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <DataFlowVisualization nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <StorageCapacity3D nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Uptime Row - 3D Distribution & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <UptimeDistribution3D nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <UptimeLeaderboard nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Health & Storage Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <StorageTreemap nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <HealthDistribution nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Fibonacci Health Spiral - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <FibonacciHealth3D nodes={nodesData?.nodes || []} isLoading={isLoading} />
        </motion.div>

        {/* Galaxy & DNA Helix Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <ParticleGalaxy3D nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <VersionHelix3D nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Storage Distribution - Interactive Bubble Chart */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <BubbleChart nodes={nodesData?.nodes || []} isLoading={isLoading} fullSection />
        </motion.section>

        {/* Network Health Timeline & Regional Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <NetworkHealthChart stats={statsData?.network || null} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <RegionalDistribution nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Network Health Summary */}
        {statsData?.healthSummary && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card
              className={`border-l-4 overflow-hidden ${
                statsData.healthSummary.status === 'healthy'
                  ? 'border-l-green-500'
                  : statsData.healthSummary.status === 'warning'
                    ? 'border-l-yellow-500'
                    : 'border-l-red-500'
              }`}
            >
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                        statsData.healthSummary.status === 'healthy'
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                          : statsData.healthSummary.status === 'warning'
                            ? 'bg-gradient-to-br from-yellow-500 to-amber-500'
                            : 'bg-gradient-to-br from-red-500 to-rose-500'
                      }`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Zap className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-xl font-bold capitalize">
                        Network Status: {statsData.healthSummary.status}
                      </p>
                      <p className="text-muted-foreground">
                        {statsData.healthSummary.message}
                      </p>
                    </div>
                  </div>

                  {statsData.needsAttention && (
                    <div className="flex items-center gap-6">
                      {statsData.needsAttention.outdatedCount > 0 && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-500">
                            {statsData.needsAttention.outdatedCount}
                          </p>
                          <p className="text-xs text-muted-foreground">Outdated</p>
                        </div>
                      )}
                      {statsData.needsAttention.lowHealthCount > 0 && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">
                            {statsData.needsAttention.lowHealthCount}
                          </p>
                          <p className="text-xs text-muted-foreground">Low Health</p>
                        </div>
                      )}
                      {statsData.needsAttention.highStorageCount > 0 && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-500">
                            {statsData.needsAttention.highStorageCount}
                          </p>
                          <p className="text-xs text-muted-foreground">High Storage</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Link href="/nodes">
            <Card className="group cursor-pointer h-full hover:shadow-xl hover:shadow-xandeum-orange/10 transition-all hover:border-xandeum-orange/50 bg-gradient-to-br from-background to-xandeum-orange/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-xandeum-orange to-orange-500">
                    <Server className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">View All Nodes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Browse the complete list with filtering and search
                    </p>
                    <span className="text-xandeum-orange text-sm font-medium flex items-center">
                      Explore nodes
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare">
            <Card className="group cursor-pointer h-full hover:shadow-xl hover:shadow-xandeum-purple/10 transition-all hover:border-xandeum-purple/50 bg-gradient-to-br from-background to-xandeum-purple/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-xandeum-purple to-purple-500">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Compare Nodes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Compare performance metrics side by side
                    </p>
                    <span className="text-xandeum-purple text-sm font-medium flex items-center">
                      Start comparing
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <a
            href="https://docs.xandeum.network"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="group cursor-pointer h-full hover:shadow-xl hover:shadow-xandeum-blue/10 transition-all hover:border-xandeum-blue/50 bg-gradient-to-br from-background to-xandeum-blue/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-xandeum-blue to-blue-500">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Documentation</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learn about pNodes and pRPC setup
                    </p>
                    <span className="text-xandeum-blue text-sm font-medium flex items-center">
                      Read docs
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        </motion.section>
      </div>
    </div>
  );
}
