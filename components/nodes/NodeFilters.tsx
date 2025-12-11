'use client';

import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NodeFilters as NodeFiltersType } from '@/types';

interface NodeFiltersProps {
  filters: NodeFiltersType;
  onFilterChange: (filters: Partial<NodeFiltersType>) => void;
  versions: string[];
  totalCount: number;
  filteredCount: number;
}

export function NodeFilters({
  filters,
  onFilterChange,
  versions,
  totalCount,
  filteredCount,
}: NodeFiltersProps) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.version !== 'all' ||
    (filters.search && filters.search.length > 0);

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      version: 'all',
      search: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by pubkey, IP, or address..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFilterChange({ status: value as NodeFiltersType['status'] })
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        {/* Version Filter */}
        <Select
          value={filters.version || 'all'}
          onValueChange={(value) => onFilterChange({ version: value })}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Versions</SelectItem>
            {versions.map((version) => (
              <SelectItem key={version} value={version}>
                v{version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters and Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <>
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
              {filters.status && filters.status !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {filters.status}
                  <button
                    onClick={() => onFilterChange({ status: 'all' })}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.version && filters.version !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  v{filters.version}
                  <button
                    onClick={() => onFilterChange({ version: 'all' })}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  "{filters.search}"
                  <button
                    onClick={() => onFilterChange({ search: '' })}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> nodes
        </p>
      </div>
    </div>
  );
}
