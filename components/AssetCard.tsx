import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { TrendingUp, TrendingDown, Trash2 } from "lucide-react-native";
import { Asset } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/utils/formatters";

interface AssetCardProps {
  asset: Asset;
  onPress: () => void;
}

export default function AssetCard({ asset, onPress }: AssetCardProps) {
  const { colors } = useTheme();
  const { currentCurrency } = useCurrency();
  const { hideBalances, removeAsset } = usePortfolio();
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  
  const profit = (asset.currentPrice - asset.avgPrice) * asset.quantity;
  const profitPercentage = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
  const isPositive = profit >= 0;

  const handleLongPress = () => {
    setShowDeleteButton(!showDeleteButton);
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = confirm(`${asset.symbol} varlığını portföyünüzden silmek istediğinizden emin misiniz?`);
      if (confirmed) {
        removeAsset(asset.id);
      }
      setShowDeleteButton(false);
    } else {
      Alert.alert(
        "Varlığı Sil",
        `${asset.symbol} varlığını portföyünüzden silmek istediğinizden emin misiniz?`,
        [
          {
            text: "İptal",
            style: "cancel",
            onPress: () => setShowDeleteButton(false)
          },
          {
            text: "Sil",
            style: "destructive",
            onPress: () => {
              removeAsset(asset.id);
              setShowDeleteButton(false);
            }
          }
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.iconText, { color: colors.primary }]}>
            {asset.symbol.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.symbol, { color: colors.text }]}>{asset.symbol}</Text>
          <Text style={[styles.quantity, { color: colors.textSecondary }]}>
            {hideBalances ? "**" : asset.quantity.toFixed(2)} shares
          </Text>
        </View>
      </View>
      
      <View style={styles.right}>
        {showDeleteButton ? (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={handleDelete}
          >
            <Trash2 color="#FFFFFF" size={16} />
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={[styles.value, { color: colors.text }]}>
              {hideBalances ? "****" : formatCurrency(asset.currentPrice * asset.quantity, currentCurrency)}
            </Text>
            <View style={styles.profitContainer}>
              {isPositive ? (
                <TrendingUp color={colors.success} size={14} />
              ) : (
                <TrendingDown color={colors.error} size={14} />
              )}
              <Text style={[styles.profit, { color: isPositive ? colors.success : colors.error }]}>
                {hideBalances ? "**%" : formatPercentage(profitPercentage)}
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  quantity: {
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  profitContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  profit: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});