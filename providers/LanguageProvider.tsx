import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "@/constants/translations";

type Language = "en" | "tr";

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem("language");
      if (saved) {
        setCurrentLanguage(saved as Language);
      }
    } catch (error) {
      console.error("Error loading language:", error);
    }
  };

  const changeLanguage = useCallback(async (language: Language) => {
    try {
      await AsyncStorage.setItem("language", language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split(".");
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }, [currentLanguage]);

  return useMemo(() => ({
    currentLanguage,
    changeLanguage,
    t,
  }), [currentLanguage, changeLanguage, t]);
});