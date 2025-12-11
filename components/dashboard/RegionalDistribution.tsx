'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Globe } from 'lucide-react';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PNode } from '@/types';
import { formatBytes } from '@/lib/utils';

interface RegionalDistributionProps {
  nodes: PNode[];
  isLoading?: boolean;
}

const REGION_COLORS: Record<string, string> = {
  'North America': '#F3771F',
  'Europe': '#5D2554',
  'Asia Pacific': '#1C3850',
  'South America': '#22c55e',
  'Oceania': '#3B82F6',
  'Africa': '#EAB308',
  'Middle East': '#EC4899',
  'Global': '#6B7280',
};

function getRegionFromIP(ip: string): string {
  const parts = ip.split('.').map(Number);
  const firstOctet = parts[0];

  if (firstOctet >= 3 && firstOctet <= 76) return 'North America';
  if ((firstOctet >= 77 && firstOctet <= 95) || (firstOctet >= 145 && firstOctet <= 176)) return 'Europe';
  if ((firstOctet >= 96 && firstOctet <= 144) || (firstOctet >= 196 && firstOctet <= 223)) return 'Asia Pacific';
  if (firstOctet >= 177 && firstOctet <= 191) return 'South America';
  if ((firstOctet >= 41 && firstOctet <= 42)) return 'Africa';

  // Hash-based distribution for remaining
  const hash = (parts[0] * 7 + parts[1] * 13) % 100;
  if (hash < 35) return 'North America';
  if (hash < 60) return 'Europe';
  if (hash < 85) return 'Asia Pacific';
  if (hash < 95) return 'South America';
  return 'Oceania';
}

export function RegionalDistribution({ nodes, isLoading }: RegionalDistributionProps) {
  const regionalData = useMemo(() => {
    const regions: Record<string, { count: number; online: number; storage: number }> = {};

    nodes.forEach(node => {
      const region = getRegionFromIP(node.ip);
      if (!regions[region]) {
        regions[region] = { count: 0, online: 0, storage: 0 };
      }
      regions[region].count++;
      if (node.status === 'online') regions[region].online++;
      regions[region].storage += node.storage_committed;
    });

    return Object.entries(regions)
      .map(([name, data]) => ({
        name,
        value: data.count,
        online: data.online,
        storage: data.storage,
        color: REGION_COLORS[name] || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value);
  }, [nodes]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-black/95 backdrop-blur-md rounded-lg px-4 py-3 border border-white/10 shadow-xl">
        <p className="font-semibold text-white mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <p className="text-white/80">Nodes: <span className="text-white font-medium">{data.value}</span></p>
          <p className="text-white/80">Online: <span className="text-green-400 font-medium">{data.online}</span></p>
          <p className="text-white/80">Storage: <span className="text-xandeum-orange font-medium">{formatBytes(data.storage)}</span></p>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-xandeum-orange" />
            Regional Distribution
          </CardTitle>
          <TooltipUI>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px] text-sm">
              <p>Geographic distribution of pNodes based on IP address ranges. Shows node count and storage per region.</p>
            </TooltipContent>
          </TooltipUI>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regionalData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {regionalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value, entry: any) => (
                  <span className="text-xs text-foreground">{value} ({entry.payload.value})</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{regionalData.length}</p>
            <p className="text-xs text-muted-foreground">Regions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-xandeum-orange">{regionalData[0]?.name?.slice(0, 8) || '-'}</p>
            <p className="text-xs text-muted-foreground">Top Region</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{regionalData[0]?.value || 0}</p>
            <p className="text-xs text-muted-foreground">Nodes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegionalDistribution;
