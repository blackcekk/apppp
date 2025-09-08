import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "@/types/alert";

export const [AlertProvider, useAlerts] = createContextHook(() => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const saved = await AsyncStorage.getItem("alerts");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAlerts(parsed);
        } catch (parseError) {
          console.error("Error parsing alerts data:", parseError);
          await AsyncStorage.removeItem("alerts");
          setAlerts([]);
        }
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAlerts([]);
    }
  };

  const saveAlerts = async (newAlerts: Alert[]) => {
    try {
      await AsyncStorage.setItem("alerts", JSON.stringify(newAlerts));
      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error saving alerts:", error);
    }
  };

  const addAlert = useCallback((alert: Omit<Alert, "id">) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
    };
    saveAlerts([...alerts, newAlert]);
  }, [alerts]);

  const removeAlert = useCallback((id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id));
  }, [alerts]);

  const toggleAlert = useCallback((id: string) => {
    const updated = alerts.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    );
    saveAlerts(updated);
  }, [alerts]);

  return useMemo(() => ({
    alerts,
    addAlert,
    removeAlert,
    toggleAlert,
  }), [alerts, addAlert, removeAlert, toggleAlert]);
});