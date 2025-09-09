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
  ScrollView,

} from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAlerts } from "@/providers/AlertProvider";
import { NotificationType } from "@/types/alert";
import { X, Bell, AlarmClock, Smartphone } from "lucide-react-native";
import SymbolSearch from "@/components/SymbolSearch";

interface CreateAlertModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateAlertModal({ visible, onClose }: CreateAlertModalProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { addAlert, notificationService } = useAlerts();

  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [type, setType] = useState<"above" | "below">("above");
  const [note, setNote] = useState("");
  const [notificationType, setNotificationType] = useState<NotificationType>("app");

  const handleSymbolSelect = (selectedSymbol: string, currentPrice: number) => {
    setSymbol(selectedSymbol);
    if (!targetPrice) {
      setTargetPrice(currentPrice.toString());
    }
  };

  const handleCreate = async () => {
    if (!symbol || !targetPrice) return;

    // Check permissions based on notification type
    const permissionStatus = notificationService.getPermissionStatus(notificationType);
    
    if (!permissionStatus.hasPermission && permissionStatus.canRequest) {
      let permissionGranted = false;
      
      if (notificationType === 'app' || notificationType === 'both') {
        permissionGranted = await notificationService.requestNotificationPermission();
      }
      
      if (notificationType === 'alarm' || notificationType === 'both') {
        permissionGranted = await notificationService.requestAlarmPermission();
      }
      
      if (!permissionGranted) {
        console.log('Permission denied for notification type:', notificationType);
        return;
      }
    }

    addAlert({
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      type,
      note,
      enabled: true,
      notificationType,
    });

    setSymbol("");
    setTargetPrice("");
    setNote("");
    setNotificationType("app");
    setType("above");
    onClose();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'app':
        return <Bell size={20} color={colors.text} />;
      case 'alarm':
        return <AlarmClock size={20} color={colors.text} />;
      case 'both':
        return <Smartphone size={20} color={colors.text} />;
      default:
        return <Bell size={20} color={colors.text} />;
    }
  };

  const getNotificationLabel = (type: NotificationType) => {
    switch (type) {
      case 'app':
        return t("alerts.appNotification");
      case 'alarm':
        return t("alerts.phoneAlarm");
      case 'both':
        return t("alerts.bothNotifications");
      default:
        return t("alerts.appNotification");
    }
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

          <ScrollView showsVerticalScrollIndicator={false}>
            <SymbolSearch
              value={symbol}
              onChangeText={setSymbol}
              onSelectSymbol={handleSymbolSelect}
              placeholder={t("alerts.symbol")}
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

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("alerts.notificationType")}
            </Text>
            
            <View style={styles.notificationTypeSelector}>
              {(['app', 'alarm', 'both'] as NotificationType[]).map((type) => {
                const isSelected = notificationType === type;
                const permissionStatus = notificationService.getPermissionStatus(type);
                
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.notificationTypeButton,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setNotificationType(type)}
                  >
                    <View style={styles.notificationTypeContent}>
                      {getNotificationIcon(type)}
                      <Text
                        style={[
                          styles.notificationTypeText,
                          { color: isSelected ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {getNotificationLabel(type)}
                      </Text>
                      {!permissionStatus.hasPermission && permissionStatus.canRequest && (
                        <Text
                          style={[
                            styles.permissionText,
                            { color: isSelected ? "#FFFFFF" : colors.textSecondary },
                          ]}
                        >
                          {t("alerts.permissionRequired")}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t("alerts.note")}
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </ScrollView>

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
    maxHeight: '90%',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  notificationTypeSelector: {
    gap: 12,
    marginBottom: 16,
  },
  notificationTypeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationTypeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationTypeText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  permissionText: {
    fontSize: 12,
    fontStyle: "italic",
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