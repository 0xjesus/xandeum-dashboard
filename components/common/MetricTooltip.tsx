'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricTooltipProps {
  term: string;
  children?: React.ReactNode;
}

// Definiciones de métricas
const METRIC_DEFINITIONS: Record<string, string> = {
  // Node metrics
  'pnodes': 'Persistent Nodes (pNodes) are storage providers in the Xandeum network. They commit storage space and earn rewards for storing data reliably.',
  'health_score': 'Overall node health (0-100%) calculated from uptime (30%), recency (35%), storage efficiency (20%), and software version (15%).',
  'uptime': 'Total time the node has been running continuously since last restart.',
  'last_seen': 'Time since the node was last detected in the gossip network. Nodes not seen in 5+ minutes are considered offline.',
  'storage_committed': 'Total storage space this node has pledged to the network.',
  'storage_used': 'Actual storage space currently being used by the node.',
  'storage_utilization': 'Percentage of committed storage currently in use. Lower is better for accepting new data.',
  'version': 'pNode software version. Latest version ensures best performance and security.',
  'gossip_status': 'Node visibility in the Xandeum gossip network: Online (active), Degraded (intermittent), or Offline (not responding).',
  'is_public': 'Whether the node accepts connections from any peer (public) or only from specific peers (private).',
  'pubkey': 'Unique cryptographic identifier for this node on the network.',

  // Network metrics
  'total_nodes': 'Total number of pNodes registered in the Xandeum network.',
  'online_nodes': 'Nodes currently active and responding to gossip messages.',
  'network_health': 'Overall network health based on percentage of online nodes and their individual health scores.',
  'total_storage': 'Combined storage capacity committed by all nodes in the network.',
  'avg_health': 'Average health score across all nodes in the network.',
  'version_compliance': 'Percentage of nodes running the latest software version.',

  // Charts
  'status_distribution': 'Breakdown of nodes by their current gossip status (online, degraded, offline).',
  'version_distribution': 'Distribution of pNode software versions across the network.',
  'regional_distribution': 'Geographic distribution of nodes based on IP geolocation (estimated from IP ranges).',

  // Watchlist
  'watchlist': 'Your personal list of nodes to monitor. These nodes appear at the top of lists and can trigger alerts.',
  'alerts': 'Browser notifications when watched nodes go offline or change status.',
};

export function MetricTooltip({ term, children }: MetricTooltipProps) {
  const definition = METRIC_DEFINITIONS[term] || 'No description available.';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm">
          <p>{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Variant sin children, solo el icono
export function InfoTooltip({ term }: { term: string }) {
  const definition = METRIC_DEFINITIONS[term] || 'No description available.';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm">
          <p>{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
