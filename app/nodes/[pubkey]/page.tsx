'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Server,
  HardDrive,
  Clock,
  Wifi,
  Globe,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/nodes/StatusBadge';
import { HealthScore } from '@/components/nodes/HealthScore';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { useNode } from '@/hooks/useNodes';
import { copyToClipboard, formatRelativeTime, formatBytes, formatPercent } from '@/lib/utils';
import { LATEST_VERSION } from '@/lib/constants';
import { useState } from 'react';

export default function NodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pubkey = params.pubkey as string;
  const [copied, setCopied] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useNode(pubkey);

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  if (error) {
    return (
      <div className="container py-8">
        <ErrorState
          title="Node not found"
          message="Could not find the requested pNode."
          onRetry={() => router.back()}
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return <PageLoader />;
  }

  const { node, healthFactors } = data;
  const isLatestVersion = node.version === LATEST_VERSION;

  return (
    <div className="container py-8 space-y-6">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link href="/nodes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to nodes
          </Button>
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-start justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-xandeum-500/20 to-xandeum-600/20 border border-xandeum-500/30">
              <Server className="h-8 w-8 text-xandeum-500" />
            </div>
            {node.status === 'online' && (
              <motion.div
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold font-mono">{node.pubkey.slice(0, 8)}...</h1>
              <StatusBadge status={node.status} />
              <Badge variant="version">v{node.version}</Badge>
              {!isLatestVersion && (
                <Badge variant="degraded" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Update Available
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {node.ip}
              </span>
              <span className="flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                Port {node.rpc_port}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Health Score and Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <HealthScore
                  score={node.healthScore}
                  size="lg"
                  showLabel
                  factors={healthFactors}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{node.uptimeFormatted}</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <HardDrive className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{node.storageUsedFormatted}</p>
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <HardDrive className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{node.storageCommittedFormatted}</p>
                  <p className="text-xs text-muted-foreground">Committed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Server className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">
                    {formatPercent(node.storage_usage_percent)}
                  </p>
                  <p className="text-xs text-muted-foreground">Utilization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Node Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow
                label="Public Key"
                value={node.pubkey}
                copyable
                onCopy={() => handleCopy(node.pubkey, 'pubkey')}
                copied={copied === 'pubkey'}
              />
              <DetailRow
                label="Address"
                value={node.address}
                copyable
                onCopy={() => handleCopy(node.address, 'address')}
                copied={copied === 'address'}
              />
              <DetailRow label="IP Address" value={node.ip} />
              <DetailRow label="Gossip Port" value={String(node.gossipPort)} />
              <DetailRow label="RPC Port" value={String(node.rpc_port)} />
              <DetailRow
                label="Public"
                value={node.is_public ? 'Yes' : 'No'}
                icon={node.is_public ? CheckCircle : AlertTriangle}
                iconColor={node.is_public ? 'text-green-500' : 'text-yellow-500'}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Storage & Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage & Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Version" value={`v${node.version}`}>
                {isLatestVersion ? (
                  <Badge variant="online" className="text-xs">Latest</Badge>
                ) : (
                  <Badge variant="degraded" className="text-xs">Outdated</Badge>
                )}
              </DetailRow>
              <DetailRow
                label="Storage Committed"
                value={formatBytes(node.storage_committed)}
              />
              <DetailRow
                label="Storage Used"
                value={formatBytes(node.storage_used)}
              />
              <DetailRow
                label="Utilization"
                value={formatPercent(node.storage_usage_percent)}
              />
              <DetailRow label="Uptime" value={node.uptimeFormatted} />
              <DetailRow
                label="Last Seen"
                value={formatRelativeTime(node.last_seen_timestamp)}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Storage Utilization Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used</span>
                <span className="font-medium">
                  {node.storageUsedFormatted} / {node.storageCommittedFormatted}
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    node.storage_usage_percent > 90
                      ? 'bg-red-500'
                      : node.storage_usage_percent > 70
                        ? 'bg-yellow-500'
                        : 'bg-xandeum-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${node.storage_usage_percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  copyable,
  onCopy,
  copied,
  icon: Icon,
  iconColor,
  children,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  icon?: React.ElementType;
  iconColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-4 w-4 ${iconColor || ''}`} />}
        <span className="text-sm font-mono truncate max-w-[200px]">{value}</span>
        {children}
        {copyable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCopy}
          >
            {copied ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
