import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { ChartData } from '@/types/portfolio';
import { useTheme } from '@/providers/ThemeProvider';
import { useCurrency } from '@/providers/CurrencyProvider';

interface PriceChartProps {
  data: ChartData[];
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export function PriceChart({ 
  data, 
  height = 200, 
  showGrid = true,
  showLabels = true 
}: PriceChartProps) {
  const { colors } = useTheme();
  const { getCurrencySymbol } = useCurrency();
  
  const formatPrice = (price: number) => {
    return `${getCurrencySymbol()}${price.toFixed(2)}`;
  };
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const width = screenWidth - 40;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * chartWidth,
      y: padding + (1 - (d.price - minPrice) / priceRange) * chartHeight,
      price: d.price,
      timestamp: d.timestamp
    }));
    
    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
    
    const isPositive = data[data.length - 1].price >= data[0].price;
    
    return {
      points,
      pathData,
      minPrice,
      maxPrice,
      width,
      chartHeight,
      padding,
      isPositive
    };
  }, [data, height]);
  
  if (!chartData) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={[styles.noData, { color: colors.textSecondary }]}>
          No data available
        </Text>
      </View>
    );
  }
  
  const { points, pathData, minPrice, maxPrice, width, padding, isPositive } = chartData;
  const color = isPositive ? colors.success : colors.error;
  
  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        {showGrid && (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = padding + ratio * (height - padding * 2);
              return (
                <Line
                  key={ratio}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth="0.5"
                  strokeDasharray="5,5"
                />
              );
            })}
          </>
        )}
        
        <Path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        
        <Path
          d={`${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {points.length > 0 && (
          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={color}
          />
        )}
        
        {showLabels && (
          <>
            <SvgText
              x={padding}
              y={padding - 5}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor="start"
            >
              {formatPrice(maxPrice)}
            </SvgText>
            <SvgText
              x={padding}
              y={height - padding + 12}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor="start"
            >
              {formatPrice(minPrice)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noData: {
    fontSize: 14,
  },
});