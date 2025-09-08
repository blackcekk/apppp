import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { router } from "expo-router";
import { Crown, TrendingUp, Bell, Shield } from "lucide-react-native";

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const features = [
    { icon: TrendingUp, text: t("subscription.unlimitedAssets") },
    { icon: Bell, text: t("subscription.advancedAlerts") },
    { icon: Shield, text: t("subscription.portfolioBackup") },
    { icon: Crown, text: t("subscription.premiumSupport") },
  ];

  const plans = [
    {
      id: "monthly",
      name: t("subscription.monthly"),
      price: "$9.99",
      period: t("subscription.perMonth"),
      popular: false,
    },
    {
      id: "yearly",
      name: t("subscription.yearly"),
      price: "$79.99",
      period: t("subscription.perYear"),
      popular: true,
      save: t("subscription.save33"),
    },
  ];

  const handleSubscribe = (planId: string) => {
    console.log("Subscribing to plan:", planId);
    // Implement subscription logic here
    router.back();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
              <Crown color={colors.primary} size={48} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t("subscription.title")}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("subscription.subtitle")}
            </Text>
          </View>

          <View style={styles.features}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.success + "20" }]}>
                  <feature.icon color={colors.success} size={20} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plans}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: colors.card, borderColor: plan.popular ? colors.primary : colors.border },
                  plan.popular && styles.popularPlan,
                ]}
                onPress={() => handleSubscribe(plan.id)}
              >
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.popularText}>{t("subscription.mostPopular")}</Text>
                  </View>
                )}
                <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: colors.text }]}>{plan.price}</Text>
                  <Text style={[styles.period, { color: colors.textSecondary }]}>{plan.period}</Text>
                </View>
                {plan.save && (
                  <Text style={[styles.save, { color: colors.success }]}>{plan.save}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.restoreButton, { borderColor: colors.border }]}
            onPress={() => console.log("Restore purchases")}
          >
            <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
              {t("subscription.restorePurchases")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>
              {t("common.close")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  features: {
    padding: 24,
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  plans: {
    padding: 24,
    gap: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  popularPlan: {
    borderWidth: 2,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
  },
  period: {
    fontSize: 16,
  },
  save: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  restoreButton: {
    margin: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  restoreText: {
    fontSize: 14,
  },
  closeButton: {
    alignItems: "center",
    paddingBottom: 40,
  },
  closeText: {
    fontSize: 16,
  },
});