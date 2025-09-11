import Constants from 'expo-constants';
import { safeAsyncStorageGet, safeAsyncStorageSet } from '@/utils/storage';

export interface FXRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export interface IFXService {
  getFXRate(from: string, to: string): Promise<number>;
  convert(value: number, from: string, to: string): Promise<number>;
  getAllRates(): Promise<Record<string, FXRate>>;
  clearCache(): Promise<void>;
  getSupportedCurrencies(): string[];
}

class MockFXService implements IFXService {
  private readonly STORAGE_KEY = 'fx_rates';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private readonly BASE_RATES: Record<string, number> = {
    'USD': 1.0,
    'EUR': 0.85,
    'TRY': 27.5,
    'GBP': 0.73,
    'JPY': 110.0,
    'CAD': 1.25,
    'AUD': 1.35,
    'CHF': 0.92,
    'CNY': 6.45,
    'INR': 74.5,
  };

  async getFXRate(from: string, to: string): Promise<number> {
    if (!from?.trim() || !to?.trim() || from.length > 10 || to.length > 10) {
      return 1.0;
    }

    const fromCurrency = from.trim().toUpperCase();
    const toCurrency = to.trim().toUpperCase();
    
    if (fromCurrency === toCurrency) return 1.0;

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = await this.getCachedRate(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.rate;
    }

    const rate = this.generateFXRate(fromCurrency, toCurrency);
    await this.cacheRate(cacheKey, rate);
    
    return rate;
  }

  async convert(value: number, from: string, to: string): Promise<number> {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    if (!from?.trim() || !to?.trim()) return value;
    
    const rate = await this.getFXRate(from, to);
    return value * rate;
  }

  async getAllRates(): Promise<Record<string, FXRate>> {
    return await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
  }

  async clearCache(): Promise<void> {
    await safeAsyncStorageSet(this.STORAGE_KEY, {});
  }

  getSupportedCurrencies(): string[] {
    return Object.keys(this.BASE_RATES);
  }

  private generateFXRate(from: string, to: string): number {
    const fromRate = this.BASE_RATES[from] || 1.0;
    const toRate = this.BASE_RATES[to] || 1.0;
    
    const volatility = (Math.random() - 0.5) * 0.04;
    const baseRate = toRate / fromRate;
    
    return baseRate * (1 + volatility);
  }

  private async getCachedRate(cacheKey: string): Promise<FXRate | null> {
    try {
      const rates = await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
      return rates[cacheKey] || null;
    } catch {
      return null;
    }
  }

  private async cacheRate(cacheKey: string, rate: number): Promise<void> {
    try {
      const rates = await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
      const [from, to] = cacheKey.split('_');
      
      rates[cacheKey] = {
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
      };
      
      await safeAsyncStorageSet(this.STORAGE_KEY, rates);
    } catch (error) {
      console.error('Error caching FX rate:', error);
    }
  }

  private isCacheValid(timestamp: string): boolean {
    const cacheTime = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - cacheTime) < this.CACHE_DURATION;
  }
}

class RemoteFXService implements IFXService {
  private readonly baseUrl: string;
  private readonly STORAGE_KEY = 'fx_rates_remote';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour for remote

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getFXRate(from: string, to: string): Promise<number> {
    if (!from?.trim() || !to?.trim() || from.length > 10 || to.length > 10) {
      return 1.0;
    }

    const fromCurrency = from.trim().toUpperCase();
    const toCurrency = to.trim().toUpperCase();
    
    if (fromCurrency === toCurrency) return 1.0;

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = await this.getCachedRate(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.rate;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/fx/rate?from=${fromCurrency}&to=${toCurrency}`,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const rate = data.rate || 1.0;
      
      await this.cacheRate(cacheKey, rate);
      return rate;
    } catch (error) {
      console.error('Remote FX rate error:', error);
      return cached?.rate || 1.0;
    }
  }

  async convert(value: number, from: string, to: string): Promise<number> {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    if (!from?.trim() || !to?.trim()) return value;
    
    const rate = await this.getFXRate(from, to);
    return value * rate;
  }

  async getAllRates(): Promise<Record<string, FXRate>> {
    return await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
  }

  async clearCache(): Promise<void> {
    await safeAsyncStorageSet(this.STORAGE_KEY, {});
  }

  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'TRY', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
  }

  private async getCachedRate(cacheKey: string): Promise<FXRate | null> {
    try {
      const rates = await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
      return rates[cacheKey] || null;
    } catch {
      return null;
    }
  }

  private async cacheRate(cacheKey: string, rate: number): Promise<void> {
    try {
      const rates = await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
      const [from, to] = cacheKey.split('_');
      
      rates[cacheKey] = {
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
      };
      
      await safeAsyncStorageSet(this.STORAGE_KEY, rates);
    } catch (error) {
      console.error('Error caching remote FX rate:', error);
    }
  }

  private isCacheValid(timestamp: string): boolean {
    const cacheTime = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - cacheTime) < this.CACHE_DURATION;
  }
}

export class FXServiceFactory {
  private static instance: IFXService | null = null;

  static getInstance(): IFXService {
    if (!this.instance) {
      const provider = Constants.expoConfig?.extra?.fxProvider || 'mock';
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://toolkit.rork.com';

      console.log(`Initializing FX provider: ${provider}`);

      if (provider === 'remote') {
        this.instance = new RemoteFXService(apiBaseUrl);
      } else {
        this.instance = new MockFXService();
      }
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

export const fxService = FXServiceFactory.getInstance();