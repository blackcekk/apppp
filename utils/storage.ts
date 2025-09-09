import AsyncStorage from "@react-native-async-storage/async-storage";

export const safeJsonParse = <T>(data: string, fallback: T): T => {
  try {
    if (!data || data.trim() === '') {
      return fallback;
    }
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.error("JSON parse error for data:", data?.substring(0, 100), error);
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
    "@portfolio/assets",
    "@portfolio/transactions",
  ];

  for (const key of keys) {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        // Try to parse the data
        try {
          if (key === "hideBalances" || key === "theme" || key === "currency" || key === "language") {
            // These are simple string values, not JSON
            // But still validate they are proper strings
            if (typeof data !== 'string' || data.includes('object') || data.includes('{')) {
              console.log(`Removing corrupted string data for key: ${key}`);
              await AsyncStorage.removeItem(key);
            }
            continue;
          }
          const parsed = JSON.parse(data);
          // Additional validation for arrays
          if (key === "portfolio" || key === "transactions" || key === "alerts") {
            if (!Array.isArray(parsed)) {
              console.log(`Removing non-array data for key: ${key}`);
              await AsyncStorage.removeItem(key);
            }
          }
        } catch {
          console.log(`Removing corrupted data for key: ${key}`);
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error(`Error checking ${key}:`, error);
      // If there's an error accessing the key, try to remove it
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        console.error(`Error removing corrupted key ${key}:`, removeError);
      }
    }
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('All AsyncStorage data cleared');
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
  }
};