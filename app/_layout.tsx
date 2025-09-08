import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PortfolioProvider } from "@/providers/PortfolioProvider";
import { AlertProvider } from "@/providers/AlertProvider";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";

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
      <Stack.Screen name="subscription" options={{ presentation: "modal", title: "Premium" }} />
      <Stack.Screen name="asset-detail" options={{ title: "Asset Details" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
          <ThemeProvider>
            <CurrencyProvider>
              <SubscriptionProvider>
                <PortfolioProvider>
                  <AlertProvider>
                    <RootLayoutNav />
                  </AlertProvider>
                </PortfolioProvider>
              </SubscriptionProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}