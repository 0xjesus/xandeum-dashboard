'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/nodes/StatusBadge';
import { HealthScore } from '@/components/nodes/HealthScore';
import { PNode } from '@/types';
import { truncateMiddle } from '@/lib/utils';

interface TopNodesProps {
  nodes: PNode[];
  isLoading?: boolean;
}

const medals = ['gold', 'silver', 'bronze'] as const;
const medalColors = {
  gold: 'text-yellow-500',
  silver: 'text-gray-400',
  bronze: 'text-amber-600',
};

export function TopNodes({ nodes, isLoading }: TopNodesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performing Nodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-10 w-10 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performing Nodes
          </CardTitle>
          <Link href="/nodes?sortBy=healthScore&sortOrder=desc">
            <Button variant="ghost" size="sm" className="text-xs">
              View all
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nodes.slice(0, 5).map((node, index) => (
            <motion.div
              key={node.pubkey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/nodes/${node.pubkey}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {index < 3 ? (
                      <Medal className={`h-5 w-5 ${medalColors[medals[index]]}`} />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Node Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium truncate">
                      {truncateMiddle(node.pubkey)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={node.status} size="sm" showDot={false} />
                      <span className="text-xs text-muted-foreground">
                        {node.uptimeFormatted} uptime
                      </span>
                    </div>
                  </div>

                  {/* Health Score */}
                  <HealthScore score={node.healthScore} size="sm" />

                  {/* Arrow */}
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
