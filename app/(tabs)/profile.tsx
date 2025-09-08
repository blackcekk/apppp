import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import {
  User,
  Globe,
  Moon,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Crown,
  DollarSign,
} from "lucide-react-native";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { currentCurrency, changeCurrency } = useCurrency();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      icon: Crown,
      title: t("profile.premium"),
      subtitle: t("profile.premiumDescription"),
      onPress: () => router.push("/subscription"),
      color: "#FFD700",
    },
    {
      icon: Globe,
      title: t("profile.language"),
      subtitle: currentLanguage === "en" ? "English" : "Türkçe",
      onPress: () => changeLanguage(currentLanguage === "en" ? "tr" : "en"),
    },
    {
      icon: DollarSign,
      title: t("profile.currency"),
      subtitle: currentCurrency,
      onPress: () => {
        const currencies = ["USD", "EUR", "TRY", "GBP"];
        const currentIndex = currencies.indexOf(currentCurrency);
        const nextIndex = (currentIndex + 1) % currencies.length;
        changeCurrency(currencies[nextIndex] as "USD" | "EUR" | "TRY" | "GBP");
      },
    },
    {
      icon: Bell,
      title: t("profile.notifications"),
      subtitle: t("profile.notificationsDescription"),
      onPress: () => {},
    },
    {
      icon: Shield,
      title: t("profile.privacy"),
      subtitle: t("profile.privacyDescription"),
      onPress: () => {},
    },
    {
      icon: HelpCircle,
      title: t("profile.help"),
      subtitle: t("profile.helpDescription"),
      onPress: () => {},
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <User color="#FFFFFF" size={32} />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>John Doe</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>john.doe@example.com</Text>
        </View>

        <View style={[styles.themeToggle, { backgroundColor: colors.card }]}>
          <View style={styles.themeToggleLeft}>
            <Moon color={colors.textSecondary} size={20} />
            <Text style={[styles.themeToggleText, { color: colors.text }]}>
              {t("profile.darkMode")}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <item.icon color={item.color || colors.textSecondary} size={20} />
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card }]}>
          <LogOut color={colors.error} size={20} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t("profile.logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: 24,
    paddingTop: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  themeToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  themeToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeToggleText: {
    fontSize: 16,
  },
  menu: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});