import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "@/types/alert";
import { safeAsyncStorageGet, safeAsyncStorageSet } from "@/utils/storage";
import { notificationService } from "@/services/notificationService";

export const [AlertProvider, useAlerts] = createContextHook(() => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadAlerts();
    notificationService.initialize();
  }, []);

  const loadAlerts = async () => {
    try {
      const alerts = await safeAsyncStorageGet<Alert[]>("alerts", []);
      // Migrate old alerts to include notificationType
      const migratedAlerts = alerts.map(alert => ({
        ...alert,
        notificationType: alert.notificationType || 'app' as const
      }));
      setAlerts(migratedAlerts);
      
      // Save migrated alerts if any were updated
      if (migratedAlerts.some((alert, index) => !alerts[index]?.notificationType)) {
        await safeAsyncStorageSet("alerts", migratedAlerts);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAlerts([]);
    }
  };

  const saveAlerts = async (newAlerts: Alert[]) => {
    const success = await safeAsyncStorageSet("alerts", newAlerts);
    if (success) {
      setAlerts(newAlerts);
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
    notificationService,
  }), [alerts, addAlert, removeAlert, toggleAlert]);
});