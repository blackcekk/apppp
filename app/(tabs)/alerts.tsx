import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAlerts } from "@/providers/AlertProvider";
import { Bell, Plus } from "lucide-react-native";
import AlertItem from "@/components/AlertItem";
import CreateAlertModal from "@/components/CreateAlertModal";

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { alerts, removeAlert, toggleAlert } = useAlerts();
  const insets = useSafeAreaInsets();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("alerts.title")}</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus color="#FFFFFF" size={20} />
          <Text style={styles.addButtonText}>{t("alerts.create")}</Text>
        </TouchableOpacity>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Bell color={colors.textSecondary} size={48} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("alerts.empty")}</Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            {t("alerts.emptyDescription")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertItem
              alert={item}
              onToggle={() => toggleAlert(item.id)}
              onDelete={() => removeAlert(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <CreateAlertModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
});