import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type SubscriptionTier = 'free' | 'basic' | 'premium';

interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  features: {
    maxAssets: number;
    maxAlerts: number;
    realTimeData: boolean;
    advancedCharts: boolean;
    exportData: boolean;
    multiCurrency: boolean;
    darkMode: boolean;
  };
}

const SUBSCRIPTION_KEY = '@portfolio/subscription';

const tierFeatures: Record<SubscriptionTier, SubscriptionState['features']> = {
  free: {
    maxAssets: 5,
    maxAlerts: 3,
    realTimeData: false,
    advancedCharts: false,
    exportData: false,
    multiCurrency: false,
    darkMode: false,
  },
  basic: {
    maxAssets: 20,
    maxAlerts: 10,
    realTimeData: true,
    advancedCharts: false,
    exportData: true,
    multiCurrency: true,
    darkMode: true,
  },
  premium: {
    maxAssets: -1, // unlimited
    maxAlerts: -1, // unlimited
    realTimeData: true,
    advancedCharts: true,
    exportData: true,
    multiCurrency: true,
    darkMode: true,
  },
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: 'free',
    expiresAt: null,
    features: tierFeatures.free,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSubscription = async () => {
    try {
      const saved = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Check if subscription is expired
          if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
            // Subscription expired, revert to free
            await setTier('free');
          } else {
            setSubscription({
              ...parsed,
              features: tierFeatures[parsed.tier as SubscriptionTier],
            });
          }
        } catch (parseError) {
          console.error("Error parsing subscription data:", parseError);
          await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
          setSubscription({
            tier: 'free',
            expiresAt: null,
            features: tierFeatures.free,
          });
        }
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      setSubscription({
        tier: 'free',
        expiresAt: null,
        features: tierFeatures.free,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setTier = useCallback(async (tier: SubscriptionTier, expiresAt?: string) => {
    try {
      const newSubscription = {
        tier,
        expiresAt: expiresAt || null,
        features: tierFeatures[tier],
      };
      
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify({
        tier,
        expiresAt: expiresAt || null,
      }));
      
      setSubscription(newSubscription);
    } catch (error) {
      console.error("Error saving subscription:", error);
      throw error;
    }
  }, []);

  const purchaseSubscription = useCallback(async (tier: SubscriptionTier) => {
    // This is a mock implementation
    // In production, integrate with Play Billing v6 for Android
    // and StoreKit2 for iOS
    
    if (Platform.OS === 'web') {
      // Web payment flow (Stripe, PayPal, etc.)
      console.log('Web payment not implemented');
      // Mock successful purchase
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (tier === 'basic' ? 1 : 12));
      await setTier(tier, expiresAt.toISOString());
      return true;
    }
    
    // Mobile in-app purchase flow
    // TODO: Implement actual IAP
    console.log('Mobile IAP not implemented');
    
    // Mock successful purchase
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (tier === 'basic' ? 1 : 12));
    await setTier(tier, expiresAt.toISOString());
    
    return true;
  }, [setTier]);

  const restorePurchases = useCallback(async () => {
    // Mock restore
    // In production, check with app stores
    console.log('Restore purchases not implemented');
    return false;
  }, []);

  const canUseFeature = useCallback((feature: keyof SubscriptionState['features']) => {
    const value = subscription.features[feature];
    return value === true || value === -1 || (typeof value === 'number' && value > 0);
  }, [subscription]);

  const getRemainingQuota = useCallback((feature: 'maxAssets' | 'maxAlerts') => {
    const value = subscription.features[feature];
    return value === -1 ? Infinity : value;
  }, [subscription]);

  return useMemo(() => ({
    subscription,
    isLoading,
    setTier,
    purchaseSubscription,
    restorePurchases,
    canUseFeature,
    getRemainingQuota,
  }), [subscription, isLoading, setTier, purchaseSubscription, restorePurchases, canUseFeature, getRemainingQuota]);
});