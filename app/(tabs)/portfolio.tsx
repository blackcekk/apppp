import React, { useMemo, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { TrendingUp, TrendingDown, Eye, EyeOff, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import LineChart from "@/components/LineChart";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import AssetCard from "@/components/AssetCard";
import PortfolioSummary from "@/components/PortfolioSummary";

type ChartPeriod = 'daily' | 'weekly' | 'monthly';

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { portfolio, totalValue, totalProfit, profitPercentage, refreshPortfolio, hideBalances, toggleHideBalances, removeAsset } = usePortfolio();
  const { currentCurrency } = useCurrency();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('daily');

  const generatePortfolioHistoricalData = useCallback((period: ChartPeriod, currentValue: number) => {
    const now = new Date();
    let dataPoints: number[] = [];
    let labels: string[] = [];
    let numPoints = 0;
    
    // Calculate portfolio cost basis for realistic historical simulation
    const totalCost = portfolio.reduce((sum, asset) => sum + (asset.quantity * asset.avgPrice), 0);
    const profitMargin = totalCost > 0 ? (currentValue - totalCost) / totalCost : 0;
    
    switch (period) {
      case 'daily':
        numPoints = 24; // 24 hours
        for (let i = numPoints - 1; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          labels.push(hour.getHours().toString().padStart(2, '0') + ':00');
          
          // Simulate realistic portfolio value changes throughout the day
          const timeProgress = (numPoints - 1 - i) / (numPoints - 1);
          const baseProgress = Math.sin(timeProgress * Math.PI * 2) * 0.02; // Small daily fluctuation
          const randomVariation = (Math.random() - 0.5) * 0.015; // ±1.5% random
          const progressToCurrentValue = timeProgress * profitMargin * 0.3; // Gradual approach to current profit
          
          const simulatedValue = totalCost * (1 + baseProgress + randomVariation + progressToCurrentValue);
          dataPoints.push(Math.max(totalCost * 0.95, simulatedValue));
        }
        break;
        
      case 'weekly':
        numPoints = 7; // 7 days
        for (let i = numPoints - 1; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          labels.push(day.toLocaleDateString('tr', { weekday: 'short' }));
          
          // Simulate weekly portfolio progression
          const timeProgress = (numPoints - 1 - i) / (numPoints - 1);
          const weeklyTrend = timeProgress * profitMargin * 0.7; // 70% of current profit over the week
          const randomVariation = (Math.random() - 0.5) * 0.05; // ±5% random
          const marketCycle = Math.sin(timeProgress * Math.PI * 3) * 0.02; // Market cycles
          
          const simulatedValue = totalCost * (1 + weeklyTrend + randomVariation + marketCycle);
          dataPoints.push(Math.max(totalCost * 0.9, simulatedValue));
        }
        break;
        
      case 'monthly':
        numPoints = 30; // 30 days
        for (let i = numPoints - 1; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          if (i % 5 === 0 || i === numPoints - 1) {
            labels.push(day.getDate().toString());
          } else {
            labels.push('');
          }
          
          // Simulate monthly portfolio growth/decline
          const timeProgress = (numPoints - 1 - i) / (numPoints - 1);
          const monthlyTrend = timeProgress * profitMargin; // Full profit progression over month
          const randomVariation = (Math.random() - 0.5) * 0.08; // ±8% random
          const longTermCycle = Math.sin(timeProgress * Math.PI * 2) * 0.03; // Longer market cycles
          
          const simulatedValue = totalCost * (1 + monthlyTrend + randomVariation + longTermCycle);
          dataPoints.push(Math.max(totalCost * 0.8, simulatedValue));
        }
        break;
    }
    
    // Ensure the last data point matches current portfolio value
    dataPoints[dataPoints.length - 1] = currentValue;
    
    return { data: dataPoints, labels };
  }, [portfolio]);

  const chartData = useMemo(() => {
    return generatePortfolioHistoricalData(selectedPeriod, totalValue);
  }, [selectedPeriod, totalValue, generatePortfolioHistoricalData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPortfolio();
    setRefreshing(false);
  };

  const renderRightAction = (assetId: string, assetSymbol: string) => {
    return (
      <Animated.View style={[styles.deleteAction, { backgroundColor: colors.error }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            console.log('Deleting asset:', assetId);
            removeAsset(assetId);
          }}
        >
          <Trash2 color="#FFFFFF" size={20} />
          <Text style={styles.deleteText}>Sil</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {t("portfolio.greeting")}
            </Text>
            <TouchableOpacity onPress={toggleHideBalances} style={styles.eyeButton}>
              {hideBalances ? (
                <EyeOff color={colors.textSecondary} size={20} />
              ) : (
                <Eye color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {hideBalances ? "****" : formatCurrency(totalValue, currentCurrency)}
          </Text>
          
          <View style={styles.profitContainer}>
            {totalProfit >= 0 ? (
              <TrendingUp color={colors.success} size={16} />
            ) : (
              <TrendingDown color={colors.error} size={16} />
            )}
            <Text style={[styles.profit, { color: totalProfit >= 0 ? colors.success : colors.error }]}>
              {hideBalances ? "****" : formatCurrency(Math.abs(totalProfit), currentCurrency)}
            </Text>
            <Text style={[styles.profitPercentage, { color: totalProfit >= 0 ? colors.success : colors.error }]}>
              ({hideBalances ? "**" : formatPercentage(profitPercentage)})
            </Text>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{t("portfolio.performance")}</Text>
            <View style={styles.periodSelector}>
              {(['daily', 'weekly', 'monthly'] as ChartPeriod[]).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: selectedPeriod === period ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      {
                        color: selectedPeriod === period ? colors.background : colors.textSecondary,
                      },
                    ]}
                  >
                    {t(`portfolio.${period}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <LineChart
            data={chartData.data}
            labels={chartData.labels}
            width={width - 32}
            height={200}
            showGrid={true}
            showDots={selectedPeriod === 'daily'}
          />
        </View>

        <PortfolioSummary />

        <View style={styles.assetsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("portfolio.assets")}</Text>
            <TouchableOpacity onPress={() => router.push("/add")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t("common.addNew")}</Text>
            </TouchableOpacity>
          </View>

          {portfolio.map((asset) => (
            <Swipeable
              key={asset.id}
              renderRightActions={() => renderRightAction(asset.id, asset.symbol)}
            >
              <AssetCard asset={asset} onPress={() => console.log('Asset details:', asset.symbol)} />
            </Swipeable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
  },
  eyeButton: {
    padding: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },
  profitContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  profit: {
    fontSize: 16,
    fontWeight: "600",
  },
  profitPercentage: {
    fontSize: 14,
  },
  chartContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },

  assetsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  deleteAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 12,
    borderRadius: 12,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    gap: 4,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});