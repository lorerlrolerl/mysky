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
    temperature: number;
    relativeHumidity: number;
    apparentTemperature: number;
    precipitation: number;
    rain: number;
    weatherCode: number;
    cloudCover: number;
    windSpeed: number;
    windDirection: number;
    showers: number;
    snowfall: number;
  };
  hourly: {
    time: Date[];
    temperature: Float64Array;
    relativeHumidity: Float64Array;
    apparentTemperature: Float64Array;
    precipitationProbability: Float64Array;
    weatherCode: Float64Array;
    visibility: Float64Array;
    windSpeed: Float64Array;
    windDirection: Float64Array;
    uvIndex: Float64Array;
    precipitation: Float64Array;
    rain: Float64Array;
    showers: Float64Array;
    snowfall: Float64Array;
    snowDepth: Float64Array;
  };
  daily: {
    time: Date[];
    weatherCode: Float64Array;
    temperatureMax: Float64Array;
    temperatureMin: Float64Array;
    rainSum: Float64Array;
    windSpeedMax: Float64Array;
    precipitationProbabilityMax: Float64Array;
    showersSum: Float64Array;
    snowfallSum: Float64Array;
    precipitationSum: Float64Array;
    precipitationHours: Float64Array;
    uvIndexMax: Float64Array;
  };
};

const currentVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "rain",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "showers",
  "snowfall",
] as const;

const hourlyVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation_probability",
  "weather_code",
  "visibility",
  "wind_speed_10m",
  "wind_direction_10m",
  "uv_index",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "snow_depth",
] as const;

const dailyVariables = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "rain_sum",
  "wind_speed_10m_max",
  "precipitation_probability_max",
  "showers_sum",
  "snowfall_sum",
  "precipitation_sum",
  "precipitation_hours",
  "uv_index_max",
] as const;

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

  return {
    current: {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      temperature: current.variables(0)!.value(),
      relativeHumidity: current.variables(1)!.value(),
      apparentTemperature: current.variables(2)!.value(),
      precipitation: current.variables(3)!.value(),
      rain: current.variables(4)!.value(),
      weatherCode: current.variables(5)!.value(),
      cloudCover: current.variables(6)!.value(),
      windSpeed: current.variables(7)!.value(),
      windDirection: current.variables(8)!.value(),
      showers: current.variables(9)!.value(),
      snowfall: current.variables(10)!.value(),
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
      temperature: hourly.variables(0)!.valuesArray(),
      relativeHumidity: hourly.variables(1)!.valuesArray(),
      apparentTemperature: hourly.variables(2)!.valuesArray(),
      precipitationProbability: hourly.variables(3)!.valuesArray(),
      weatherCode: hourly.variables(4)!.valuesArray(),
      visibility: hourly.variables(5)!.valuesArray(),
      windSpeed: hourly.variables(6)!.valuesArray(),
      windDirection: hourly.variables(7)!.valuesArray(),
      uvIndex: hourly.variables(8)!.valuesArray(),
      precipitation: hourly.variables(9)!.valuesArray(),
      rain: hourly.variables(10)!.valuesArray(),
      showers: hourly.variables(11)!.valuesArray(),
      snowfall: hourly.variables(12)!.valuesArray(),
      snowDepth: hourly.variables(13)!.valuesArray(),
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
      weatherCode: daily.variables(0)!.valuesArray(),
      temperatureMax: daily.variables(1)!.valuesArray(),
      temperatureMin: daily.variables(2)!.valuesArray(),
      rainSum: daily.variables(3)!.valuesArray(),
      windSpeedMax: daily.variables(4)!.valuesArray(),
      precipitationProbabilityMax: daily.variables(5)!.valuesArray(),
      showersSum: daily.variables(6)!.valuesArray(),
      snowfallSum: daily.variables(7)!.valuesArray(),
      precipitationSum: daily.variables(8)!.valuesArray(),
      precipitationHours: daily.variables(9)!.valuesArray(),
      uvIndexMax: daily.variables(10)!.valuesArray(),
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
