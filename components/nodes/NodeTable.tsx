'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowUpDown } from 'lucide-react';
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
import { StatusBadge } from './StatusBadge';
import { HealthScore } from './HealthScore';
import { PNode, NodeFilters } from '@/types';
import { truncateMiddle, formatRelativeTime } from '@/lib/utils';

interface NodeTableProps {
  nodes: PNode[];
  onSort?: (key: NodeFilters['sortBy']) => void;
  sortBy?: NodeFilters['sortBy'];
  sortOrder?: NodeFilters['sortOrder'];
}

export function NodeTable({ nodes, onSort, sortBy, sortOrder }: NodeTableProps) {
  const handleSort = (key: NodeFilters['sortBy']) => {
    if (onSort) {
      onSort(key);
    }
  };

  const SortableHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: NodeFilters['sortBy'];
  }) => (
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
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Node</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <SortableHeader label="Health" sortKey="healthScore" />
            </TableHead>
            <TableHead>Version</TableHead>
            <TableHead>
              <SortableHeader label="Storage" sortKey="storage" />
            </TableHead>
            <TableHead>
              <SortableHeader label="Uptime" sortKey="uptime" />
            </TableHead>
            <TableHead>
              <SortableHeader label="Last Seen" sortKey="lastSeen" />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <p className="text-muted-foreground">No nodes found</p>
              </TableCell>
            </TableRow>
          ) : (
            nodes.map((node, index) => (
              <motion.tr
                key={node.pubkey}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="group border-b transition-colors hover:bg-muted/50"
              >
                <TableCell>
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {truncateMiddle(node.pubkey)}
                    </p>
                    <p className="text-xs text-muted-foreground">{node.ip}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={node.status} size="sm" />
                </TableCell>
                <TableCell>
                  <HealthScore score={node.healthScore} size="sm" />
                </TableCell>
                <TableCell>
                  <Badge variant="version" className="text-xs">
                    v{node.version}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{node.storageUsedFormatted}</p>
                    <p className="text-xs text-muted-foreground">
                      of {node.storageCommittedFormatted}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{node.uptimeFormatted}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(node.last_seen_timestamp)}
                  </span>
                </TableCell>
                <TableCell>
                  <Link href={`/nodes/${node.pubkey}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
