import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, G } from "react-native-svg";
import { useTheme } from "@/providers/ThemeProvider";

interface LineChartProps {
  data: number[];
  labels: string[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  width = Dimensions.get("window").width - 64,
  height = 200,
  showGrid = true,
  showDots = true,
}) => {
  const { colors } = useTheme();
  
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = maxValue - minValue || 1;
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * chartWidth + padding.left,
    y: padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight,
  }));
  
  const pathData = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      
      const prevPoint = points[index - 1];
      const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
      const cp1y = prevPoint.y;
      const cp2x = prevPoint.x + (2 * (point.x - prevPoint.x)) / 3;
      const cp2y = point.y;
      
      return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    })
    .join(" ");
  
  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = minValue + (valueRange / 4) * i;
    return Math.round(value);
  });
  
  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {showGrid && (
          <G>
            {yAxisLabels.map((_, index) => {
              const y = padding.top + (chartHeight / 4) * (4 - index);
              return (
                <Line
                  key={`grid-${index}`}
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  opacity={0.3}
                />
              );
            })}
          </G>
        )}
        
        <Path
          d={pathData}
          fill="none"
          stroke={colors.primary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {showDots && points.map((point, index) => (
          <Circle
            key={`dot-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={colors.background}
            stroke={colors.primary}
            strokeWidth="2"
          />
        ))}
        
        {labels.map((label, index) => {
          const x = (index / (labels.length - 1)) * chartWidth + padding.left;
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={height - 10}
              fontSize="12"
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
        
        {yAxisLabels.map((label, index) => {
          const y = padding.top + (chartHeight / 4) * (4 - index);
          return (
            <SvgText
              key={`y-label-${index}`}
              x={25}
              y={y + 4}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor="end"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LineChart;