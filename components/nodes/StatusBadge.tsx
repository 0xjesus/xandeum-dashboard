'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { NodeStatus } from '@/types';

interface StatusBadgeProps {
  status: NodeStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig = {
  online: {
    label: 'Online',
    variant: 'online' as const,
    dotColor: 'bg-green-500',
  },
  degraded: {
    label: 'Degraded',
    variant: 'degraded' as const,
    dotColor: 'bg-yellow-500',
  },
  offline: {
    label: 'Offline',
    variant: 'offline' as const,
    dotColor: 'bg-red-500',
  },
};

export function StatusBadge({ status, showDot = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={size === 'sm' ? 'text-xs px-2 py-0.5' : ''}
    >
      {showDot && (
        <motion.span
          className={`mr-1.5 h-2 w-2 rounded-full ${config.dotColor}`}
          animate={status === 'online' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
      {config.label}
    </Badge>
  );
}
