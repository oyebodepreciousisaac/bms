import { localDb, PendingSyncItem } from './localDb';
import { supabaseService } from './supabaseService';
import { isSupabaseConfigured } from './supabase';

type SyncListener = (status: { isOnline: boolean; pendingCount: number; isSyncing: boolean }) => void;

class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    const pendingCount = await localDb.syncQueue
      .where('status')
      .equals('saved_locally')
      .count();

    this.listeners.forEach((fn) =>
      fn({
        isOnline: this.isOnline,
        pendingCount,
        isSyncing: this.isSyncing,
      })
    );
  }

  private handleOnline() {
    this.isOnline = true;
    this.processQueue();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notify();
  }

  public async queueOperation(entityType: PendingSyncItem['entityType'], id: string, payload: any) {
    await localDb.syncQueue.put({
      id,
      entityType,
      payload,
      status: 'saved_locally',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });
    this.notify();

    if (this.isOnline) {
      this.processQueue();
    }
  }

  public async processQueue() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    this.notify();

    try {
      const pendingItems = await localDb.syncQueue
        .where('status')
        .equals('saved_locally')
        .toArray();

      for (const item of pendingItems) {
        try {
          await localDb.syncQueue.update(item.id, { status: 'syncing' });

          if (isSupabaseConfigured) {
            if (item.entityType === 'SALE') {
              await supabaseService.processSale(item.payload);
            } else if (item.entityType === 'PAYMENT') {
              await supabaseService.recordDebtRepayment(item.payload);
            }
          }

          // Mark as successfully synced
          await localDb.syncQueue.update(item.id, {
            status: 'synced',
            lastAttempt: new Date().toISOString(),
          });
        } catch (err: any) {
          console.error(`Sync error on transaction ${item.id}:`, err);
          await localDb.syncQueue.update(item.id, {
            status: item.retryCount > 3 ? 'needs_review' : 'saved_locally',
            retryCount: item.retryCount + 1,
            lastAttempt: new Date().toISOString(),
            errorMessage: err.message || 'Network sync error',
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}

export const syncEngine = new SyncEngine();

