import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Keyboard,
} from "react-native";
import LineChart, { LineChartPoint } from "./src/components/LineChart";
import WeatherCompositeChart, {
  WeatherCompositeDatum,
} from "./src/components/WeatherCompositeChart";
import { Location, searchLocations } from "./src/services/openMeteo";
import { useWeather } from "./src/hooks/useWeather";
import { formatWeatherCode } from "./src/utils/weatherCodes";

function formatTemperature(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)}°C`;
}

function formatPercentage(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return `${Math.round(value)}%`;
}

function formatMillimetres(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)} mm`;
}

function formatCentimetres(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)} cm`;
}

function formatSpeed(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)} km/h`;
}

function averageArray(values: number[]) {
  if (!values.length) {
    return 0;
  }
  const total = values.reduce((sum, val) => sum + val, 0);
  return total / values.length;
}

function sumArray(values: number[]) {
  return values.reduce((sum, val) => sum + val, 0);
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function averageDirection(values: number[]) {
  if (!values.length) {
    return undefined;
  }

  let x = 0;
  let y = 0;

  values.forEach((value) => {
    const radians = (value * Math.PI) / 180;
    x += Math.cos(radians);
    y += Math.sin(radians);
  });

  const average = Math.atan2(y / values.length, x / values.length);
  const degrees = (average * 180) / Math.PI;
  return (degrees + 360) % 360;
}

function formatDirection(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(value / 45) % directions.length;
  return `${directions[index]} (${Math.round(value)}°)`;
}

function formatAQI(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  const aqi = Math.round(value);
  if (aqi <= 20) {
    return `${aqi} (Good)`;
  }
  if (aqi <= 40) {
    return `${aqi} (Fair)`;
  }
  if (aqi <= 60) {
    return `${aqi} (Moderate)`;
  }
  if (aqi <= 80) {
    return `${aqi} (Poor)`;
  }
  if (aqi <= 100) {
    return `${aqi} (Very Poor)`;
  }
  return `${aqi} (Extremely Poor)`;
}

function getAQIColor(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "#8e8e93";
  }

  const aqi = Math.round(value);
  if (aqi <= 20) {
    return "#74c476"; // Good - soft green
  }
  if (aqi <= 40) {
    return "#41ab5d"; // Fair - deeper green
  }
  if (aqi <= 60) {
    return "#ffd54f"; // Moderate - warm yellow
  }
  if (aqi <= 80) {
    return "#ffb74d"; // Poor - gentle orange
  }
  if (aqi <= 100) {
    return "#ff7043"; // Very Poor - coral red
  }
  return "#d32f2f"; // Extremely Poor - crimson
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const HOURLY_TABS = [
  { key: "summary", label: "Summary" },
  { key: "weather", label: "Weather" },
] as const;

type HourlyTabKey = (typeof HOURLY_TABS)[number]["key"];

type HourlyPoint = {
  time: Date;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  precipitation_probability: number;
  rain: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  showers: number;
  snowfall: number;
  european_aqi?: number;
};

type PrecipitationSource = {
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
};

type PrecipitationTypeConfig = {
  key: "rain" | "showers" | "snowfall";
  label: string;
  color: string;
  accessor: (source: PrecipitationSource) => number;
  formatter: (value: number) => string;
};

const PRECIP_TYPE_CONFIG: PrecipitationTypeConfig[] = [
  {
    key: "rain",
    label: "Rain",
    color: "#0a84ff",
    accessor: (source) => source.rain,
    formatter: formatMillimetres,
  },
  {
    key: "showers",
    label: "Showers",
    color: "#5ac8fa",
    accessor: (source) => source.showers,
    formatter: formatMillimetres,
  },
  {
    key: "snowfall",
    label: "Snow",
    color: "#bf5af2",
    accessor: (source) => source.snowfall,
    formatter: formatCentimetres,
  },
] as const;

const PRECIP_MIXED_TYPE = {
  key: "mixed",
  label: "Mixed",
  color: "#ffd60a",
} as const;

const PRECIP_DRY_TYPE = {
  key: "dry",
  label: "No precip.",
  color: "#8e8e93",
} as const;

export type ResolvedPrecipitationType = {
  key: string;
  label: string;
  color: string;
  amount: number;
};

function resolvePrecipitationType(
  source: PrecipitationSource
): ResolvedPrecipitationType {
  let resolved: ResolvedPrecipitationType = {
    ...PRECIP_DRY_TYPE,
    amount: 0,
  };

  PRECIP_TYPE_CONFIG.forEach((type) => {
    const value = type.accessor(source);
    if (value > resolved.amount) {
      resolved = {
        key: type.key,
        label: type.label,
        color: type.color,
        amount: value,
      };
    }
  });

  if (resolved.amount > 0) {
    return resolved;
  }

  if (source.precipitation > 0) {
    return {
      ...PRECIP_MIXED_TYPE,
      amount: source.precipitation,
    };
  }

  return resolved;
}

type HourlyDay = {
  key: string;
  label: string;
  subtitle: string;
  points: HourlyPoint[];
};

type ChartSummary = {
  label: string;
  value: string;
};

type ChartLegendItem = {
  label: string;
  color: string;
  description?: string;
};

type ChartSeries = {
  points: LineChartPoint[];
  formatter: (value: number) => string;
  summaries: ChartSummary[];
  color: string;
  showDots: boolean;
  secondaryColor?: string;
  showSecondary?: boolean;
  legend?: ChartLegendItem[];
  variant?: "line" | "bar";
  overlayValues?: number[];
  overlayColor?: string;
  overlayScale?: "primary" | "percentage";
};

type MinutelyInsights = {
  points: LineChartPoint[];
  nextEvent?: {
    minutes: number;
    label: string;
  };
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === "dark";
  const { data, loading, error, refresh, location, setLocation } = useWeather();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [searchError, setSearchError] = useState<string>();
  const [activeHourlyTab, setActiveHourlyTab] =
    useState<HourlyTabKey>("summary");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const lastSearchQueryRef = useRef("");

  const performSearch = useCallback(async (term: string, force = false) => {
    const normalized = term.trim();
    if (!normalized) {
      setSearchResults([]);
      setSearchError(undefined);
      lastSearchQueryRef.current = "";
      return;
    }

    if (!force && normalized === lastSearchQueryRef.current) {
      return;
    }

    lastSearchQueryRef.current = normalized;
    setSearching(true);
    setSearchError(undefined);

    try {
      const results = await searchLocations(normalized);
      setSearchResults(results);

      if (!results.length) {
        setSearchError("No matching locations found");
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Failed to search locations"
      );
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError("Enter a city name to search");
      return;
    }
    performSearch(query, true);
  }, [performSearch, query]);

  const handleLocationSelect = useCallback(
    (candidate: Location) => {
      setQuery(candidate.name);
      Keyboard.dismiss();
      setLocation(candidate);
      setSearchResults([]);
      setSearchError(undefined);
      lastSearchQueryRef.current = candidate.name.trim();
    },
    [setLocation, setQuery]
  );

  const handleClearLocation = useCallback(() => {
    setLocation(undefined);
  }, [setLocation]);

  useEffect(() => {
    setSelectedDayIndex(0);
  }, [location?.id]);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) {
      setSearchResults([]);
      setSearchError(undefined);
      lastSearchQueryRef.current = "";
      return;
    }

    const timeout = setTimeout(() => {
      performSearch(normalized);
    }, 400);

    return () => clearTimeout(timeout);
  }, [performSearch, query]);

  const backgroundStyle = isDarkMode ? styles.containerDark : styles.container;
  const currentLocationLabel = useMemo(() => {
    if (!location) {
      return "Choose a location to see the forecast";
    }

    return [location.name, location.admin1, location.country]
      .filter(Boolean)
      .join(", ");
  }, [location]);

  const hourlyDays: HourlyDay[] = useMemo(() => {
    if (!data) {
      return [];
    }

    const groups = new Map<string, HourlyPoint[]>();
    const order: string[] = [];
    // Use the current time from weather data for accurate filtering
    const currentTime = data.current.time;
    const currentDayKey = dayKey(currentTime);

    data.hourly.time.forEach((time, index) => {
      const key = dayKey(time);
      if (!groups.has(key)) {
        groups.set(key, []);
        order.push(key);
      }
      groups.get(key)?.push({
        time,
        temperature_2m: data.hourly.temperature_2m[index],
        apparent_temperature: data.hourly.apparent_temperature[index],
        relative_humidity_2m: data.hourly.relative_humidity_2m[index],
        precipitation: data.hourly.precipitation[index],
        precipitation_probability: data.hourly.precipitation_probability[index],
        rain: data.hourly.rain[index],
        wind_speed_10m: data.hourly.wind_speed_10m[index],
        wind_direction_10m: data.hourly.wind_direction_10m[index],
        weather_code: data.hourly.weather_code[index],
        showers: data.hourly.showers[index],
        snowfall: data.hourly.snowfall[index],
        european_aqi: data.hourly.european_aqi?.[index],
      });
    });

    return order.map((key) => {
      let points = groups.get(key) ?? [];

      // For the current day, filter to only show from current hour onwards
      if (key === currentDayKey) {
        points = points.filter((point) => point.time >= currentTime);
      }

      const sample = points[0];
      const label = sample
        ? sample.time.toLocaleDateString(undefined, {
            weekday: "short",
          })
        : key;
      const subtitle = sample
        ? sample.time.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : "";
      return {
        key,
        label,
        subtitle,
        points,
      };
    });
  }, [data]);

  const activeDay = hourlyDays[selectedDayIndex];
  const canRefresh = Boolean(location);

  const chartSeries: ChartSeries = useMemo(() => {
    const emptySeries: ChartSeries = {
      points: [],
      formatter: (value) => value.toFixed(1),
      summaries: [],
      color: "#0a84ff",
      showDots: false,
      showSecondary: false,
    };

    if (!activeDay || activeHourlyTab !== "summary") {
      return emptySeries;
    }

    const temperatures = activeDay.points.map((point) => point.temperature_2m);
    const feelsLike = activeDay.points.map(
      (point) => point.apparent_temperature
    );
    const humidity = activeDay.points.map(
      (point) => point.relative_humidity_2m
    );
    const precipitation = activeDay.points.map((point) => point.precipitation);
    const rain = activeDay.points.map((point) => point.rain);
    const showers = activeDay.points.map((point) => point.showers);
    const snowfall = activeDay.points.map((point) => point.snowfall);
    const windSpeeds = activeDay.points.map((point) => point.wind_speed_10m);
    const precipProb = activeDay.points.map(
      (point) => point.precipitation_probability
    );

    const tempMin = Math.min(...temperatures);
    const tempMax = Math.max(...temperatures);
    const tempAvg = averageArray(temperatures);
    const feelsLikeAvg = averageArray(feelsLike);
    const humidityAvg = averageArray(humidity);
    const totalPrecip = sumArray(precipitation);
    const totalRain = sumArray(rain);
    const totalShowers = sumArray(showers);
    const totalSnow = sumArray(snowfall);
    const maxRain = Math.max(...rain);
    const avgWind = averageArray(windSpeeds);
    const maxWind = Math.max(...windSpeeds);
    const maxPrecipProb = Math.max(...precipProb);
    const avgDirection = averageDirection(
      activeDay.points.map((point) => point.wind_direction_10m)
    );
    const weatherCodes = activeDay.points.map((point) => point.weather_code);
    const codeCounts = new Map<number, number>();
    weatherCodes.forEach((code) => {
      codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
    });
    let mostCommonCode = weatherCodes[0];
    let maxCount = 0;
    codeCounts.forEach((count, code) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCode = code;
      }
    });

    const summaries: ChartSummary[] = [
      { label: "Weather", value: formatWeatherCode(mostCommonCode) },
      { label: "Temp min", value: formatTemperature(tempMin) },
      { label: "Temp max", value: formatTemperature(tempMax) },
      { label: "Temp avg", value: formatTemperature(tempAvg) },
      { label: "Feels like avg", value: formatTemperature(feelsLikeAvg) },
      { label: "Humidity avg", value: formatPercentage(humidityAvg) },
      { label: "Total precip.", value: formatMillimetres(totalPrecip) },
      { label: "Total rain", value: formatMillimetres(totalRain) },
      { label: "Peak rain", value: formatMillimetres(maxRain) },
      { label: "Max rain prob.", value: formatPercentage(maxPrecipProb) },
      { label: "Wind avg", value: formatSpeed(avgWind) },
      { label: "Wind max", value: formatSpeed(maxWind) },
      { label: "Wind direction", value: formatDirection(avgDirection) },
    ];

    if (totalShowers > 0) {
      summaries.splice(8, 0, {
        label: "Total showers",
        value: formatMillimetres(totalShowers),
      });
    }

    if (totalSnow > 0) {
      summaries.splice(9, 0, {
        label: "Total snow",
        value: formatCentimetres(totalSnow),
      });
    }

    return {
      ...emptySeries,
      summaries,
    };
  }, [activeDay, activeHourlyTab]);

  const weatherChartData: WeatherCompositeDatum[] = useMemo(() => {
    if (!activeDay) {
      return [];
    }

    return activeDay.points.map((point) => {
      const weatherLabel = formatWeatherCode(point.weather_code);
      const weatherIcon = weatherLabel.split(" ")[0] ?? "•";
      const aqiValue = point.european_aqi;
      const aqiLabel = aqiValue != null ? formatAQI(aqiValue) : undefined;
      const aqiColor = aqiValue != null ? getAQIColor(aqiValue) : undefined;
      return {
        label: formatTimeLabel(point.time),
        temperature: point.temperature_2m,
        apparent: point.apparent_temperature,
        precipitation: point.precipitation,
        precipType: resolvePrecipitationType({
          precipitation: point.precipitation,
          rain: point.rain,
          showers: point.showers,
          snowfall: point.snowfall,
        }),
        probability: point.precipitation_probability,
        windSpeed: point.wind_speed_10m,
        aqi: aqiValue ?? undefined,
        aqiLabel,
        aqiColor,
        weatherIcon,
      };
    });
  }, [activeDay]);

  const weatherSummaries: ChartSummary[] = useMemo(() => {
    if (!activeDay) {
      return [];
    }

    const temps = activeDay.points.map((point) => point.temperature_2m);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const totalPrecip = sumArray(
      activeDay.points.map((point) => point.precipitation)
    );
    const maxProbability = Math.max(
      ...activeDay.points.map((point) => point.precipitation_probability)
    );
    const windSpeeds = activeDay.points.map((point) => point.wind_speed_10m);
    const avgWind = averageArray(windSpeeds);
    const maxWind = Math.max(...windSpeeds);

    return [
      {
        label: "Temp range",
        value: `${formatTemperature(minTemp)} – ${formatTemperature(maxTemp)}`,
      },
      {
        label: "Total precip.",
        value: formatMillimetres(totalPrecip),
      },
      {
        label: "Max precip prob.",
        value: formatPercentage(maxProbability),
      },
      { label: "Wind avg", value: formatSpeed(avgWind) },
      { label: "Wind max", value: formatSpeed(maxWind) },
    ];
  }, [activeDay]);

  const rawMinutelyInsights = useMemo<MinutelyInsights | null>(() => {
    if (!data?.minutely15 || !data.minutely15.time.length) {
      return null;
    }

    const now = Date.now();
    const maxMinutes = 60;
    const sliceCount = Math.min(
      data.minutely15.time.length,
      Math.ceil(maxMinutes / 15)
    );

    const points: LineChartPoint[] = [];
    let nextEvent: MinutelyInsights["nextEvent"];

    for (let i = 0; i < sliceCount; i += 1) {
      const time = data.minutely15.time[i];
      const precip = data.minutely15.precipitation[i];
      const rain = data.minutely15.rain[i];
      const snow = data.minutely15.snowfall[i];

      points.push({
        label: time.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        value: precip,
      });

      if (!nextEvent && precip > 0) {
        const minutesUntil = Math.max(
          0,
          Math.round((time.getTime() - now) / 60000)
        );
        if (minutesUntil <= maxMinutes) {
          nextEvent = {
            minutes: minutesUntil,
            label: snow > rain ? "Snow" : rain > 0 ? "Rain" : "Precipitation",
          };
        }
      }
    }

    return {
      points,
      nextEvent,
    };
  }, [data?.minutely15]);

  const minutelyInsights = useMemo<MinutelyInsights | null>(() => {
    if (!rawMinutelyInsights || !rawMinutelyInsights.points.length) {
      return null;
    }

    const hasRealPrecip = rawMinutelyInsights.points.some(
      (point) => point.value > 0
    );
    if (!hasRealPrecip) {
      return null;
    }

    return rawMinutelyInsights;
  }, [rawMinutelyInsights]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#000" : "#fff"}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, isDarkMode && styles.titleDark]}>
                MySky
              </Text>
              <Text
                style={[styles.subtitle, isDarkMode && styles.subtitleDark]}
              >
                {currentLocationLabel}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                !canRefresh && styles.refreshDisabled,
              ]}
              onPress={refresh}
              disabled={!canRefresh}
            >
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode && styles.sectionTitleDark,
              ]}
            >
              Search a city
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Enter city or region"
                placeholderTextColor={isDarkMode ? "#8e8e93" : "#8e8e93"}
                style={[
                  styles.searchInput,
                  isDarkMode && styles.searchInputDark,
                ]}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={searching}
              >
                <Text style={styles.searchButtonText}>
                  {searching ? "Searching…" : "Search"}
                </Text>
              </TouchableOpacity>
            </View>
            {searchError && (
              <Text style={[styles.errorText, styles.errorHint]}>
                {searchError}
              </Text>
            )}
            <View style={styles.resultList}>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.searchResult}
                  onPress={() => handleLocationSelect(result)}
                >
                  <Text
                    style={[
                      styles.resultName,
                      isDarkMode && styles.resultNameDark,
                    ]}
                  >
                    {result.name}
                  </Text>
                  <Text
                    style={[
                      styles.resultMeta,
                      isDarkMode && styles.resultMetaDark,
                    ]}
                  >
                    {[result.admin1, result.country].filter(Boolean).join(", ")}
                  </Text>
                </TouchableOpacity>
              ))}
              {!!searchResults.length && <View style={styles.resultDivider} />}
              {searching && (
                <View style={styles.searchingRow}>
                  <ActivityIndicator size="small" color="#0a84ff" />
                  <Text
                    style={[
                      styles.body,
                      isDarkMode && styles.bodyDark,
                      styles.gapLeft,
                    ]}
                  >
                    Looking for locations…
                  </Text>
                </View>
              )}
            </View>
            {location && (
              <TouchableOpacity
                style={styles.clearSelection}
                onPress={handleClearLocation}
              >
                <Text style={styles.clearSelectionText}>
                  Clear selected location
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            {!location && (
              <View style={styles.center}>
                <Text style={[styles.body, isDarkMode && styles.bodyDark]}>
                  Search for a city to load the forecast.
                </Text>
              </View>
            )}

            {location && loading && (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#0a84ff" />
                <Text style={[styles.body, isDarkMode && styles.bodyDark]}>
                  Loading…
                </Text>
              </View>
            )}

            {location && !loading && error && (
              <View style={styles.center}>
                <Text style={[styles.body, styles.errorText]}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}

            {location && !loading && data && (
              <View style={styles.contentSpacing}>
                {minutelyInsights && (
                  <View style={styles.minutelyCard}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        isDarkMode && styles.sectionTitleDark,
                      ]}
                    >
                      Next-hour precipitation
                    </Text>
                    <Text
                      style={[
                        styles.minutelyStatus,
                        isDarkMode && styles.minutelyStatusDark,
                      ]}
                    >
                      {minutelyInsights.nextEvent
                        ? `${minutelyInsights.nextEvent.label} expected in ${minutelyInsights.nextEvent.minutes} min`
                        : "No precipitation expected in the next hour"}
                    </Text>
                    {minutelyInsights.points.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        <LineChart
                          points={minutelyInsights.points}
                          color="#0a84ff"
                          showDots={false}
                          isDarkMode={isDarkMode}
                          valueFormatter={formatMillimetres}
                          variant="bar"
                        />
                      </ScrollView>
                    )}
                  </View>
                )}

                <View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}
                  >
                    Current conditions
                  </Text>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}
                    >
                      Temperature
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}
                    >
                      {formatTemperature(data.current.temperature_2m)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}
                    >
                      Feels like
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}
                    >
                      {formatTemperature(data.current.apparent_temperature)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}
                    >
                      Humidity
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}
                    >
                      {formatPercentage(data.current.relative_humidity_2m)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}
                    >
                      Weather
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}
                    >
                      {formatWeatherCode(data.current.weather_code)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}
                    >
                      Cloud cover
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}
                    >
                      {formatPercentage(data.current.cloud_cover)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}
                    >
                      Wind
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}
                    >
                      {`${formatSpeed(
                        data.current.wind_speed_10m
                      )} · ${formatDirection(data.current.wind_direction_10m)}`}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}
                    >
                      Precipitation
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}
                    >
                      {formatMillimetres(data.current.precipitation)}
                    </Text>
                  </View>
                  {PRECIP_TYPE_CONFIG.map((type) => {
                    const amount = type.accessor(data.current);
                    if (type.key !== "rain" && amount <= 0) {
                      return null;
                    }
                    return (
                      <View key={`current-${type.key}`} style={styles.row}>
                        <Text
                          style={[styles.label, isDarkMode && styles.labelDark]}
                        >
                          {type.label}
                        </Text>
                        <Text
                          style={[
                            styles.value,
                            isDarkMode && styles.valueDark,
                            { color: type.color },
                          ]}
                        >
                          {type.formatter(amount)}
                        </Text>
                      </View>
                    );
                  })}
                  {data.current.european_aqi != null && (
                    <View style={styles.row}>
                      <Text
                        style={[styles.label, isDarkMode && styles.labelDark]}
                      >
                        Air Quality
                      </Text>
                      <Text
                        style={[
                          styles.value,
                          isDarkMode && styles.valueDark,
                          { color: getAQIColor(data.current.european_aqi) },
                        ]}
                      >
                        {formatAQI(data.current.european_aqi)}
                      </Text>
                    </View>
                  )}
                </View>

                <View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}
                  >
                    Hourly forecast
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.daySelectorContent}
                  >
                    {hourlyDays.map((day, index) => {
                      const selected = index === selectedDayIndex;
                      return (
                        <TouchableOpacity
                          key={day.key}
                          style={[
                            styles.dayChip,
                            selected && styles.dayChipActive,
                          ]}
                          onPress={() => setSelectedDayIndex(index)}
                        >
                          <Text
                            style={[
                              styles.dayChipLabel,
                              selected && styles.dayChipLabelActive,
                            ]}
                          >
                            {day.label}
                          </Text>
                          <Text
                            style={[
                              styles.dayChipMeta,
                              selected && styles.dayChipMetaActive,
                            ]}
                          >
                            {day.subtitle}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View
                    style={[styles.tabRow, isDarkMode && styles.tabRowDark]}
                  >
                    {HOURLY_TABS.map((tab) => {
                      const selected = activeHourlyTab === tab.key;
                      return (
                        <TouchableOpacity
                          key={tab.key}
                          style={[
                            styles.tabButton,
                            selected && styles.tabButtonActive,
                          ]}
                          onPress={() => setActiveHourlyTab(tab.key)}
                        >
                          <Text
                            style={[
                              styles.tabButtonText,
                              isDarkMode && styles.tabButtonTextDark,
                              selected && styles.tabButtonTextActive,
                            ]}
                          >
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {activeHourlyTab === "summary" ? (
                    chartSeries.summaries.length > 0 ? (
                      <View style={styles.summaryRow}>
                        {chartSeries.summaries.map((item) => (
                          <View
                            key={item.label}
                            style={[
                              styles.summaryCard,
                              isDarkMode && styles.summaryCardDark,
                            ]}
                          >
                            <Text
                              style={[
                                styles.summaryLabel,
                                isDarkMode && styles.summaryLabelDark,
                              ]}
                            >
                              {item.label}
                            </Text>
                            <Text
                              style={[
                                styles.summaryValue,
                                isDarkMode && styles.summaryValueDark,
                              ]}
                            >
                              {item.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.center}>
                        <Text
                          style={[styles.body, isDarkMode && styles.bodyDark]}
                        >
                          Not enough hourly data.
                        </Text>
                      </View>
                    )
                  ) : weatherChartData.length ? (
                    <View style={styles.chartSection}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        <WeatherCompositeChart
                          data={weatherChartData}
                          isDarkMode={isDarkMode}
                        />
                      </ScrollView>
                      {weatherSummaries.length > 0 && (
                        <View style={styles.summaryRow}>
                          {weatherSummaries.map((item) => (
                            <View
                              key={item.label}
                              style={[
                                styles.summaryCard,
                                isDarkMode && styles.summaryCardDark,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.summaryLabel,
                                  isDarkMode && styles.summaryLabelDark,
                                ]}
                              >
                                {item.label}
                              </Text>
                              <Text
                                style={[
                                  styles.summaryValue,
                                  isDarkMode && styles.summaryValueDark,
                                ]}
                              >
                                {item.value}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.center}>
                      <Text
                        style={[styles.body, isDarkMode && styles.bodyDark]}
                      >
                        Not enough hourly data.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
          <Text style={[styles.footer, isDarkMode && styles.footerDark]}>
            Powered by Open-Meteo. Search stays on-device—no analytics, no
            tracking.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  containerDark: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flexShrink: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },
  titleDark: {
    color: "#fff",
  },
  subtitle: {
    color: "#3a3a3c",
    marginTop: 4,
  },
  subtitleDark: {
    color: "#d1d1d6",
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0a84ff",
    borderRadius: 8,
  },
  refreshDisabled: {
    opacity: 0.4,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "600",
  },
  card: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#121212",
    shadowOpacity: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  sectionTitleDark: {
    color: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f2f2f7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111",
  },
  searchInputDark: {
    backgroundColor: "#1c1c1e",
    color: "#fff",
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0a84ff",
    borderRadius: 10,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  resultList: {
    borderRadius: 12,
    backgroundColor: "rgba(60,60,67,0.05)",
    padding: 8,
    gap: 8,
  },
  searchResult: {
    paddingVertical: 6,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  resultNameDark: {
    color: "#fff",
  },
  resultMeta: {
    color: "#3a3a3c",
  },
  resultMetaDark: {
    color: "#d1d1d6",
  },
  resultDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#d1d1d6",
  },
  searchingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  clearSelection: {
    marginTop: 12,
    alignItems: "flex-start",
  },
  clearSelectionText: {
    color: "#0a84ff",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  label: {
    fontSize: 16,
    color: "#3a3a3c",
  },
  labelDark: {
    color: "#d1d1d6",
  },
  value: {
    fontSize: 16,
    color: "#111",
    fontWeight: "600",
  },
  valueDark: {
    color: "#fff",
  },
  body: {
    color: "#111",
  },
  bodyDark: {
    color: "#fff",
  },
  errorText: {
    color: "#ff453a",
  },
  errorHint: {
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff453a",
  },
  retryText: {
    color: "#ff453a",
    fontWeight: "600",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    minHeight: 120,
  },
  contentSpacing: {
    gap: 24,
  },
  minutelyCard: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  minutelyStatus: {
    fontSize: 14,
    color: "#3a3a3c",
    marginBottom: 8,
  },
  minutelyStatusDark: {
    color: "#d1d1d6",
  },
  daySelectorContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#f2f2f7",
    minWidth: 90,
  },
  dayChipActive: {
    backgroundColor: "#0a84ff",
  },
  dayChipLabel: {
    color: "#3a3a3c",
    fontWeight: "600",
  },
  dayChipLabelActive: {
    color: "#fff",
  },
  dayChipMeta: {
    color: "#636366",
    fontSize: 12,
  },
  dayChipMetaActive: {
    color: "#e5f1ff",
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    backgroundColor: "rgba(60,60,67,0.1)",
    padding: 4,
    marginTop: 12,
    marginBottom: 12,
    gap: 4,
  },
  tabRowDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#0a84ff",
  },
  tabButtonText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 10,
  },
  tabButtonTextDark: {
    color: "#d1d1d6",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  chartSection: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 110,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f2f2f7",
  },
  summaryCardDark: {
    backgroundColor: "#1c1c1e",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#636366",
    marginBottom: 4,
  },
  summaryLabelDark: {
    color: "#d1d1d6",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  summaryValueDark: {
    color: "#fff",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendTextGroup: {
    flexDirection: "column",
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1c1c1e",
  },
  legendLabelDark: {
    color: "#f2f2f7",
  },
  legendDescription: {
    fontSize: 11,
    color: "#3a3a3c",
  },
  legendDescriptionDark: {
    color: "#d1d1d6",
  },
  dailyScroll: {
    paddingVertical: 8,
  },
  dailyCard: {
    width: 260,
    marginRight: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f2f2f7",
    gap: 8,
  },
  dailyCardDark: {
    backgroundColor: "#1c1c1e",
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  dailyTitleDark: {
    color: "#fff",
  },
  dailyTemp: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  dailyTempDark: {
    color: "#fff",
  },
  dailyRowDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dailyLabel: {
    color: "#3a3a3c",
  },
  dailyValue: {
    color: "#111",
    fontWeight: "600",
  },
  gapLeft: {
    marginLeft: 8,
  },
  footer: {
    textAlign: "center",
    color: "#3a3a3c",
    marginBottom: 16,
  },
  footerDark: {
    color: "#d1d1d6",
  },
});

export default App;
