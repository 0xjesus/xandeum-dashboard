'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { LayoutGrid, List, RefreshCw, Server, Activity, HardDrive, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NodeCard } from '@/components/nodes/NodeCard';
import { NodeTable } from '@/components/nodes/NodeTable';
import { NodeFilters } from '@/components/nodes/NodeFilters';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { NoSearchResults } from '@/components/common/EmptyState';
import { useNodes, useVersions } from '@/hooks/useNodes';
import { NodeFilters as NodeFiltersType } from '@/types';

export default function NodesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<NodeFiltersType>({
    status: 'all',
    version: 'all',
    search: '',
    sortBy: 'healthScore',
    sortOrder: 'desc',
  });

  const { data, error, isLoading, mutate } = useNodes(filters);
  const versions = useVersions();

  const handleFilterChange = (newFilters: Partial<NodeFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSort = (key: NodeFiltersType['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  const exportToJSON = () => {
    if (!data?.nodes) return;
    const dataStr = JSON.stringify(data.nodes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-pnodes-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!data?.nodes) return;
    const headers = ['pubkey', 'ip', 'status', 'healthScore', 'uptime', 'version', 'storage_committed', 'storage_used', 'is_public'];
    const rows = data.nodes.map(n => [
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

  // Calculate quick stats
  const onlineCount = data?.nodes?.filter(n => n.status === 'online').length || 0;
  const degradedCount = data?.nodes?.filter(n => n.status === 'degraded').length || 0;
  const totalStorage = data?.nodes?.reduce((acc, n) => acc + n.storage_committed, 0) || 0;
  const avgHealth = data?.nodes?.length ? Math.round(data.nodes.reduce((acc, n) => acc + n.healthScore, 0) / data.nodes.length) : 0;

  if (error) {
    return (
      <div className="container py-8">
        <ErrorState
          title="Failed to load nodes"
          message="Could not fetch pNode data from the network."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header with gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-xandeum-dark via-[#0a1525] to-background border-b border-border/50">
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-xandeum-orange/10 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-xandeum-purple/10 rounded-full blur-[120px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="container relative py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-xandeum-orange to-orange-600 shadow-lg shadow-xandeum-orange/30">
                  <Server className="h-8 w-8 text-white" />
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-background"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white">pNodes Explorer</h1>
                <p className="text-white/60 mt-1">
                  Browse and monitor all storage provider nodes
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 lg:gap-6">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <Activity className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{onlineCount}</p>
                  <p className="text-xs text-white/50">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <HardDrive className="h-5 w-5 text-xandeum-orange" />
                <div>
                  <p className="text-2xl font-bold text-white">{(totalStorage / (1024 ** 4)).toFixed(1)}TB</p>
                  <p className="text-xs text-white/50">Total Storage</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <div className="h-5 w-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                  {avgHealth}
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{avgHealth}%</p>
                  <p className="text-xs text-white/50">Avg Health</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'grid' | 'table')}
            >
              <TabsList className="bg-muted/50">
                <TabsTrigger value="grid" className="gap-2 data-[state=active]:bg-xandeum-orange data-[state=active]:text-white">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2 data-[state=active]:bg-xandeum-orange data-[state=active]:text-white">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Buttons */}
            <Button variant="outline" size="sm" onClick={exportToJSON} disabled={!data?.nodes}>
              <FileJson className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">JSON</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!data?.nodes}>
              <FileSpreadsheet className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
              className="border-xandeum-orange/50 hover:bg-xandeum-orange/10"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <NodeFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          versions={versions}
          totalCount={data?.total || 0}
          filteredCount={data?.filtered || 0}
        />
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : data?.nodes.length === 0 ? (
        <NoSearchResults onClear={() => handleFilterChange({ search: '', status: 'all', version: 'all' })} />
      ) : viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {data?.nodes.map((node, index) => (
            <NodeCard key={node.pubkey} node={node} index={index} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <NodeTable
            nodes={data?.nodes || []}
            onSort={handleSort}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
          />
        </motion.div>
      )}
      </div>
    </div>
  );
}
