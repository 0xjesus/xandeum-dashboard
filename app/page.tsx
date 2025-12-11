'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowRight, Server, Activity, Zap, RefreshCw, Globe2, ChevronDown, Search, Download, FileJson, FileSpreadsheet } from 'lucide-react';
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
import { ErrorState } from '@/components/common/ErrorState';
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
  const [searchQuery, setSearchQuery] = useState('');

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
      {/* HERO SECTION - GLOBE AS PROTAGONIST */}
      <section className="relative min-h-[110vh] flex flex-col overflow-hidden py-8 lg:py-16">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-xandeum-dark via-[#050a1a] to-background" />

        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-10 w-[600px] h-[600px] bg-xandeum-orange/10 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-xandeum-purple/20 rounded-full blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-xandeum-blue/5 rounded-full blur-[200px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        {/* Content overlay on globe */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Top content */}
          <div className="container pt-8 lg:pt-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left - Branding & Title */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/logo.svg" alt="Xandeum" width={48} height={48} className="drop-shadow-lg" />
                  <motion.div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-400">LIVE</span>
                  </motion.div>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                  <span className="text-white">Xandeum</span>{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-xandeum-orange via-orange-400 to-yellow-500">
                    pNodes
                  </span>
                </h1>

                <p className="text-lg text-white/60 mb-6">
                  Global decentralized storage network powering the future of Web3
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-8 lg:mb-12">
                  <Link href="/nodes">
                    <Button size="lg" className="bg-gradient-to-r from-xandeum-orange to-orange-500 hover:from-xandeum-orange/90 hover:to-orange-500/90 shadow-lg shadow-xandeum-orange/25 text-white font-semibold">
                      <Server className="mr-2 h-5 w-5" />
                      Explore All Nodes
                    </Button>
                  </Link>
                  <Link href="/compare">
                    <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/10">
                      Compare Nodes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Right - Live Stats */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex gap-6"
              >
                <div className="text-center">
                  <p className="text-4xl lg:text-5xl font-bold text-white">{totalNodes}</p>
                  <p className="text-sm text-white/50">Total Nodes</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-4xl lg:text-5xl font-bold text-green-500">{onlineNodes}</p>
                  <p className="text-sm text-white/50">Online</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-4xl lg:text-5xl font-bold text-xandeum-orange">
                    {totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0}%
                  </p>
                  <p className="text-sm text-white/50">Uptime</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* GLOBE SECTION - Full width edge to edge with generous spacing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 w-screen relative left-1/2 right-1/2 -mx-[50vw] my-8 lg:my-16"
            style={{ minHeight: '80vh' }}
          >
            {/* Globe container - full viewport width */}
            <div className="w-full h-full min-h-[80vh]">
              {nodesData?.nodes && nodesData.nodes.length > 0 ? (
                <NetworkGlobe
                  nodes={nodesData.nodes}
                  className="w-full h-full min-h-[80vh]"
                  size="hero"
                  showLegend={true}
                  showStats={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Globe2 className="h-16 w-16 text-xandeum-orange/50 mx-auto mb-4 animate-pulse" />
                    <p className="text-white/50">Loading global network...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="h-8 w-8 text-white/30" />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-12 space-y-8">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Image src="/logo.svg" alt="Xandeum" width={32} height={32} />
            Network Analytics
          </h2>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Quick Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by IP or pubkey..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-xandeum-orange/50"
              />
              {searchQuery && nodesData?.nodes && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-auto">
                  {nodesData.nodes
                    .filter(n => n.ip.includes(searchQuery) || n.pubkey.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 5)
                    .map(node => (
                      <Link
                        key={node.pubkey}
                        href={`/nodes/${node.pubkey}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                        onClick={() => setSearchQuery('')}
                      >
                        <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-green-500' : node.status === 'degraded' ? 'bg-orange-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium">{node.ip}</p>
                          <p className="text-xs text-muted-foreground font-mono">{node.pubkey.slice(0, 16)}...</p>
                        </div>
                      </Link>
                    ))
                  }
                  {nodesData.nodes.filter(n => n.ip.includes(searchQuery) || n.pubkey.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <p className="px-4 py-2 text-sm text-muted-foreground">No nodes found</p>
                  )}
                </div>
              )}
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={exportToJSON} disabled={!nodesData?.nodes}>
                <FileJson className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!nodesData?.nodes}>
                <FileSpreadsheet className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

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

        {/* Network Pulse & Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <NetworkPulse nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <LiveActivity nodes={nodesData?.nodes || []} isLoading={isLoading} />
          </motion.div>
        </div>

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
