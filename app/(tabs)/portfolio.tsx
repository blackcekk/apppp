import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,

} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react-native";
import { router } from "expo-router";
import LineChart from "@/components/LineChart";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import AssetCard from "@/components/AssetCard";
import PortfolioSummary from "@/components/PortfolioSummary";

type ChartPeriod = 'daily' | 'weekly' | 'monthly';

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { portfolio, totalValue, totalProfit, profitPercentage, refreshPortfolio, hideBalances, toggleHideBalances } = usePortfolio();
  const { currentCurrency } = useCurrency();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('daily');

  const generateHistoricalData = (period: ChartPeriod, currentValue: number) => {
    const now = new Date();
    let dataPoints: number[] = [];
    let labels: string[] = [];
    let numPoints = 0;
    
    switch (period) {
      case 'daily':
        numPoints = 24; // 24 hours
        for (let i = numPoints - 1; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          labels.push(hour.getHours().toString().padStart(2, '0') + ':00');
          // Generate realistic portfolio fluctuation (±5% from current value)
          const variation = (Math.random() - 0.5) * 0.1; // ±5%
          const baseValue = currentValue * (0.95 + Math.random() * 0.1); // Base variation
          dataPoints.push(Math.max(0, baseValue * (1 + variation)));
        }
        break;
        
      case 'weekly':
        numPoints = 7; // 7 days
        for (let i = numPoints - 1; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          labels.push(day.toLocaleDateString('en', { weekday: 'short' }));
          // Generate weekly trend with more variation
          const variation = (Math.random() - 0.5) * 0.15; // ±7.5%
          const baseValue = currentValue * (0.9 + Math.random() * 0.2); // Base variation
          dataPoints.push(Math.max(0, baseValue * (1 + variation)));
        }
        break;
        
      case 'monthly':
        numPoints = 30; // 30 days
        for (let i = numPoints - 1; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          if (i % 5 === 0 || i === numPoints - 1) { // Show every 5th day
            labels.push(day.getDate().toString());
          } else {
            labels.push('');
          }
          // Generate monthly trend with significant variation
          const variation = (Math.random() - 0.5) * 0.25; // ±12.5%
          const baseValue = currentValue * (0.8 + Math.random() * 0.4); // Base variation
          dataPoints.push(Math.max(0, baseValue * (1 + variation)));
        }
        break;
    }
    
    // Ensure the last data point is close to current value
    dataPoints[dataPoints.length - 1] = currentValue;
    
    return { data: dataPoints, labels };
  };

  const chartData = useMemo(() => {
    return generateHistoricalData(selectedPeriod, totalValue);
  }, [selectedPeriod, totalValue]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPortfolio();
    setRefreshing(false);
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
            <AssetCard key={asset.id} asset={asset} onPress={() => console.log('Asset details:', asset.symbol)} />
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
});