'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
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
    <div className="container py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">pNodes</h1>
          <p className="text-muted-foreground mt-1">
            Browse and monitor all storage provider nodes in the network
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as 'grid' | 'table')}
          >
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="icon"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
  );
}
