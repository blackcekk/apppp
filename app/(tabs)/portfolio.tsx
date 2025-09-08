import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,

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

const { width } = Dimensions.get("window");

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { portfolio, totalValue, totalProfit, profitPercentage, refreshPortfolio, hideBalances, toggleHideBalances } = usePortfolio();
  const { currentCurrency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const chartData = useMemo(() => {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      data: [0, 20, 45, 28, 80, 99],
    };
  }, []);

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
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t("portfolio.performance")}</Text>
          <LineChart
            data={chartData.data}
            labels={chartData.labels}
            width={width - 32}
            height={200}
            showGrid={true}
            showDots={true}
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
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
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