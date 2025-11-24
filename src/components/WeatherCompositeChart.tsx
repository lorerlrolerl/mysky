import React from "react";
import { Dimensions, StyleSheet, View, Text } from "react-native";
import Svg, {
  Polyline,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { ResolvedPrecipitationType } from "../../App";

export type WeatherCompositeDatum = {
  label: string;
  temperature: number;
  apparent: number;
  precipitation: number;
  precipType: ResolvedPrecipitationType;
  probability: number;
  windSpeed: number;
  aqi?: number;
  aqiLabel?: string;
  aqiColor?: string;
  weatherIcon: string;
};

type WeatherCompositeChartProps = {
  data: WeatherCompositeDatum[];
  isDarkMode?: boolean;
};

const TEMP_COLOR = "#ff3b30";
const FEELS_COLOR = "#ff9f0c";
const WIND_COLOR = "#bf5af2";
const PROBABILITY_COLOR = "rgba(10,132,255,0.25)";

export function WeatherCompositeChart({
  data,
  isDarkMode = false,
}: WeatherCompositeChartProps) {
  if (!data.length) {
    return <View style={styles.emptyState} />;
  }

  const screenWidth = Dimensions.get("window").width;
  const padding = {
    top: 68,
    right: 24,
    bottom: 56,
    left: 24,
  };
  const sectionSpacing = 32;
  const tempHeight = 140;
  const precipHeight = 160;
  const windHeight = 120;
  const aqiHeight = 140;
  const width = Math.max(data.length * 100, screenWidth - 64);
  const chartWidth = width - padding.left - padding.right;
  const height =
    padding.top +
    tempHeight +
    sectionSpacing +
    precipHeight +
    sectionSpacing +
    windHeight +
    sectionSpacing +
    aqiHeight +
    padding.bottom;

  const tempTop = padding.top;
  const tempBottom = tempTop + tempHeight;
  const precipTop = tempBottom + sectionSpacing;
  const precipBottom = precipTop + precipHeight;
  const windTop = precipBottom + sectionSpacing;
  const windBottom = windTop + windHeight;
  const aqiTop = windBottom + sectionSpacing;
  const aqiBottom = aqiTop + aqiHeight;

  const labelY = padding.top - 18;

  const dataCount = data.length || 1;
  const xSpacing = chartWidth / dataCount;
  const getBarWidth = (maxWidth: number) => Math.min(maxWidth, xSpacing * 0.55);
  const getLabelBelow = (bottom: number, offset = 18) => bottom + offset;
  const indexToX = (index: number) => padding.left + xSpacing * (index + 0.5);

  const tempValues = data.flatMap((item) => [item.temperature, item.apparent]);
  const tempMin = Math.min(...tempValues);
  const tempMax = Math.max(...tempValues);
  const tempRangePadding = Math.max(2, (tempMax - tempMin) * 0.15);
  const tempScaleMin = tempMin - tempRangePadding;
  const tempScaleMax = tempMax + tempRangePadding;
  const tempValueToY = (value: number) => {
    const ratio = (value - tempScaleMin) / (tempScaleMax - tempScaleMin || 1);
    return tempBottom - ratio * (tempBottom - tempTop);
  };

  const precipMax = Math.max(...data.map((item) => item.precipitation), 0.2);
  const precipValueToY = (value: number) => {
    const ratio = Math.min(1, value / (precipMax || 1));
    return precipBottom - ratio * (precipBottom - precipTop - 16);
  };

  const probabilityMax = Math.max(
    ...data.map((item) => Math.max(0, item.probability)),
    1
  );

  const probabilityPath = (() => {
    const coords = data.map((item, index) => {
      const ratio = Math.max(0, item.probability) / probabilityMax;
      const y = precipBottom - ratio * (precipBottom - precipTop);
      return `${indexToX(index)},${y}`;
    });
    if (coords.length < 2) {
      return "";
    }
    return [
      coords.join(" "),
      `${indexToX(data.length - 1)},${precipBottom}`,
      `${indexToX(0)},${precipBottom}`,
      coords[0],
    ].join(" ");
  })();

  const windValues = data.map((item) => item.windSpeed);
  const windMax = Math.max(...windValues, 1);
  const windValueToY = (value: number) => {
    const ratio = value / windMax;
    return windBottom - ratio * (windBottom - windTop - 12);
  };

  const aqiValues = data
    .map((item) => item.aqi)
    .filter((value): value is number => value != null && !Number.isNaN(value));
  const hasAQI = aqiValues.length > 0;
  const aqiMax = hasAQI ? Math.max(...aqiValues, 1) : 1;
  const aqiValueToY = (value: number) => {
    const ratio = value / aqiMax;
    return aqiBottom - ratio * (aqiBottom - aqiTop - 16);
  };

  const textColor = isDarkMode ? "#d1d1d6" : "#3a3a3c";
  const probabilityTicks = [0, probabilityMax / 2, probabilityMax].filter(
    (value, idx, arr) => idx === 0 || value !== arr[idx - 1]
  );

  return (
    <View style={styles.wrapper}>
      <View style={[styles.chartContainer, { height, width }]}>
        <Svg height={height} width={width}>
          <Rect
            x={padding.left}
            y={tempTop}
            width={chartWidth}
            height={tempHeight}
            rx={12}
            fill={
              isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(118,118,128,0.08)"
            }
          />
          <Rect
            x={padding.left}
            y={precipTop}
            width={chartWidth}
            height={precipHeight}
            rx={12}
            fill={
              isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(118,118,128,0.08)"
            }
          />
          <Rect
            x={padding.left}
            y={windTop}
            width={chartWidth}
            height={windHeight}
            rx={12}
            fill={
              isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(118,118,128,0.08)"
            }
          />
          <Rect
            x={padding.left}
            y={aqiTop}
            width={chartWidth}
            height={aqiHeight}
            rx={12}
            fill={
              isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(118,118,128,0.08)"
            }
          />

          {probabilityPath && (
            <Polygon
              points={probabilityPath}
              fill={PROBABILITY_COLOR}
              stroke="none"
              opacity={0.35}
            />
          )}

          {/* Precipitation bars */}
          {data.map((item, index) => {
            if (item.precipitation <= 0) {
              return null;
            }
            const xCenter = indexToX(index);
            const barWidth = getBarWidth(36);
            const barLeft = xCenter - barWidth / 2;
            const barTop = precipValueToY(item.precipitation);
            const barHeight = precipBottom - 16 - barTop;
            const barColor =
              item.precipType.key === "dry"
                ? "rgba(142,142,147,0.4)"
                : item.precipType.color;
            const precipLabelY = getLabelBelow(precipBottom, 20);
            return (
              <React.Fragment key={`precip-bar-${index}`}>
                <Rect
                  x={barLeft}
                  y={barTop}
                  width={barWidth}
                  height={Math.max(4, barHeight)}
                  rx={6}
                  fill={barColor}
                />
                <SvgText
                  x={xCenter}
                  y={precipLabelY}
                  fill={barColor}
                  fontSize={11}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.precipitation.toFixed(1)} mm
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Probability axis labels */}
          {probabilityTicks.map((value) => {
            const ratio = value / probabilityMax;
            const y = precipBottom - ratio * (precipBottom - precipTop);
            return (
              <SvgText
                key={`prob-label-${value}`}
                x={padding.left + chartWidth + 8}
                y={y + 4}
                fill={textColor}
                fontSize={10}
                textAnchor="start"
              >
                {Math.round(value)}%
              </SvgText>
            );
          })}

          {/* Temperature lines */}
          <Polyline
            points={data
              .map(
                (item, index) =>
                  `${indexToX(index)},${tempValueToY(item.temperature)}`
              )
              .join(" ")}
            fill="none"
            stroke={TEMP_COLOR}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points={data
              .map(
                (item, index) =>
                  `${indexToX(index)},${tempValueToY(item.apparent)}`
              )
              .join(" ")}
            fill="none"
            stroke={FEELS_COLOR}
            strokeWidth={2}
            strokeDasharray="6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Wind bars */}
          {data.map((item, index) => {
            if (item.windSpeed <= 0) {
              return null;
            }
            const xCenter = indexToX(index);
            const barWidth = getBarWidth(30);
            const barLeft = xCenter - barWidth / 2;
            const barTop = windValueToY(item.windSpeed);
            const barHeight = windBottom - 12 - barTop;
            const windLabelY = getLabelBelow(windBottom, 20);
            return (
              <React.Fragment key={`wind-bar-${index}`}>
                <Rect
                  x={barLeft}
                  y={barTop}
                  width={barWidth}
                  height={Math.max(4, barHeight)}
                  rx={5}
                  fill={WIND_COLOR}
                />
                <SvgText
                  x={xCenter}
                  y={windLabelY}
                  fill={WIND_COLOR}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.windSpeed.toFixed(1)} km/h
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* AQI bars */}
          {hasAQI &&
            data.map((item, index) => {
              if (!item.aqi || Number.isNaN(item.aqi)) {
                return null;
              }
              const xCenter = indexToX(index);
              const barWidth = getBarWidth(32);
              const barLeft = xCenter - barWidth / 2;
              const barTop = aqiValueToY(item.aqi);
              const barHeight = aqiBottom - 16 - barTop;
              const barColor = item.aqiColor ?? "#8e8e93";
              const aqiLabelY = getLabelBelow(aqiBottom, 20);
              return (
                <React.Fragment key={`aqi-bar-${index}`}>
                  <Rect
                    x={barLeft}
                    y={barTop}
                    width={barWidth}
                    height={Math.max(4, barHeight)}
                    rx={5}
                    fill={barColor}
                  />
                  {item.aqiLabel && (
                    <SvgText
                      x={xCenter}
                      y={aqiLabelY}
                      fill={barColor}
                      fontSize={11}
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {item.aqiLabel}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}

          {data.map((item, index) => {
            const x = indexToX(index);
            return (
              <React.Fragment key={`labels-${index}`}>
                <SvgText
                  x={x}
                  y={labelY - 18}
                  fill={textColor}
                  fontSize={14}
                  textAnchor="middle"
                >
                  {item.weatherIcon}
                </SvgText>
                <SvgText
                  x={x}
                  y={labelY}
                  fill={textColor}
                  fontSize={11}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
                <SvgText
                  x={x}
                  y={tempValueToY(item.temperature) - 12}
                  fill={TEMP_COLOR}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.temperature.toFixed(1)}°C
                </SvgText>
                <SvgText
                  x={x}
                  y={tempValueToY(item.apparent) + 16}
                  fill={FEELS_COLOR}
                  fontSize={10}
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {item.apparent.toFixed(1)}°C
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
      <View
        style={[
          styles.legendRow,
          isDarkMode && styles.legendRowDark,
          { width },
        ]}
      >
        <LegendItem color={TEMP_COLOR} label="Temp" isDarkMode={isDarkMode} />
        <LegendItem
          color={FEELS_COLOR}
          label="Feels like"
          isDarkMode={isDarkMode}
        />
        <LegendItem
          color="#0a84ff"
          label="Precip (mm)"
          isDarkMode={isDarkMode}
        />
        <LegendItem
          color="rgba(10,132,255,0.35)"
          label="Precip chance"
          isDarkMode={isDarkMode}
          dashed
        />
        <LegendItem color={WIND_COLOR} label="Wind" isDarkMode={isDarkMode} />
        {hasAQI && (
          <LegendItem color="#8e8e93" label="AQI" isDarkMode={isDarkMode} />
        )}
      </View>
    </View>
  );
}

function LegendItem({
  color,
  label,
  isDarkMode,
  dashed,
}: {
  color: string;
  label: string;
  isDarkMode: boolean;
  dashed?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: color },
          dashed && styles.legendSwatchDashed,
        ]}
      />
      <Text style={[styles.legendLabel, isDarkMode && styles.legendLabelDark]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
    alignItems: "center",
  },
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    height: 320,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  legendRowDark: {
    opacity: 0.9,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 6,
    borderRadius: 3,
  },
  legendSwatchDashed: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#0a84ff",
    backgroundColor: "transparent",
  },
  legendLabel: {
    fontSize: 12,
    color: "#1c1c1e",
    fontWeight: "600",
  },
  legendLabelDark: {
    color: "#f2f2f7",
  },
});

export default WeatherCompositeChart;
