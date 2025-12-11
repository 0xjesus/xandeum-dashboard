'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  GitCompare,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Server,
  HardDrive,
  Clock,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/nodes/StatusBadge';
import { HealthScore } from '@/components/nodes/HealthScore';
import { PNode } from '@/types';
import { truncateMiddle } from '@/lib/utils';

interface QuickCompareProps {
  selectedPubkeys: string[];
  nodes: PNode[];
  onClear: () => void;
  onRemove: (pubkey: string) => void;
}

export function QuickCompare({ selectedPubkeys, nodes, onClear, onRemove }: QuickCompareProps) {
  const selectedNodes = useMemo(() => {
    return selectedPubkeys
      .map(pubkey => nodes.find(n => n.pubkey === pubkey))
      .filter((n): n is PNode => n !== undefined);
  }, [selectedPubkeys, nodes]);

  if (selectedNodes.length < 2) {
    return null;
  }

  // Find best values for highlighting
  const bestHealth = Math.max(...selectedNodes.map(n => n.healthScore));
  const bestUptime = Math.max(...selectedNodes.map(n => n.uptime));
  const bestStorage = Math.max(...selectedNodes.map(n => n.storage_committed));

  const CompareIndicator = ({ value, best, reverse = false }: { value: number; best: number; reverse?: boolean }) => {
    if (value === best) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    }
    const diff = ((value - best) / best) * 100;
    if (Math.abs(diff) < 5) {
      return <Minus className="h-3 w-3 text-yellow-500" />;
    }
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-xandeum-orange/30 bg-gradient-to-br from-xandeum-orange/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-xandeum-orange to-orange-600">
                <GitCompare className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Quick Compare</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedNodes.length} nodes selected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/compare?nodes=${selectedPubkeys.join(',')}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Full Compare
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={onClear}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Node</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="h-3 w-3" />
                      Status
                    </div>
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Server className="h-3 w-3" />
                      Health
                    </div>
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      Uptime
                    </div>
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      Storage
                    </div>
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Version</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {selectedNodes.map((node, index) => (
                    <motion.tr
                      key={node.pubkey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/30 hover:bg-muted/30"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                            }}
                          />
                          <Link
                            href={`/nodes/${node.pubkey}`}
                            className="font-mono text-sm hover:text-xandeum-orange transition-colors"
                          >
                            {truncateMiddle(node.pubkey, 6, 4)}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={node.status} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <HealthScore score={node.healthScore} size="sm" />
                          <CompareIndicator value={node.healthScore} best={bestHealth} />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm">{node.uptimeFormatted}</span>
                          <CompareIndicator value={node.uptime} best={bestUptime} />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-center">
                            <span className="text-sm">{node.storageUsedFormatted}</span>
                            <span className="text-xs text-muted-foreground"> / {node.storageCommittedFormatted}</span>
                          </div>
                          <CompareIndicator value={node.storage_committed} best={bestStorage} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="version" className="text-xs">
                          v{node.version}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onRemove(node.pubkey)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Best Health</p>
              <p className="text-lg font-bold text-green-500">{bestHealth}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Health</p>
              <p className="text-lg font-bold text-xandeum-orange">
                {Math.round(selectedNodes.reduce((a, n) => a + n.healthScore, 0) / selectedNodes.length)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Storage</p>
              <p className="text-lg font-bold text-blue-500">
                {formatBytes(selectedNodes.reduce((a, n) => a + n.storage_committed, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
