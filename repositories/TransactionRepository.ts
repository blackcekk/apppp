import { Transaction } from '@/types/portfolio';
import { safeAsyncStorageGet, safeAsyncStorageSet } from '@/utils/storage';

export class TransactionRepository {
  private static readonly STORAGE_KEY = 'transactions';

  static async getAll(): Promise<Transaction[]> {
    return await safeAsyncStorageGet<Transaction[]>(this.STORAGE_KEY, []);
  }

  static async save(transactions: Transaction[]): Promise<void> {
    await safeAsyncStorageSet(this.STORAGE_KEY, transactions);
  }

  static async add(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const transactions = await this.getAll();
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    transactions.push(newTransaction);
    await this.save(transactions);
    return newTransaction;
  }

  static async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const transactions = await this.getAll();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    transactions[index] = { ...transactions[index], ...updates };
    await this.save(transactions);
    return transactions[index];
  }

  static async remove(id: string): Promise<boolean> {
    const transactions = await this.getAll();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    if (filteredTransactions.length === transactions.length) return false;
    
    await this.save(filteredTransactions);
    return true;
  }

  static async getBySymbol(symbol: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(t => t.symbol === symbol);
  }

  static calculateAverageCost(transactions: Transaction[]): number {
    const buyTransactions = transactions.filter(t => t.side === 'buy');
    if (buyTransactions.length === 0) return 0;

    let totalCost = 0;
    let totalQuantity = 0;

    buyTransactions.forEach(t => {
      const cost = (t.price * t.quantity) + t.fee;
      totalCost += cost;
      totalQuantity += t.quantity;
    });

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  static calculatePnL(transactions: Transaction[], currentPrice: number): { realized: number; unrealized: number; totalQuantity: number } {
    let totalQuantity = 0;
    let totalCost = 0;
    let realizedPnL = 0;

    transactions.forEach(t => {
      if (t.side === 'buy') {
        totalQuantity += t.quantity;
        totalCost += (t.price * t.quantity) + t.fee;
      } else if (t.side === 'sell') {
        const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        realizedPnL += (t.price * t.quantity) - (avgCost * t.quantity) - t.fee;
        totalQuantity -= t.quantity;
        totalCost -= avgCost * t.quantity;
      } else if (t.side === 'dividend') {
        realizedPnL += t.quantity * t.price;
      } else if (t.side === 'fee') {
        realizedPnL -= t.fee;
      }
    });

    const unrealizedPnL = totalQuantity > 0 ? (currentPrice * totalQuantity) - totalCost : 0;

    return {
      realized: realizedPnL,
      unrealized: unrealizedPnL,
      totalQuantity: Math.max(0, totalQuantity)
    };
  }

  static async getTransactionStats(): Promise<{
    totalTransactions: number;
    totalBuys: number;
    totalSells: number;
    totalFees: number;
    totalDividends: number;
  }> {
    const transactions = await this.getAll();
    
    return {
      totalTransactions: transactions.length,
      totalBuys: transactions.filter(t => t.side === 'buy').length,
      totalSells: transactions.filter(t => t.side === 'sell').length,
      totalFees: transactions.filter(t => t.side === 'fee').reduce((sum, t) => sum + t.fee, 0),
      totalDividends: transactions.filter(t => t.side === 'dividend').reduce((sum, t) => sum + (t.quantity * t.price), 0)
    };
  }
}