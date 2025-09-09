import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { TrendingUp, TrendingDown, Star } from "lucide-react-native";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { router } from "expo-router";

interface MarketItemProps {
  item: {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    isFavorite?: boolean;
  };
}

export default function MarketItem({ item }: MarketItemProps) {
  const { colors } = useTheme();
  const { currentCurrency } = useCurrency();
  const isPositive = item.change >= 0;

  const handlePress = () => {
    router.push({
      pathname: '/add',
      params: {
        preselectedSymbol: item.symbol,
        preselectedName: item.name,
        preselectedPrice: item.price.toString()
      }
    });
  };

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.card }]} onPress={handlePress}>
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.iconText, { color: colors.primary }]}>
            {item.symbol.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.symbol, { color: colors.text }]}>{item.symbol}</Text>
          <Text style={[styles.name, { color: colors.textSecondary }]}>{item.name}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatCurrency(item.price, currentCurrency)}
        </Text>
        <View style={styles.changeContainer}>
          {isPositive ? (
            <TrendingUp color={colors.success} size={14} />
          ) : (
            <TrendingDown color={colors.error} size={14} />
          )}
          <Text style={[styles.change, { color: isPositive ? colors.success : colors.error }]}>
            {formatPercentage(item.changePercent)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.favoriteButton}>
        <Star
          color={item.isFavorite ? colors.warning : colors.textSecondary}
          size={20}
          fill={item.isFavorite ? colors.warning : "transparent"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  symbol: {
    fontSize: 16,
    fontWeight: "600",
  },
  name: {
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    marginRight: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: "500",
  },
  favoriteButton: {
    padding: 4,
  },
});