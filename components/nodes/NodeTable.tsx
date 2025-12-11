'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  ArrowUpDown,
  Star,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GitCompare,
  X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from './StatusBadge';
import { HealthScore } from './HealthScore';
import { InfoTooltip } from '@/components/common/MetricTooltip';
import { PNode, NodeFilters } from '@/types';
import { truncateMiddle, formatRelativeTime, copyToClipboard } from '@/lib/utils';
import { useWatchlist } from '@/hooks/useWatchlist';

interface NodeTableProps {
  nodes: PNode[];
  onSort?: (key: NodeFilters['sortBy']) => void;
  sortBy?: NodeFilters['sortBy'];
  sortOrder?: NodeFilters['sortOrder'];
  showSearch?: boolean;
  showPagination?: boolean;
  showCompare?: boolean;
  pageSize?: number;
  // External compare state management
  selectedForCompare?: string[];
  onCompareSelectionChange?: (selected: string[]) => void;
}

export function NodeTable({
  nodes,
  onSort,
  sortBy,
  sortOrder,
  showSearch = true,
  showPagination = true,
  showCompare = true,
  pageSize = 20,
  selectedForCompare: externalSelected,
  onCompareSelectionChange,
}: NodeTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedPubkey, setCopiedPubkey] = useState<string | null>(null);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const { isWatched, toggleWatchlist } = useWatchlist();

  // Use external state if provided, otherwise use internal
  const selectedForCompare = externalSelected ?? internalSelected;
  const setSelectedForCompare = onCompareSelectionChange ?? setInternalSelected;

  const toggleCompareSelection = (pubkey: string) => {
    if (selectedForCompare.includes(pubkey)) {
      setSelectedForCompare(selectedForCompare.filter(p => p !== pubkey));
    } else if (selectedForCompare.length < 4) {
      setSelectedForCompare([...selectedForCompare, pubkey]);
    }
  };

  const clearCompareSelection = () => {
    setSelectedForCompare([]);
  };

  const goToCompare = () => {
    if (selectedForCompare.length >= 2) {
      router.push(`/compare?nodes=${selectedForCompare.join(',')}`);
    }
  };

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(node =>
      node.pubkey.toLowerCase().includes(query) ||
      node.ip.toLowerCase().includes(query) ||
      node.version.includes(query)
    );
  }, [nodes, searchQuery]);

  // Sort watched nodes to top, then apply current sort
  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      // Watched nodes always first
      const aWatched = isWatched(a.pubkey);
      const bWatched = isWatched(b.pubkey);
      if (aWatched && !bWatched) return -1;
      if (!aWatched && bWatched) return 1;
      return 0;
    });
  }, [filteredNodes, isWatched]);

  // Pagination
  const totalPages = Math.ceil(sortedNodes.length / pageSize);
  const paginatedNodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedNodes.slice(start, start + pageSize);
  }, [sortedNodes, currentPage, pageSize]);

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSort = (key: NodeFilters['sortBy']) => {
    if (onSort) {
      onSort(key);
    }
  };

  const handleCopyPubkey = async (pubkey: string) => {
    const success = await copyToClipboard(pubkey);
    if (success) {
      setCopiedPubkey(pubkey);
      setTimeout(() => setCopiedPubkey(null), 2000);
    }
  };

  // Mask IP for privacy (show first two octets)
  const maskIP = (ip: string) => {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip;
  };

  const SortableHeader = ({
    label,
    sortKey,
    tooltip,
  }: {
    label: string;
    sortKey: NodeFilters['sortBy'];
    tooltip?: string;
  }) => (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => handleSort(sortKey)}
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
        {sortBy === sortKey && (
          <span className="ml-1 text-xs text-muted-foreground">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </Button>
      {tooltip && <InfoTooltip term={tooltip} />}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Compare Selection Bar */}
      {showCompare && selectedForCompare.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-lg bg-xandeum-orange/10 border border-xandeum-orange/30"
        >
          <div className="flex items-center gap-3">
            <GitCompare className="h-5 w-5 text-xandeum-orange" />
            <span className="text-sm font-medium">
              {selectedForCompare.length} node{selectedForCompare.length > 1 ? 's' : ''} selected
            </span>
            <span className="text-xs text-muted-foreground">
              (select 2-4 nodes to compare)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompareSelection}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={goToCompare}
              disabled={selectedForCompare.length < 2}
              className="bg-xandeum-orange hover:bg-xandeum-orange/90"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Nodes
            </Button>
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by pubkey, IP, or version..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredNodes.length} of {nodes.length} nodes
          </div>
          {showCompare && selectedForCompare.length === 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <GitCompare className="h-3 w-3" />
              Click checkboxes to compare
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showCompare && (
                <TableHead className="w-[40px]">
                  <GitCompare className="h-4 w-4 text-muted-foreground" />
                </TableHead>
              )}
              <TableHead className="w-[40px]">
                <Star className="h-4 w-4 text-muted-foreground" />
              </TableHead>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-1">
                  Pubkey
                  <InfoTooltip term="pubkey" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  IP
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Version
                  <InfoTooltip term="version" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Gossip Status
                  <InfoTooltip term="gossip_status" />
                </div>
              </TableHead>
              <TableHead>
                <SortableHeader label="Health" sortKey="healthScore" tooltip="health_score" />
              </TableHead>
              <TableHead>
                <SortableHeader label="Storage" sortKey="storage" tooltip="storage_committed" />
              </TableHead>
              <TableHead>
                <SortableHeader label="Uptime" sortKey="uptime" tooltip="uptime" />
              </TableHead>
              <TableHead>
                <SortableHeader label="Last Seen" sortKey="lastSeen" tooltip="last_seen" />
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCompare ? 11 : 10} className="text-center py-8">
                  <p className="text-muted-foreground">No nodes found</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedNodes.map((node, index) => {
                const watched = isWatched(node.pubkey);
                const isSelectedForCompare = selectedForCompare.includes(node.pubkey);
                return (
                  <motion.tr
                    key={node.pubkey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`group border-b transition-colors hover:bg-muted/50 ${
                      watched ? 'bg-yellow-500/5' : ''
                    } ${isSelectedForCompare ? 'bg-xandeum-orange/10' : ''}`}
                  >
                    {/* Compare Checkbox */}
                    {showCompare && (
                      <TableCell>
                        <Checkbox
                          checked={isSelectedForCompare}
                          onCheckedChange={() => toggleCompareSelection(node.pubkey)}
                          disabled={!isSelectedForCompare && selectedForCompare.length >= 4}
                          className="data-[state=checked]:bg-xandeum-orange data-[state=checked]:border-xandeum-orange"
                        />
                      </TableCell>
                    )}
                    {/* Star/Watchlist */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleWatchlist(node.pubkey, node.ip)}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            watched
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground hover:text-yellow-500'
                          }`}
                        />
                      </Button>
                    </TableCell>

                    {/* Pubkey (copiable) */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyPubkey(node.pubkey)}
                          className="font-mono text-sm font-medium hover:text-xandeum-orange transition-colors flex items-center gap-1"
                        >
                          {truncateMiddle(node.pubkey, 6, 4)}
                          {copiedPubkey === node.pubkey ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* IP (masked) */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground font-mono">
                        {maskIP(node.ip)}
                      </span>
                    </TableCell>

                    {/* Version */}
                    <TableCell>
                      <Badge variant="version" className="text-xs">
                        v{node.version}
                      </Badge>
                    </TableCell>

                    {/* Gossip Status */}
                    <TableCell>
                      <StatusBadge status={node.status} size="sm" />
                    </TableCell>

                    {/* Health Score */}
                    <TableCell>
                      <HealthScore score={node.healthScore} size="sm" />
                    </TableCell>

                    {/* Storage */}
                    <TableCell>
                      <div>
                        <p className="text-sm">{node.storageUsedFormatted}</p>
                        <p className="text-xs text-muted-foreground">
                          of {node.storageCommittedFormatted}
                        </p>
                      </div>
                    </TableCell>

                    {/* Uptime */}
                    <TableCell>
                      <span className="text-sm">{node.uptimeFormatted}</span>
                    </TableCell>

                    {/* Last Seen */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(node.last_seen_timestamp)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Link href={`/nodes/${node.pubkey}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
