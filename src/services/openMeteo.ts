import { fetchWeatherApi } from "openmeteo";

export type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  admin1?: string;
};

export type WeatherData = {
  current: {
    time: Date;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    european_aqi?: number;
  };
  hourly: {
    time: Date[];
    temperature_2m: Float64Array;
    relative_humidity_2m: Float64Array;
    apparent_temperature: Float64Array;
    precipitation_probability: Float64Array;
    weather_code: Float64Array;
    wind_speed_10m: Float64Array;
    cloud_cover: Float64Array;
    precipitation: Float64Array;
    rain: Float64Array;
    showers: Float64Array;
    snowfall: Float64Array;
    snow_depth: Float64Array;
    visibility: Float64Array;
    wind_gusts_10m: Float64Array;
    wind_direction_10m: Float64Array;
    european_aqi?: Float64Array;
  };
  daily: {
    time: Date[];
    weather_code: Float64Array;
    temperature_2m_max: Float64Array;
    temperature_2m_min: Float64Array;
    uv_index_max: Float64Array;
    wind_speed_10m_max: Float64Array;
    precipitation_sum: Float64Array;
    precipitation_hours: Float64Array;
    wind_direction_10m_dominant: Float64Array;
    wind_gusts_10m_max: Float64Array;
  };
};

const currentVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "wind_speed_10m",
  "wind_direction_10m",
  "precipitation",
  "weather_code",
  "cloud_cover",
] as const;

const hourlyVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
  "cloud_cover",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "snow_depth",
  "visibility",
  "wind_gusts_10m",
  "wind_direction_10m",
] as const;

const dailyVariables = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "uv_index_max",
  "wind_speed_10m_max",
  "precipitation_sum",
  "precipitation_hours",
  "wind_direction_10m_dominant",
  "wind_gusts_10m_max",
] as const;

export async function fetchAirQuality(
  location: Location
): Promise<{ current: number; hourly: Float64Array } | null> {
  try {
    const params = {
      latitude: location.latitude,
      longitude: location.longitude,
      hourly: "european_aqi",
      current: "european_aqi",
    };

    const url = "https://air-quality-api.open-meteo.com/v1/air-quality";
    const responses = await fetchWeatherApi(url, params);
    const response = responses[0];
    const utcOffsetSeconds = response.utcOffsetSeconds();

    const current = response.current()!;
    const hourly = response.hourly()!;

    const hourlyVar = hourly.variables(0);
    if (!hourlyVar) {
      return null;
    }
    const hourlyArray = hourlyVar.valuesArray();
    if (!hourlyArray) {
      return null;
    }
    // Convert to Float64Array if needed
    const hourlyFloat64 = hourlyArray instanceof Float64Array
      ? hourlyArray
      : new Float64Array(hourlyArray);

    return {
      current: current.variables(0)!.value(),
      hourly: hourlyFloat64,
    };
  } catch (error) {
    // Air quality data might not be available for all locations
    console.warn("Failed to fetch air quality data:", error);
    return null;
  }
}

export async function fetchWeather(location: Location): Promise<WeatherData> {
  const params = {
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    current: currentVariables,
    hourly: hourlyVariables,
    daily: dailyVariables,
  };

  // Open-Meteo API is public and free, no API key needed
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  const response = responses[0];
  const utcOffsetSeconds = response.utcOffsetSeconds();

  const current = response.current()!;
  const hourly = response.hourly()!;
  const daily = response.daily()!;

  // Fetch air quality data in parallel
  const airQuality = await fetchAirQuality(location);

  return {
    current: {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      temperature_2m: current.variables(0)!.value(),
      relative_humidity_2m: current.variables(1)!.value(),
      apparent_temperature: current.variables(2)!.value(),
      wind_speed_10m: current.variables(3)!.value(),
      wind_direction_10m: current.variables(4)!.value(),
      precipitation: current.variables(5)!.value(),
      weather_code: current.variables(6)!.value(),
      cloud_cover: current.variables(7)!.value(),
      european_aqi: airQuality?.current,
    },
    hourly: {
      time: Array.from(
        {
          length:
            (Number(hourly.timeEnd()) - Number(hourly.time())) /
            hourly.interval(),
        },
        (_, i) =>
          new Date(
            (Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) *
              1000
          )
      ),
      temperature_2m: hourly.variables(0)!.valuesArray(),
      relative_humidity_2m: hourly.variables(1)!.valuesArray(),
      apparent_temperature: hourly.variables(2)!.valuesArray(),
      precipitation_probability: hourly.variables(3)!.valuesArray(),
      weather_code: hourly.variables(4)!.valuesArray(),
      wind_speed_10m: hourly.variables(5)!.valuesArray(),
      cloud_cover: hourly.variables(6)!.valuesArray(),
      precipitation: hourly.variables(7)!.valuesArray(),
      rain: hourly.variables(8)!.valuesArray(),
      showers: hourly.variables(9)!.valuesArray(),
      snowfall: hourly.variables(10)!.valuesArray(),
      snow_depth: hourly.variables(11)!.valuesArray(),
      visibility: hourly.variables(12)!.valuesArray(),
      wind_gusts_10m: hourly.variables(13)!.valuesArray(),
      wind_direction_10m: hourly.variables(14)!.valuesArray(),
      european_aqi: airQuality?.hourly,
    },
    daily: {
      time: Array.from(
        {
          length:
            (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval(),
        },
        (_, i) =>
          new Date(
            (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) *
              1000
          )
      ),
      weather_code: daily.variables(0)!.valuesArray(),
      temperature_2m_max: daily.variables(1)!.valuesArray(),
      temperature_2m_min: daily.variables(2)!.valuesArray(),
      uv_index_max: daily.variables(3)!.valuesArray(),
      wind_speed_10m_max: daily.variables(4)!.valuesArray(),
      precipitation_sum: daily.variables(5)!.valuesArray(),
      precipitation_hours: daily.variables(6)!.valuesArray(),
      wind_direction_10m_dominant: daily.variables(7)!.valuesArray(),
      wind_gusts_10m_max: daily.variables(8)!.valuesArray(),
    },
  };
}

export async function searchLocations(query: string): Promise<Location[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: "5",
    format: "json",
    language: "en",
  });

  // Open-Meteo geocoding API (public, no API key needed)
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch locations");
  }

  const json = await response.json();
  if (!json?.results) {
    return [];
  }

  return json.results.map((item: any, index: number) => ({
    id: `${item.id ?? `${item.latitude}-${item.longitude}`}-${index}`,
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
    country: item.country,
    admin1: item.admin1,
  }));
}
