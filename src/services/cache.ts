import {WeatherData} from './openMeteo';

type CacheEntry = {
  data: WeatherData;
  timestamp: number;
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, CacheEntry>();

export function getCachedWeather(locationId: string): WeatherData | undefined {
  const entry = cache.get(locationId);
  if (!entry) {
    return undefined;
  }

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(locationId);
    return undefined;
  }

  return entry.data;
}

export function setCachedWeather(locationId: string, data: WeatherData): void {
  cache.set(locationId, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCache(): void {
  cache.clear();
}

export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}
