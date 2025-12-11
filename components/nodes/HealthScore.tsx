'use client';

import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  getHealthScoreColor,
  getHealthScoreGradient,
  getHealthScoreLabel,
} from '@/lib/metrics';
import { HealthFactors } from '@/types';

interface HealthScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  factors?: HealthFactors;
}

export function HealthScore({
  score,
  size = 'md',
  showLabel = false,
  factors,
}: HealthScoreProps) {
  const colorClass = getHealthScoreColor(score);
  const gradient = getHealthScoreGradient(score);
  const label = getHealthScoreLabel(score);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const content = (
    <motion.div
      className={cn(
        'relative flex items-center justify-center rounded-full font-bold',
        sizeClasses[size]
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Background ring */}
      <svg className="absolute inset-0" viewBox="0 0 36 36">
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          className="stroke-muted"
          strokeWidth="2"
        />
        <motion.path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          className={cn('stroke-current', colorClass)}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ strokeDasharray: '0 100' }}
          animate={{ strokeDasharray: `${score} 100` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className={colorClass}>{score}</span>
    </motion.div>
  );

  if (!factors) {
    return (
      <div className="flex items-center gap-2">
        {content}
        {showLabel && (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">Health Score</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {content}
            {showLabel && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">Health Score</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <div className="space-y-2">
            <p className="font-semibold">Health Score Breakdown</p>
            <div className="space-y-1">
              <FactorBar label="Uptime" value={factors.uptime} />
              <FactorBar label="Recency" value={factors.recency} />
              <FactorBar label="Storage" value={factors.storage} />
              <FactorBar label="Version" value={factors.version} />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-xs w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}
