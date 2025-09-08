import AsyncStorage from "@react-native-async-storage/async-storage";

export const safeJsonParse = <T>(data: string, fallback: T): T => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("JSON parse error:", error);
    return fallback;
  }
};

export const safeAsyncStorageGet = async <T>(
  key: string,
  fallback: T
): Promise<T> => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return fallback;
    return safeJsonParse(data, fallback);
  } catch (error) {
    console.error(`Error reading ${key} from AsyncStorage:`, error);
    return fallback;
  }
};

export const safeAsyncStorageSet = async (
  key: string,
  value: any
): Promise<boolean> => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, data);
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to AsyncStorage:`, error);
    return false;
  }
};

export const clearCorruptedData = async (): Promise<void> => {
  const keys = [
    "portfolio",
    "transactions",
    "alerts",
    "currency",
    "language",
    "theme",
    "hideBalances",
    "@portfolio/subscription",
  ];

  for (const key of keys) {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        // Try to parse the data
        try {
          if (key === "hideBalances" || key === "theme" || key === "currency" || key === "language") {
            // These are simple string values, not JSON
            continue;
          }
          JSON.parse(data);
        } catch {
          console.log(`Removing corrupted data for key: ${key}`);
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error(`Error checking ${key}:`, error);
    }
  }
};