import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PortfolioProvider } from "@/providers/PortfolioProvider";
import { AlertProvider } from "@/providers/AlertProvider";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { clearCorruptedData } from "@/utils/storage";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ presentation: "modal", title: "Premium" }} />
      <Stack.Screen name="asset-detail" options={{ title: "Asset Details" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Clear any corrupted data on startup
        await clearCorruptedData();
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <CurrencyProvider>
                <SubscriptionProvider>
                  <PortfolioProvider>
                    <AlertProvider>
                      <RootLayoutNav />
                    </AlertProvider>
                  </PortfolioProvider>
                </SubscriptionProvider>
              </CurrencyProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});