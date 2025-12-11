// GeoIP service using ip-api.com (free, no API key required)
// Rate limit: 45 requests per minute

interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
  timezone: string;
}

interface GeoCache {
  [ip: string]: {
    data: GeoLocation;
    timestamp: number;
  };
}

// In-memory cache (persists for session)
const geoCache: GeoCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Batch queue for rate limiting
let batchQueue: string[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_DELAY = 1500; // 1.5 seconds between batches
const MAX_BATCH_SIZE = 100; // ip-api.com allows up to 100 IPs per batch

export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  // Check cache first
  const cached = geoCache[ip];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName,country,countryCode,isp,timezone`);
    const data = await response.json();

    if (data.status === 'success') {
      const location: GeoLocation = {
        lat: data.lat,
        lng: data.lon,
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        isp: data.isp || 'Unknown',
        timezone: data.timezone || 'UTC',
      };

      // Cache the result
      geoCache[ip] = {
        data: location,
        timestamp: Date.now(),
      };

      return location;
    }
    return null;
  } catch (error) {
    console.error(`GeoIP lookup failed for ${ip}:`, error);
    return null;
  }
}

// Batch lookup for multiple IPs (more efficient)
export async function getGeoLocationBatch(ips: string[]): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();
  const uncachedIps: string[] = [];

  // Check cache first
  for (const ip of ips) {
    const cached = geoCache[ip];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(ip, cached.data);
    } else {
      uncachedIps.push(ip);
    }
  }

  // If all IPs are cached, return immediately
  if (uncachedIps.length === 0) {
    return results;
  }

  // Batch request for uncached IPs
  try {
    const batchSize = Math.min(uncachedIps.length, MAX_BATCH_SIZE);
    const batchIps = uncachedIps.slice(0, batchSize);

    const response = await fetch('http://ip-api.com/batch?fields=status,query,lat,lon,city,regionName,country,countryCode,isp,timezone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchIps),
    });

    const data = await response.json();

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.status === 'success') {
          const location: GeoLocation = {
            lat: item.lat,
            lng: item.lon,
            city: item.city || 'Unknown',
            region: item.regionName || 'Unknown',
            country: item.country || 'Unknown',
            countryCode: item.countryCode || 'XX',
            isp: item.isp || 'Unknown',
            timezone: item.timezone || 'UTC',
          };

          // Cache and add to results
          geoCache[item.query] = {
            data: location,
            timestamp: Date.now(),
          };
          results.set(item.query, location);
        }
      }
    }
  } catch (error) {
    console.error('Batch GeoIP lookup failed:', error);
  }

  return results;
}

// Get cached location or return estimated (fallback)
export function getCachedOrEstimatedLocation(ip: string): GeoLocation {
  const cached = geoCache[ip];
  if (cached) {
    return cached.data;
  }

  // Fallback: estimate from IP ranges (same as before but marked as estimated)
  return estimateLocationFromIP(ip);
}

// Fallback estimation (when API is unavailable)
function estimateLocationFromIP(ip: string): GeoLocation {
  const parts = ip.split('.').map(Number);
  const firstOctet = parts[0];
  const secondOctet = parts[1] || 0;
  const thirdOctet = parts[2] || 0;

  // Common IP ranges to regions (approximate)
  let lat = 39.8283;
  let lng = -98.5795;
  let country = 'United States';
  let region = 'Central';
  let city = 'Unknown';

  if (firstOctet >= 3 && firstOctet <= 56) {
    // North America
    lat = 37 + (secondOctet / 255) * 10;
    lng = -122 + (thirdOctet / 255) * 50;
    country = 'United States';
    region = 'West Coast';
  } else if (firstOctet >= 77 && firstOctet <= 95) {
    // Europe
    lat = 48 + (secondOctet / 255) * 10;
    lng = 2 + (thirdOctet / 255) * 20;
    country = 'Europe';
    region = 'Western Europe';
  } else if (firstOctet >= 96 && firstOctet <= 126) {
    // Asia Pacific
    lat = 35 + (secondOctet / 255) * 15;
    lng = 120 + (thirdOctet / 255) * 20;
    country = 'Asia';
    region = 'East Asia';
  } else if (firstOctet >= 177 && firstOctet <= 191) {
    // South America
    lat = -23 + (secondOctet / 255) * 10;
    lng = -46 + (thirdOctet / 255) * 20;
    country = 'Brazil';
    region = 'South America';
  } else if (firstOctet >= 192 && firstOctet <= 210) {
    // Oceania
    lat = -33 + (secondOctet / 255) * 5;
    lng = 151 + (thirdOctet / 255) * 10;
    country = 'Australia';
    region = 'Oceania';
  }

  return {
    lat,
    lng,
    city,
    region,
    country,
    countryCode: country === 'United States' ? 'US' : 'XX',
    isp: 'Unknown',
    timezone: 'UTC',
  };
}

// Export cache for persistence (can be saved to localStorage)
export function exportGeoCache(): string {
  return JSON.stringify(geoCache);
}

// Import cache from storage
export function importGeoCache(data: string): void {
  try {
    const imported = JSON.parse(data);
    Object.assign(geoCache, imported);
  } catch (error) {
    console.error('Failed to import geo cache:', error);
  }
}
