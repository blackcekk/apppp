import { safeAsyncStorageGet, safeAsyncStorageSet } from '@/utils/storage';

export interface FXRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export class FXServiceMock {
  private static readonly STORAGE_KEY = 'fx_rates';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private static readonly BASE_RATES: Record<string, number> = {
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

  static async getFXRate(from: string, to: string): Promise<number> {
    if (from === to) return 1.0;

    const cacheKey = `${from}_${to}`;
    const cached = await this.getCachedRate(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.rate;
    }

    const rate = this.generateFXRate(from, to);
    await this.cacheRate(cacheKey, rate);
    
    return rate;
  }

  private static generateFXRate(from: string, to: string): number {
    const fromRate = this.BASE_RATES[from] || 1.0;
    const toRate = this.BASE_RATES[to] || 1.0;
    
    // Add some daily volatility (±2%)
    const volatility = (Math.random() - 0.5) * 0.04;
    const baseRate = toRate / fromRate;
    
    return baseRate * (1 + volatility);
  }

  private static async getCachedRate(cacheKey: string): Promise<FXRate | null> {
    try {
      const rates = await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
      return rates[cacheKey] || null;
    } catch {
      return null;
    }
  }

  private static async cacheRate(cacheKey: string, rate: number): Promise<void> {
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

  private static isCacheValid(timestamp: string): boolean {
    const cacheTime = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - cacheTime) < this.CACHE_DURATION;
  }

  static async convert(value: number, from: string, to: string): Promise<number> {
    if (from === to) return value;
    
    const rate = await this.getFXRate(from, to);
    return value * rate;
  }

  static async getAllRates(): Promise<Record<string, FXRate>> {
    return await safeAsyncStorageGet<Record<string, FXRate>>(this.STORAGE_KEY, {});
  }

  static async clearCache(): Promise<void> {
    await safeAsyncStorageSet(this.STORAGE_KEY, {});
  }

  static getSupportedCurrencies(): string[] {
    return Object.keys(this.BASE_RATES);
  }
}