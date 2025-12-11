'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, GitBranch, ArrowUpCircle } from 'lucide-react';
import { PNode } from '@/types';

interface VersionComplianceProps {
  nodes: PNode[];
  isLoading?: boolean;
}

export function VersionCompliance({ nodes, isLoading }: VersionComplianceProps) {
  const versionStats = useMemo(() => {
    const versionMap = new Map<string, number>();
    nodes.forEach(node => {
      const count = versionMap.get(node.version) || 0;
      versionMap.set(node.version, count + 1);
    });

    const versions = Array.from(versionMap.entries())
      .map(([version, count]) => ({
        version,
        count,
        percentage: (count / nodes.length) * 100
      }))
      .sort((a, b) => {
        // Sort by semantic versioning (newest first)
        const aParts = a.version.split('.').map(Number);
        const bParts = b.version.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if ((bParts[i] || 0) !== (aParts[i] || 0)) {
            return (bParts[i] || 0) - (aParts[i] || 0);
          }
        }
        return 0;
      });

    const latestVersion = versions[0]?.version || '0.0.0';
    const upToDate = nodes.filter(n => n.version === latestVersion).length;
    const outdated = nodes.length - upToDate;
    const complianceRate = nodes.length > 0 ? (upToDate / nodes.length) * 100 : 0;

    return {
      versions,
      latestVersion,
      upToDate,
      outdated,
      complianceRate
    };
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Version Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getComplianceIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle2 className="h-8 w-8 text-green-500" />;
    if (rate >= 70) return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    return <XCircle className="h-8 w-8 text-red-500" />;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Version Compliance</CardTitle>
              <p className="text-sm text-muted-foreground">Network software version status</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Compliance gauge */}
        <div className="flex items-center justify-center gap-8 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            {/* Circular progress */}
            <svg width="120" height="120" className="transform -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-muted/20"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                className={getComplianceColor(versionStats.complianceRate)}
                initial={{ strokeDasharray: '0 314' }}
                animate={{
                  strokeDasharray: `${(versionStats.complianceRate / 100) * 314} 314`
                }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${getComplianceColor(versionStats.complianceRate)}`}>
                {versionStats.complianceRate.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">Compliant</span>
            </div>
          </motion.div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">{versionStats.upToDate} nodes</p>
                <p className="text-xs text-muted-foreground">Running v{versionStats.latestVersion}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">{versionStats.outdated} nodes</p>
                <p className="text-xs text-muted-foreground">Need update</p>
              </div>
            </div>
          </div>
        </div>

        {/* Version breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Version Distribution</p>
          {versionStats.versions.slice(0, 5).map((v, index) => (
            <motion.div
              key={v.version}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-mono">v{v.version}</span>
                  {index === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                      LATEST
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {v.count} ({v.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${index === 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${v.percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Latest version info */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            {getComplianceIcon(versionStats.complianceRate)}
            <div>
              <p className="font-medium">
                {versionStats.complianceRate >= 90
                  ? 'Excellent Compliance'
                  : versionStats.complianceRate >= 70
                    ? 'Good Compliance'
                    : 'Needs Attention'}
              </p>
              <p className="text-sm text-muted-foreground">
                Latest version: Heidelberg v{versionStats.latestVersion}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
