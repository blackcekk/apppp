import { DCAPlan } from '@/types/portfolio';
import { safeAsyncStorageGet, safeAsyncStorageSet } from '@/utils/storage';

export class DCAPlanRepository {
  private static readonly STORAGE_KEY = 'dca_plans';

  static async getAll(): Promise<DCAPlan[]> {
    return await safeAsyncStorageGet<DCAPlan[]>(this.STORAGE_KEY, []);
  }

  static async save(plans: DCAPlan[]): Promise<void> {
    await safeAsyncStorageSet(this.STORAGE_KEY, plans);
  }

  static async add(plan: Omit<DCAPlan, 'id'>): Promise<DCAPlan> {
    const plans = await this.getAll();
    const newPlan: DCAPlan = {
      ...plan,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    plans.push(newPlan);
    await this.save(plans);
    return newPlan;
  }

  static async update(id: string, updates: Partial<DCAPlan>): Promise<DCAPlan | null> {
    const plans = await this.getAll();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    plans[index] = { ...plans[index], ...updates };
    await this.save(plans);
    return plans[index];
  }

  static async remove(id: string): Promise<boolean> {
    const plans = await this.getAll();
    const filteredPlans = plans.filter(p => p.id !== id);
    if (filteredPlans.length === plans.length) return false;
    
    await this.save(filteredPlans);
    return true;
  }

  static async getActive(): Promise<DCAPlan[]> {
    const plans = await this.getAll();
    return plans.filter(p => p.isActive);
  }

  static async getDue(): Promise<DCAPlan[]> {
    const plans = await this.getActive();
    const now = new Date();
    
    return plans.filter(plan => {
      const nextRun = new Date(plan.nextRunAt);
      return nextRun <= now;
    });
  }

  static calculateNextRunDate(frequency: DCAPlan['frequency'], fromDate: Date = new Date()): Date {
    const nextDate = new Date(fromDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    
    return nextDate;
  }

  static async updateNextRunDate(id: string): Promise<void> {
    const plan = await this.getById(id);
    if (!plan) return;
    
    const nextRunAt = this.calculateNextRunDate(plan.frequency).toISOString();
    await this.update(id, { nextRunAt });
  }

  static async getById(id: string): Promise<DCAPlan | null> {
    const plans = await this.getAll();
    return plans.find(p => p.id === id) || null;
  }
}