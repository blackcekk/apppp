import { ActionLog } from '@/types/portfolio';
import { safeAsyncStorageGet, safeAsyncStorageSet } from '@/utils/storage';

export class ActionLogRepository {
  private static readonly STORAGE_KEY = 'action_logs';
  private static readonly MAX_LOGS = 50;

  static async getAll(): Promise<ActionLog[]> {
    return await safeAsyncStorageGet<ActionLog[]>(this.STORAGE_KEY, []);
  }

  static async add(log: Omit<ActionLog, 'id' | 'timestamp'>): Promise<ActionLog> {
    const logs = await this.getAll();
    const newLog: ActionLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };

    logs.unshift(newLog); // Add to beginning
    
    // Keep only the latest MAX_LOGS entries
    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }

    await safeAsyncStorageSet(this.STORAGE_KEY, logs);
    return newLog;
  }

  static async getRecent(limit: number = 10): Promise<ActionLog[]> {
    const logs = await this.getAll();
    return logs.slice(0, limit);
  }

  static async clear(): Promise<void> {
    await safeAsyncStorageSet(this.STORAGE_KEY, []);
  }

  static async markAsUndone(id: string): Promise<void> {
    const logs = await this.getAll();
    const updatedLogs = logs.map(log => 
      log.id === id ? { ...log, canUndo: false } : log
    );
    await safeAsyncStorageSet(this.STORAGE_KEY, updatedLogs);
  }
}