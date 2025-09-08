import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes } from "@/constants/themes";

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem("theme");
      if (saved) {
        setIsDark(saved === "dark");
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  };

  const toggleTheme = useCallback(async () => {
    try {
      const newTheme = !isDark;
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
      setIsDark(newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  }, [isDark]);

  const colors = isDark ? themes.dark : themes.light;

  return useMemo(() => ({
    isDark,
    toggleTheme,
    colors,
  }), [isDark, toggleTheme, colors]);
});