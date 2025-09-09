import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Switch } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { Trash2, TrendingUp, TrendingDown, Bell, AlarmClock, Smartphone } from "lucide-react-native";
import { Alert } from "@/types/alert";
import { formatCurrency } from "@/utils/formatters";

interface AlertItemProps {
  alert: Alert;
  onToggle: () => void;
  onDelete: () => void;
}

export default function AlertItem({ alert, onToggle, onDelete }: AlertItemProps) {
  const { colors } = useTheme();
  const { currentCurrency } = useCurrency();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={[styles.icon, { backgroundColor: colors.primary + "20" }]}>
            {alert.type === "above" ? (
              <TrendingUp color={colors.primary} size={20} />
            ) : (
              <TrendingDown color={colors.primary} size={20} />
            )}
          </View>
          <View style={styles.info}>
            <View style={styles.symbolRow}>
              <Text style={[styles.symbol, { color: colors.text }]}>{alert.symbol}</Text>
              <View style={styles.notificationIcon}>
                {alert.notificationType === 'app' && <Bell color={colors.textSecondary} size={14} />}
                {alert.notificationType === 'alarm' && <AlarmClock color={colors.textSecondary} size={14} />}
                {alert.notificationType === 'both' && <Smartphone color={colors.textSecondary} size={14} />}
              </View>
            </View>
            <Text style={[styles.condition, { color: colors.textSecondary }]}>
              {alert.type === "above" ? "Above" : "Below"} {formatCurrency(alert.targetPrice, currentCurrency)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Switch
            value={alert.enabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
          <TouchableOpacity onPress={onDelete}>
            <Trash2 color={colors.error} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {alert.note && (
        <Text style={[styles.note, { color: colors.textSecondary }]}>{alert.note}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  info: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  symbol: {
    fontSize: 16,
    fontWeight: "600",
  },
  notificationIcon: {
    opacity: 0.7,
  },
  condition: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  note: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
});