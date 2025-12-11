'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Server, HardDrive, Clock, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StatusBadge } from './StatusBadge';
import { HealthScore } from './HealthScore';
import { PNode } from '@/types';
import { truncateMiddle, copyToClipboard, formatRelativeTime } from '@/lib/utils';
import { useState } from 'react';

interface NodeCardProps {
  node: PNode;
  index?: number;
}

export function NodeCard({ node, index = 0 }: NodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    const success = await copyToClipboard(node.pubkey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/nodes/${node.pubkey}`}>
        <Card className="group relative overflow-hidden hover:border-xandeum-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-xandeum-500/10">
          {/* Status indicator line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              node.status === 'online'
                ? 'bg-green-500'
                : node.status === 'degraded'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-xandeum-500/20 to-xandeum-600/20 border border-xandeum-500/30">
                    <Server className="h-5 w-5 text-xandeum-500" />
                  </div>
                  {node.status === 'online' && (
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="flex items-center gap-1.5 cursor-pointer"
                          onClick={handleCopy}
                        >
                          <span className="font-mono text-sm font-medium">
                            {truncateMiddle(node.pubkey)}
                          </span>
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied ? 'Copied!' : 'Click to copy pubkey'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-xs text-muted-foreground">{node.ip}</p>
                </div>
              </div>
              <HealthScore score={node.healthScore} size="sm" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status and Version */}
            <div className="flex items-center gap-2">
              <StatusBadge status={node.status} size="sm" />
              <Badge variant="version" className="text-xs">
                v{node.version}
              </Badge>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="text-sm font-medium">
                    {node.storageUsedFormatted}
                    <span className="text-muted-foreground">
                      {' '}
                      / {node.storageCommittedFormatted}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="text-sm font-medium">{node.uptimeFormatted}</p>
                </div>
              </div>
            </div>

            {/* Last Seen */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Last seen {formatRelativeTime(node.last_seen_timestamp)}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-xandeum-500 transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
