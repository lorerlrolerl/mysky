import { useCallback, useEffect, useRef, useState } from "react";
import { getCachedWeather, setCachedWeather } from "../services/cache";
import { fetchWeather, Location, WeatherData } from "../services/openMeteo";

export type WeatherState = {
  data?: WeatherData;
  loading: boolean;
  error?: string;
  refresh: () => void;
  setLocation: (location: Location | undefined) => void;
  location?: Location;
};

export function useWeather(initialLocation?: Location): WeatherState {
  const [location, setLocationState] = useState<Location | undefined>(
    initialLocation
  );
  const [data, setData] = useState<WeatherData>();
  const [loading, setLoading] = useState<boolean>(Boolean(initialLocation));
  const [error, setError] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!location) {
      setData(undefined);
      setLoading(false);
      setError(undefined);
      return;
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cached = getCachedWeather(location.id);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await fetchWeather(location);
      if (!abortController.signal.aborted) {
        setCachedWeather(location.id, result);
        setData(result);
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [location]);

  useEffect(() => {
    load();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [load]);

  const setLocation = useCallback((next: Location | undefined) => {
    // Cleanup previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setLocationState(next);
    if (next) {
      setLoading(true);
    } else {
      setData(undefined);
      setLoading(false);
      setError(undefined);
    }
  }, []);

  return {
    data,
    loading,
    error,
    refresh: load,
    setLocation,
    location,
  };
}
