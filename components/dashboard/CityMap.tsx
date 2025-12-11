'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe2, RefreshCw, Server, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/common/MetricTooltip';
import { PNode } from '@/types';
import { getGeoLocationBatch, getCachedOrEstimatedLocation } from '@/lib/geoip';

interface CityMapProps {
  nodes: PNode[];
  isLoading?: boolean;
}

interface CityData {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  nodeCount: number;
  onlineCount: number;
  nodes: PNode[];
}

export function CityMap({ nodes, isLoading }: CityMapProps) {
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [geoLoaded, setGeoLoaded] = useState(false);

  // Fetch geolocation for all nodes
  const fetchGeoData = async () => {
    if (nodes.length === 0) return;

    setIsLoadingGeo(true);

    try {
      const ips = nodes.map(n => n.ip);
      const geoResults = await getGeoLocationBatch(ips);

      // Group nodes by city
      const cityMap = new Map<string, CityData>();

      nodes.forEach(node => {
        const geo = geoResults.get(node.ip) || getCachedOrEstimatedLocation(node.ip);
        const cityKey = `${geo.city}-${geo.country}`;

        if (!cityMap.has(cityKey)) {
          cityMap.set(cityKey, {
            city: geo.city,
            country: geo.country,
            countryCode: geo.countryCode,
            lat: geo.lat,
            lng: geo.lng,
            nodeCount: 0,
            onlineCount: 0,
            nodes: [],
          });
        }

        const city = cityMap.get(cityKey)!;
        city.nodeCount++;
        if (node.status === 'online') city.onlineCount++;
        city.nodes.push(node);
      });

      // Sort by node count
      const sortedCities = Array.from(cityMap.values())
        .sort((a, b) => b.nodeCount - a.nodeCount);

      setCityData(sortedCities);
      setGeoLoaded(true);
    } catch (error) {
      console.error('Failed to fetch geo data:', error);
    } finally {
      setIsLoadingGeo(false);
    }
  };

  useEffect(() => {
    if (nodes.length > 0 && !geoLoaded) {
      fetchGeoData();
    }
  }, [nodes, geoLoaded]);

  // Calculate stats
  const stats = useMemo(() => {
    const countries = new Set(cityData.map(c => c.country));
    const totalOnline = cityData.reduce((a, c) => a + c.onlineCount, 0);
    return {
      cities: cityData.length,
      countries: countries.size,
      onlineNodes: totalOnline,
    };
  }, [cityData]);

  if (isLoading) {
    return (
      <Card className="h-[450px]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Node Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[380px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Node Distribution by City
                <InfoTooltip term="regional_distribution" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {geoLoaded ? 'Real GeoIP locations' : 'Loading locations...'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchGeoData}
            disabled={isLoadingGeo}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGeo ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building2 className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-muted-foreground">Cities</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.cities}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Globe2 className="h-3 w-3 text-purple-400" />
              <span className="text-xs text-muted-foreground">Countries</span>
            </div>
            <p className="text-xl font-bold text-purple-400">{stats.countries}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Server className="h-3 w-3 text-green-400" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
            <p className="text-xl font-bold text-green-400">{stats.onlineNodes}</p>
          </div>
        </div>

        {/* City List */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
          {isLoadingGeo ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading locations...</span>
            </div>
          ) : cityData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No location data available
            </div>
          ) : (
            cityData.slice(0, 15).map((city, index) => (
              <motion.div
                key={`${city.city}-${city.country}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                </div>

                {/* Flag (using country code) */}
                <div className="flex-shrink-0 text-2xl">
                  {getCountryFlag(city.countryCode)}
                </div>

                {/* City Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{city.city}</span>
                    <Badge variant="outline" className="text-xs">
                      {city.country}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
                    </span>
                  </div>
                </div>

                {/* Node Count */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3 text-muted-foreground" />
                    <span className="font-bold">{city.nodeCount}</span>
                  </div>
                  <span className="text-xs text-green-500">
                    {city.onlineCount} online
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex-shrink-0 w-16">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      style={{ width: `${(city.onlineCount / city.nodeCount) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Show more indicator */}
        {cityData.length > 15 && (
          <div className="text-center pt-3 border-t border-border/50 mt-3">
            <span className="text-sm text-muted-foreground">
              +{cityData.length - 15} more cities
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Convert country code to flag emoji
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'XX') return '🌍';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
