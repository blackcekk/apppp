import Constants from 'expo-constants';
import { IMarketService } from './IMarketService';
import { MockMarketProvider } from './MockMarketProvider';
import { RestMarketProvider } from './RestMarketProvider';
import { PublicCryptoWSProvider } from './PublicCryptoWSProvider';

export class MarketServiceFactory {
  private static instance: IMarketService | null = null;

  static getInstance(): IMarketService {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  static reset(): void {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
  }

  private static createProvider(): IMarketService {
    const provider = Constants.expoConfig?.extra?.marketProvider || 'mock';
    const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://toolkit.rork.com';

    console.log(`Initializing market provider: ${provider}`);

    switch (provider) {
      case 'crypto_ws':
        return new PublicCryptoWSProvider();
      
      case 'rest':
        return new RestMarketProvider(`${apiBaseUrl}/market`);
      
      case 'mock':
      default:
        return new MockMarketProvider();
    }
  }

  static switchProvider(provider: 'mock' | 'crypto_ws' | 'rest'): void {
    this.reset();
    
    switch (provider) {
      case 'crypto_ws':
        this.instance = new PublicCryptoWSProvider();
        break;
      
      case 'rest':
        const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://toolkit.rork.com';
        this.instance = new RestMarketProvider(`${apiBaseUrl}/market`);
        break;
      
      case 'mock':
      default:
        this.instance = new MockMarketProvider();
        break;
    }
  }
}

export const marketService = MarketServiceFactory.getInstance();