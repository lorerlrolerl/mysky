import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
} from 'react-native';
import LineChart, {LineChartPoint} from './src/components/LineChart';
import {Location, searchLocations} from './src/services/openMeteo';
import {useWeather} from './src/hooks/useWeather';

function formatTemperature(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)}°C`;
}

function formatPercentage(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return `${Math.round(value)}%`;
}

function formatMillimetres(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)} mm`;
}

function formatSpeed(value: number | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  const kmh = value * 3.6;
  return `${kmh.toFixed(1)} km/h`;
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function averageDirection(values: number[]) {
  if (!values.length) {
    return undefined;
  }

  let x = 0;
  let y = 0;

  values.forEach(value => {
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
    return '—';
  }

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(value / 45) % directions.length;
  return `${directions[index]} (${Math.round(value)}°)`;
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const HOURLY_TABS = [
  {key: 'summary', label: 'Summary'},
  {key: 'temperature', label: 'Temperature'},
  {key: 'precipitation', label: 'Rain'},
  {key: 'wind', label: 'Wind'},
] as const;

type HourlyTabKey = (typeof HOURLY_TABS)[number]['key'];

type HourlyPoint = {
  time: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  rain: number;
  windSpeed: number;
  windDirection: number;
};

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

type ChartSeries = {
  points: LineChartPoint[];
  formatter: (value: number) => string;
  summaries: ChartSummary[];
  color: string;
  showDots: boolean;
  secondaryColor?: string;
  showSecondary?: boolean;
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const {data, loading, error, refresh, location, setLocation} = useWeather();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [searchError, setSearchError] = useState<string>();
  const [activeHourlyTab, setActiveHourlyTab] =
    useState<HourlyTabKey>('summary');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError('Enter a city name to search');
      return;
    }

    setSearching(true);
    setSearchError(undefined);

    try {
      const results = await searchLocations(query);
      setSearchResults(results);

      if (!results.length) {
        setSearchError('No matching locations found');
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : 'Failed to search locations',
      );
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleLocationSelect = useCallback(
    (candidate: Location) => {
      setLocation(candidate);
      setSearchResults([]);
      setSearchError(undefined);
    },
    [setLocation],
  );

  const handleClearLocation = useCallback(() => {
    setLocation(undefined);
  }, [setLocation]);

  useEffect(() => {
    setSelectedDayIndex(0);
  }, [location?.id]);

  const backgroundStyle = isDarkMode ? styles.containerDark : styles.container;
  const currentLocationLabel = useMemo(() => {
    if (!location) {
      return 'Choose a location to see the forecast';
    }

    return [location.name, location.admin1, location.country]
      .filter(Boolean)
      .join(', ');
  }, [location]);

  const hourlyDays: HourlyDay[] = useMemo(() => {
    if (!data) {
      return [];
    }

    const groups = new Map<string, HourlyPoint[]>();
    const order: string[] = [];

    data.hourly.time.forEach((time, index) => {
      const key = dayKey(time);
      if (!groups.has(key)) {
        groups.set(key, []);
        order.push(key);
      }
      groups.get(key)?.push({
        time,
        temperature: data.hourly.temperature[index],
        feelsLike: data.hourly.apparentTemperature[index],
        humidity: data.hourly.relativeHumidity[index],
        precipitation: data.hourly.precipitation[index],
        precipitationProbability: data.hourly.precipitationProbability[index],
        rain: data.hourly.rain[index],
        windSpeed: data.hourly.windSpeed[index],
        windDirection: data.hourly.windDirection[index],
      });
    });

    return order.map(key => {
      const points = groups.get(key) ?? [];
      const sample = points[0];
      const label = sample
        ? sample.time.toLocaleDateString(undefined, {
            weekday: 'short',
          })
        : key;
      const subtitle = sample
        ? sample.time.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
        : '';
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

  const dailyCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.daily.time.map((time, index) => ({
      time,
      weatherCode: data.daily.weatherCode[index],
      tempMax: data.daily.temperatureMax[index],
      tempMin: data.daily.temperatureMin[index],
      rainSum: data.daily.rainSum[index],
      precipSum: data.daily.precipitationSum[index],
      precipHours: data.daily.precipitationHours[index],
      showersSum: data.daily.showersSum[index],
      snowfallSum: data.daily.snowfallSum[index],
      precipProbMax: data.daily.precipitationProbabilityMax[index],
      windMax: data.daily.windSpeedMax[index],
      uvMax: data.daily.uvIndexMax[index],
    }));
  }, [data]);

  const todayDaily = dailyCards[0];

  const chartSeries: ChartSeries = useMemo(() => {
    if (!activeDay) {
      return {
        points: [],
        formatter: value => value.toFixed(1),
        summaries: [],
        color: '#0a84ff',
        showDots: true,
        showSecondary: false,
      };
    }

    if (activeHourlyTab === 'summary') {
      const temperatures = activeDay.points.map(point => point.temperature);
      const feelsLike = activeDay.points.map(point => point.feelsLike);
      const humidity = activeDay.points.map(point => point.humidity);
      const precipitation = activeDay.points.map(point => point.precipitation);
      const rain = activeDay.points.map(point => point.rain);
      const windSpeeds = activeDay.points.map(point => point.windSpeed);
      const precipProb = activeDay.points.map(
        point => point.precipitationProbability,
      );

      const tempMin = Math.min(...temperatures);
      const tempMax = Math.max(...temperatures);
      const tempAvg = averageArray(temperatures);
      const feelsLikeAvg = averageArray(feelsLike);
      const humidityAvg = averageArray(humidity);
      const totalPrecip = sumArray(precipitation);
      const totalRain = sumArray(rain);
      const maxRain = Math.max(...rain);
      const avgWind = averageArray(windSpeeds);
      const maxWind = Math.max(...windSpeeds);
      const maxPrecipProb = Math.max(...precipProb);
      const avgDirection = averageDirection(
        activeDay.points.map(point => point.windDirection),
      );

      return {
        points: [],
        formatter: value => value.toFixed(1),
        summaries: [
          {label: 'Temp min', value: formatTemperature(tempMin)},
          {label: 'Temp max', value: formatTemperature(tempMax)},
          {label: 'Temp avg', value: formatTemperature(tempAvg)},
          {label: 'Feels like avg', value: formatTemperature(feelsLikeAvg)},
          {label: 'Humidity avg', value: formatPercentage(humidityAvg)},
          {label: 'Total precip.', value: formatMillimetres(totalPrecip)},
          {label: 'Total rain', value: formatMillimetres(totalRain)},
          {label: 'Peak rain', value: formatMillimetres(maxRain)},
          {label: 'Max rain prob.', value: formatPercentage(maxPrecipProb)},
          {label: 'Wind avg', value: formatSpeed(avgWind)},
          {label: 'Wind max', value: formatSpeed(maxWind)},
          {label: 'Wind direction', value: formatDirection(avgDirection)},
        ],
        color: '#0a84ff',
        showDots: false,
        showSecondary: false,
      };
    }

    if (activeHourlyTab === 'temperature') {
      const temperatures = activeDay.points.map(point => point.temperature);
      const min = Math.min(...temperatures);
      const max = Math.max(...temperatures);
      const average = averageArray(temperatures);

      return {
        points: activeDay.points.map(point => ({
          label: formatTimeLabel(point.time),
          value: point.temperature,
          secondary: point.feelsLike,
        })),
        formatter: value => formatTemperature(value),
        summaries: [
          {label: 'Min', value: formatTemperature(min)},
          {label: 'Avg', value: formatTemperature(average)},
          {label: 'Max', value: formatTemperature(max)},
        ],
        color: '#ff3b30',
        showDots: false,
        secondaryColor: '#ff9f0c',
        showSecondary: true,
      };
    }

    if (activeHourlyTab === 'precipitation') {
      const rainValues = activeDay.points.map(point => point.rain);
      const precipitationTotal = sumArray(
        activeDay.points.map(point => point.precipitation),
      );
      const maxRain = Math.max(...rainValues);
      const maxProbability = Math.max(
        ...activeDay.points.map(point => point.precipitationProbability),
      );

      return {
        points: activeDay.points.map(point => ({
          label: formatTimeLabel(point.time),
          value: point.rain,
        })),
        formatter: value => formatMillimetres(value),
        summaries: [
          {
            label: 'Total precip.',
            value: formatMillimetres(precipitationTotal),
          },
          {label: 'Peak rain', value: formatMillimetres(maxRain)},
          {
            label: 'Rain probability max',
            value: formatPercentage(maxProbability),
          },
        ],
        color: '#0a84ff',
        showDots: true,
        showSecondary: false,
      };
    }

    const windSpeedsMs = activeDay.points.map(point => point.windSpeed);
    const windSpeedsKm = windSpeedsMs.map(value => value * 3.6);
    const avgSpeedMs = averageArray(windSpeedsMs);
    const maxSpeedMs = Math.max(...windSpeedsMs);
    const avgDirection = averageDirection(
      activeDay.points.map(point => point.windDirection),
    );

    return {
      points: windSpeedsKm.map((value, index) => ({
        label: formatTimeLabel(activeDay.points[index].time),
        value,
      })),
      formatter: value => `${value.toFixed(1)} km/h`,
      summaries: [
        {label: 'Average speed', value: formatSpeed(avgSpeedMs)},
        {label: 'Max speed', value: formatSpeed(maxSpeedMs)},
        {label: 'Dominant direction', value: formatDirection(avgDirection)},
      ],
      color: '#34c759',
      showDots: true,
      showSecondary: false,
    };
  }, [activeDay, activeHourlyTab]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#fff'}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, isDarkMode && styles.titleDark]}>
                MySky
              </Text>
              <Text
                style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
                {currentLocationLabel}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                !canRefresh && styles.refreshDisabled,
              ]}
              onPress={refresh}
              disabled={!canRefresh}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode && styles.sectionTitleDark,
              ]}>
              Search a city
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Enter city or region"
                placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
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
                disabled={searching}>
                <Text style={styles.searchButtonText}>
                  {searching ? 'Searching…' : 'Search'}
                </Text>
              </TouchableOpacity>
            </View>
            {searchError && (
              <Text style={[styles.errorText, styles.errorHint]}>
                {searchError}
              </Text>
            )}
            <View style={styles.resultList}>
              {searchResults.map(result => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.searchResult}
                  onPress={() => handleLocationSelect(result)}>
                  <Text
                    style={[
                      styles.resultName,
                      isDarkMode && styles.resultNameDark,
                    ]}>
                    {result.name}
                  </Text>
                  <Text
                    style={[
                      styles.resultMeta,
                      isDarkMode && styles.resultMetaDark,
                    ]}>
                    {[result.admin1, result.country].filter(Boolean).join(', ')}
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
                    ]}>
                    Looking for locations…
                  </Text>
                </View>
              )}
            </View>
            {location && (
              <TouchableOpacity
                style={styles.clearSelection}
                onPress={handleClearLocation}>
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
                <View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}>
                    Current conditions
                  </Text>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}>
                      Temperature
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}>
                      {formatTemperature(data.current.temperature)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}>
                      Feels like
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}>
                      {formatTemperature(data.current.apparentTemperature)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}>
                      Humidity
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}>
                      {formatPercentage(data.current.relativeHumidity)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}>
                      Cloud cover
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}>
                      {formatPercentage(data.current.cloudCover)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}>
                      Wind
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}>
                      {`${formatSpeed(
                        data.current.windSpeed,
                      )} · ${formatDirection(data.current.windDirection)}`}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}>
                      Rain
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}>
                      {formatMillimetres(data.current.rain)}
                    </Text>
                  </View>
                  {todayDaily && (
                    <View style={styles.row}>
                      <Text
                        style={[styles.label, isDarkMode && styles.labelDark]}>
                        Rain probability
                      </Text>
                      <Text
                        style={[styles.value, isDarkMode && styles.valueDark]}>
                        {formatPercentage(todayDaily.precipProbMax)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, isDarkMode && styles.labelDark]}>
                      Showers / Snowfall
                    </Text>
                    <Text
                      style={[styles.value, isDarkMode && styles.valueDark]}>
                      {`${formatMillimetres(
                        data.current.showers,
                      )} • ${formatMillimetres(data.current.snowfall)}`}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}>
                    Hourly forecast
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.daySelectorContent}>
                    {hourlyDays.map((day, index) => {
                      const selected = index === selectedDayIndex;
                      return (
                        <TouchableOpacity
                          key={day.key}
                          style={[
                            styles.dayChip,
                            selected && styles.dayChipActive,
                          ]}
                          onPress={() => setSelectedDayIndex(index)}>
                          <Text
                            style={[
                              styles.dayChipLabel,
                              selected && styles.dayChipLabelActive,
                            ]}>
                            {day.label}
                          </Text>
                          <Text
                            style={[
                              styles.dayChipMeta,
                              selected && styles.dayChipMetaActive,
                            ]}>
                            {day.subtitle}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.tabRow}>
                    {HOURLY_TABS.map(tab => {
                      const selected = activeHourlyTab === tab.key;
                      return (
                        <TouchableOpacity
                          key={tab.key}
                          style={[
                            styles.tabButton,
                            selected && styles.tabButtonActive,
                          ]}
                          onPress={() => setActiveHourlyTab(tab.key)}>
                          <Text
                            style={[
                              styles.tabButtonText,
                              selected && styles.tabButtonTextActive,
                            ]}>
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {activeHourlyTab === 'summary' ? (
                    chartSeries.summaries.length > 0 ? (
                      <View style={styles.summaryRow}>
                        {chartSeries.summaries.map(item => (
                          <View
                            key={item.label}
                            style={[
                              styles.summaryCard,
                              isDarkMode && styles.summaryCardDark,
                            ]}>
                            <Text
                              style={[
                                styles.summaryLabel,
                                isDarkMode && styles.summaryLabelDark,
                              ]}>
                              {item.label}
                            </Text>
                            <Text
                              style={[
                                styles.summaryValue,
                                isDarkMode && styles.summaryValueDark,
                              ]}>
                              {item.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.center}>
                        <Text
                          style={[styles.body, isDarkMode && styles.bodyDark]}>
                          Not enough hourly data.
                        </Text>
                      </View>
                    )
                  ) : chartSeries.points.length ? (
                    <View style={styles.chartSection}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}>
                        <LineChart
                          points={chartSeries.points}
                          color={chartSeries.color}
                          secondaryColor={chartSeries.secondaryColor}
                          showSecondary={chartSeries.showSecondary}
                          showDots={chartSeries.showDots}
                          isDarkMode={isDarkMode}
                          valueFormatter={chartSeries.formatter}
                        />
                      </ScrollView>
                      {chartSeries.summaries.length > 0 && (
                        <View style={styles.summaryRow}>
                          {chartSeries.summaries.map(item => (
                            <View
                              key={item.label}
                              style={[
                                styles.summaryCard,
                                isDarkMode && styles.summaryCardDark,
                              ]}>
                              <Text
                                style={[
                                  styles.summaryLabel,
                                  isDarkMode && styles.summaryLabelDark,
                                ]}>
                                {item.label}
                              </Text>
                              <Text
                                style={[
                                  styles.summaryValue,
                                  isDarkMode && styles.summaryValueDark,
                                ]}>
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
                        style={[styles.body, isDarkMode && styles.bodyDark]}>
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
    backgroundColor: '#f2f2f7',
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#000',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flexShrink: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    color: '#3a3a3c',
    marginTop: 4,
  },
  subtitleDark: {
    color: '#d1d1d6',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0a84ff',
    borderRadius: 8,
  },
  refreshDisabled: {
    opacity: 0.4,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#121212',
    shadowOpacity: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
  },
  searchInputDark: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0a84ff',
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultList: {
    borderRadius: 12,
    backgroundColor: 'rgba(60,60,67,0.05)',
    padding: 8,
    gap: 8,
  },
  searchResult: {
    paddingVertical: 6,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  resultNameDark: {
    color: '#fff',
  },
  resultMeta: {
    color: '#3a3a3c',
  },
  resultMetaDark: {
    color: '#d1d1d6',
  },
  resultDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1d1d6',
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  clearSelection: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  clearSelectionText: {
    color: '#0a84ff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d1d6',
  },
  label: {
    fontSize: 16,
    color: '#3a3a3c',
  },
  labelDark: {
    color: '#d1d1d6',
  },
  value: {
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
  },
  valueDark: {
    color: '#fff',
  },
  body: {
    color: '#111',
  },
  bodyDark: {
    color: '#fff',
  },
  errorText: {
    color: '#ff453a',
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
    borderColor: '#ff453a',
  },
  retryText: {
    color: '#ff453a',
    fontWeight: '600',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    minHeight: 120,
  },
  contentSpacing: {
    gap: 24,
  },
  daySelectorContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#f2f2f7',
    minWidth: 90,
  },
  dayChipActive: {
    backgroundColor: '#0a84ff',
  },
  dayChipLabel: {
    color: '#3a3a3c',
    fontWeight: '600',
  },
  dayChipLabelActive: {
    color: '#fff',
  },
  dayChipMeta: {
    color: '#636366',
    fontSize: 12,
  },
  dayChipMetaActive: {
    color: '#e5f1ff',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: 'rgba(60,60,67,0.1)',
    padding: 4,
    marginTop: 12,
    marginBottom: 12,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0a84ff',
  },
  tabButtonText: {
    color: '#111',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  chartSection: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 110,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  summaryCardDark: {
    backgroundColor: '#1c1c1e',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#636366',
    marginBottom: 4,
  },
  summaryLabelDark: {
    color: '#d1d1d6',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  summaryValueDark: {
    color: '#fff',
  },
  dailyScroll: {
    paddingVertical: 8,
  },
  dailyCard: {
    width: 260,
    marginRight: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    gap: 8,
  },
  dailyCardDark: {
    backgroundColor: '#1c1c1e',
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  dailyTitleDark: {
    color: '#fff',
  },
  dailyTemp: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  dailyTempDark: {
    color: '#fff',
  },
  dailyRowDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyLabel: {
    color: '#3a3a3c',
  },
  dailyValue: {
    color: '#111',
    fontWeight: '600',
  },
  gapLeft: {
    marginLeft: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#3a3a3c',
    marginBottom: 16,
  },
  footerDark: {
    color: '#d1d1d6',
  },
});

export default App;
