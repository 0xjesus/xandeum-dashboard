'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowRight, Server, Activity, Zap, RefreshCw, Sparkles, Globe2, ChevronDown } from 'lucide-react';
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
import { ErrorState } from '@/components/common/ErrorState';
import { useStats, useNodes } from '@/hooks/useNodes';

// Dynamically import 3D components to avoid SSR issues
const NetworkGlobe = dynamic(
  () => import('@/components/three/NetworkGlobe').then((mod) => mod.NetworkGlobe),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse bg-gradient-to-br from-xandeum-dark to-slate-900 rounded-lg" /> }
);


export default function DashboardPage() {
  const { data: statsData, error: statsError, isLoading: statsLoading, mutate: mutateStats } = useStats();
  const { data: nodesData, error: nodesError, isLoading: nodesLoading, mutate: mutateNodes } = useNodes();

  const isLoading = statsLoading || nodesLoading;
  const error = statsError || nodesError;

  const handleRefresh = () => {
    mutateStats();
    mutateNodes();
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
        {/* Refresh Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Image src="/logo.svg" alt="Xandeum" width={32} height={32} />
            Network Analytics
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
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
            <LiveActivity nodes={nodesData?.nodes || []} isLoading={isLoading} />
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

        {/* New Charts Row - Treemap & Health Distribution */}
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
