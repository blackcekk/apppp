import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Currency = "USD" | "EUR" | "TRY" | "GBP";

export const [CurrencyProvider, useCurrency] = createContextHook(() => {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>("USD");

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const saved = await AsyncStorage.getItem("currency");
      if (saved) {
        setCurrentCurrency(saved as Currency);
      }
    } catch (error) {
      console.error("Error loading currency:", error);
    }
  };

  const changeCurrency = useCallback(async (currency: Currency) => {
    try {
      await AsyncStorage.setItem("currency", currency);
      setCurrentCurrency(currency);
    } catch (error) {
      console.error("Error saving currency:", error);
    }
  }, []);

  const getCurrencySymbol = useCallback((currency: Currency = currentCurrency) => {
    const symbols: Record<Currency, string> = {
      USD: "$",
      EUR: "€",
      TRY: "₺",
      GBP: "£",
    };
    return symbols[currency];
  }, [currentCurrency]);

  return useMemo(() => ({
    currentCurrency,
    changeCurrency,
    getCurrencySymbol,
  }), [currentCurrency, changeCurrency, getCurrencySymbol]);
});