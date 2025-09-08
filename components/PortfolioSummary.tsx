import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatCurrency } from "@/utils/formatters";

export default function PortfolioSummary() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { totalValue, totalProfit, hideBalances } = usePortfolio();
  const { currentCurrency } = useCurrency();

  const summaryItems = [
    {
      label: t("portfolio.totalInvested"),
      value: hideBalances ? "****" : formatCurrency(totalValue - totalProfit, currentCurrency),
      color: colors.text,
    },
    {
      label: t("portfolio.currentValue"),
      value: hideBalances ? "****" : formatCurrency(totalValue, currentCurrency),
      color: colors.primary,
    },
    {
      label: t("portfolio.totalProfit"),
      value: hideBalances ? "****" : formatCurrency(totalProfit, currentCurrency),
      color: totalProfit >= 0 ? colors.success : colors.error,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {summaryItems.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
          <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  item: {
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});