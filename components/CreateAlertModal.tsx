import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAlerts } from "@/providers/AlertProvider";
import { X } from "lucide-react-native";

interface CreateAlertModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateAlertModal({ visible, onClose }: CreateAlertModalProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { addAlert } = useAlerts();

  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [type, setType] = useState<"above" | "below">("above");
  const [note, setNote] = useState("");

  const handleCreate = () => {
    if (!symbol || !targetPrice) return;

    addAlert({
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      type,
      note,
      enabled: true,
    });

    setSymbol("");
    setTargetPrice("");
    setNote("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t("alerts.createNew")}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t("alerts.symbol")}
            placeholderTextColor={colors.textSecondary}
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { backgroundColor: type === "above" ? colors.primary : colors.card },
              ]}
              onPress={() => setType("above")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === "above" ? "#FFFFFF" : colors.text },
                ]}
              >
                {t("alerts.priceAbove")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { backgroundColor: type === "below" ? colors.primary : colors.card },
              ]}
              onPress={() => setType("below")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === "below" ? "#FFFFFF" : colors.text },
                ]}
              >
                {t("alerts.priceBelow")}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t("alerts.targetPrice")}
            placeholderTextColor={colors.textSecondary}
            value={targetPrice}
            onChangeText={setTargetPrice}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t("alerts.note")}
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={handleCreate}
          >
            <Text style={styles.createButtonText}>{t("common.create")}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  input: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});