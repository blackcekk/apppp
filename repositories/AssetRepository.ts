import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, Transaction, PriceHistory } from '@/types/portfolio';

const ASSETS_KEY = '@portfolio/assets';
const TRANSACTIONS_KEY = '@portfolio/transactions';
const PRICE_HISTORY_KEY = '@portfolio/price_history';

export class AssetRepository {
  async getAssets(): Promise<Asset[]> {
    try {
      const data = await AsyncStorage.getItem(ASSETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading assets:', error);
      return [];
    }
  }

  async saveAssets(assets: Asset[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error('Error saving assets:', error);
      throw error;
    }
  }

  async addAsset(asset: Asset): Promise<void> {
    const assets = await this.getAssets();
    assets.push(asset);
    await this.saveAssets(assets);
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
    const assets = await this.getAssets();
    const index = assets.findIndex(a => a.id === id);
    if (index !== -1) {
      assets[index] = { ...assets[index], ...updates };
      await this.saveAssets(assets);
    }
  }

  async deleteAsset(id: string): Promise<void> {
    const assets = await this.getAssets();
    const filtered = assets.filter(a => a.id !== id);
    await this.saveAssets(filtered);
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw error;
    }
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.push(transaction);
    await this.saveTransactions(transactions);
  }

  async getPriceHistory(symbol: string): Promise<PriceHistory | null> {
    try {
      const key = `${PRICE_HISTORY_KEY}_${symbol}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading price history:', error);
      return null;
    }
  }

  async savePriceHistory(history: PriceHistory): Promise<void> {
    try {
      const key = `${PRICE_HISTORY_KEY}_${history.symbol}`;
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving price history:', error);
      throw error;
    }
  }
}

export const assetRepository = new AssetRepository();