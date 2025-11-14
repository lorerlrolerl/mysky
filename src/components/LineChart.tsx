import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";

export type LineChartPoint = {
  label: string;
  value: number;
  secondary?: number;
};

export type LineChartProps = {
  points: LineChartPoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  showSecondary?: boolean;
  showDots?: boolean;
  isDarkMode?: boolean;
  valueFormatter?: (value: number) => string;
};

const defaultFormatter = (value: number) => value.toFixed(1);

export function LineChart({
  points,
  height = 220,
  color = "#0a84ff",
  secondaryColor = "#ff9f0c",
  showSecondary = false,
  showDots = true,
  isDarkMode = false,
  valueFormatter = defaultFormatter,
}: LineChartProps) {
  if (!points.length) {
    return <View style={{ height }} />;
  }

  const screenWidth = Dimensions.get("window").width;
  const padding = {
    top: 40,
    right: 24,
    bottom: 60,
    left: 24,
  };
  const width = Math.max(points.length * 72, screenWidth - 64);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const primaryValues = points.map((point) => point.value);
  const secondaryValues = showSecondary
    ? points.map((point) => point.secondary ?? NaN)
    : [];

  const combinedValues = secondaryValues.length
    ? primaryValues.concat(secondaryValues.filter((v) => !Number.isNaN(v)))
    : primaryValues;

  const rawMin = Math.min(...combinedValues);
  const rawMax = Math.max(...combinedValues);

  let min = rawMin;
  let max = rawMax;

  if (min === max) {
    if (min === 0) {
      max = 1;
    } else {
      min = min - 1;
      max = max + 1;
    }
  } else {
    const paddingRange = (max - min) * 0.1;
    min -= paddingRange;
    max += paddingRange;
  }

  if (min < 0 && rawMin >= 0) {
    min = 0;
  }

  const valueToY = (value: number) => {
    const clampedValue = Math.min(Math.max(value, min), max);
    const ratio = (clampedValue - min) / (max - min || 1);
    return padding.top + chartHeight - ratio * chartHeight;
  };

  const indexToX = (index: number) => {
    if (points.length === 1) {
      return padding.left + chartWidth / 2;
    }

    const ratio = index / (points.length - 1);
    return padding.left + ratio * chartWidth;
  };

  const polyline = primaryValues
    .map((value, index) => `${indexToX(index)},${valueToY(value)}`)
    .join(" ");

  const secondaryPolyline = showSecondary
    ? points
        .map((point, index) => {
          if (typeof point.secondary !== "number") {
            return null;
          }
          return `${indexToX(index)},${valueToY(point.secondary)}`;
        })
        .filter(Boolean)
        .join(" ")
    : "";

  const axisColor = isDarkMode ? "#3a3a3c" : "#c7c7cc";
  const textColor = isDarkMode ? "#d1d1d6" : "#3a3a3c";

  return (
    <View style={[styles.chartContainer, { height, width }]}>
      <Svg height={height} width={width}>
        <Rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill={
            isDarkMode ? "rgba(118,118,128,0.12)" : "rgba(118,118,128,0.08)"
          }
          rx={14}
        />
        {secondaryPolyline.length > 0 && (
          <Polyline
            points={secondaryPolyline}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <Polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots &&
          primaryValues.map((value, index) => (
            <Circle
              key={`dot-${index}`}
              cx={indexToX(index)}
              cy={valueToY(value)}
              r={4}
              fill={color}
            />
          ))}
        {showSecondary &&
          points.map((point, index) => {
            if (typeof point.secondary !== "number") {
              return null;
            }
            return (
              <Circle
                key={`secondary-dot-${index}`}
                cx={indexToX(index)}
                cy={valueToY(point.secondary)}
                r={3}
                fill={secondaryColor}
              />
            );
          })}
        {points.map((point, index) => {
          const x = indexToX(index);
          const y = valueToY(point.value);

          // Hour label on top
          const hourY = padding.top - 8;
          // Value label below
          const valueY = padding.top + chartHeight + 24;
          // Secondary value label (if exists) below primary value
          const secondaryValueY = padding.top + chartHeight + 38;

          return (
            <React.Fragment key={`labels-${index}`}>
              {/* Hour label on top */}
              <SvgText
                x={x}
                y={hourY}
                fill={textColor}
                fontSize={12}
                fontWeight="600"
                textAnchor="middle"
              >
                {point.label}
              </SvgText>
              {/* Primary value label below */}
              <SvgText
                x={x}
                y={valueY}
                fill={color}
                fontSize={11}
                fontWeight="600"
                textAnchor="middle"
              >
                {valueFormatter(point.value)}
              </SvgText>
              {/* Secondary value label below primary (if exists) */}
              {showSecondary && typeof point.secondary === "number" && (
                <SvgText
                  x={x}
                  y={secondaryValueY}
                  fill={secondaryColor}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {valueFormatter(point.secondary)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LineChart;
