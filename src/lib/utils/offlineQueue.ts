/**
 * Offline queue system for handling operations when offline
 * Stores operations in IndexedDB and syncs when back online
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface QueuedOperation {
  id: string;
  type:
    | 'add_inventory'
    | 'remove_inventory'
    | 'create_master_item'
    | 'update_master_item'
    | 'delete_master_item';
  data: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

export interface OperationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * IndexedDB wrapper for offline queue storage
 */
class OfflineStorage {
  private dbName = 'IMS_OfflineQueue';
  private version = 1;
  private storeName = 'operations';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  async add(operation: QueuedOperation): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async update(operation: QueuedOperation): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll(): Promise<QueuedOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getPending(): Promise<QueuedOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async remove(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * Offline queue manager
 */
export class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private storage: OfflineStorage;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  private constructor() {
    this.storage = new OfflineStorage();
    if (typeof window !== 'undefined') {
      this.initializeEventListeners();
      this.startPeriodicSync();
    }
  }

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  private initializeEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Check initial online status
    this.isOnline = navigator.onLine;
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingOperations();
      }
    }, 30000);
  }

  /**
   * Add operation to queue
   */
  async queueOperation(
    type: QueuedOperation['type'],
    data: unknown,
    maxRetries: number = 3
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      status: 'pending',
    };

    await this.storage.add(operation);
    this.emit('operationQueued', operation);

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingOperations();
    }

    return operation.id;
  }

  /**
   * Sync all pending operations
   */
  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.emit('syncStarted', true);

    try {
      const pendingOperations = await this.storage.getPending();

      for (const operation of pendingOperations) {
        await this.syncOperation(operation);
      }

      this.emit('syncCompleted', { success: true });
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('syncCompleted', { success: false, error });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync individual operation
   */
  private async syncOperation(operation: QueuedOperation): Promise<void> {
    try {
      // Mark as syncing
      operation.status = 'syncing';
      await this.storage.update(operation);

      // Execute the operation
      const result = await this.executeOperation(operation);

      if (result.success) {
        // Mark as completed and remove from queue
        operation.status = 'completed';
        await this.storage.remove(operation.id);
        this.emit('operationSynced', { operation, result });
      } else {
        // Handle failure
        operation.retryCount++;
        if (operation.retryCount >= operation.maxRetries) {
          operation.status = 'failed';
          operation.error = result.error;
          this.emit('operationFailed', { operation, error: result.error });
        } else {
          operation.status = 'pending';
        }
        await this.storage.update(operation);
      }
    } catch (error) {
      // Handle sync error
      operation.retryCount++;
      if (operation.retryCount >= operation.maxRetries) {
        operation.status = 'failed';
        operation.error =
          error instanceof Error ? error.message : 'Unknown error';
        this.emit('operationFailed', { operation, error: operation.error });
      } else {
        operation.status = 'pending';
      }
      await this.storage.update(operation);
    }
  }

  /**
   * Execute operation based on type
   */
  private async executeOperation(
    operation: QueuedOperation
  ): Promise<OperationResult> {
    try {
      // Import Supabase client dynamically to avoid SSR issues
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      switch (operation.type) {
        case 'add_inventory':
          return await this.executeAddInventory(supabase, operation.data);

        case 'remove_inventory':
          return await this.executeRemoveInventory(supabase, operation.data);

        case 'create_master_item':
          return await this.executeCreateMasterItem(supabase, operation.data);

        case 'update_master_item':
          return await this.executeUpdateMasterItem(supabase, operation.data);

        case 'delete_master_item':
          return await this.executeDeleteMasterItem(supabase, operation.data);

        default:
          return {
            success: false,
            error: `Unknown operation type: ${operation.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeAddInventory(
    supabase: any,
    data: any
  ): Promise<OperationResult> {
    const { error } = await supabase.from('inventory_transactions').insert({
      master_item_id: (data as any).master_item_id,
      transaction_type: 'add',
      quantity: (data as any).quantity,
      unit_price: (data as any).unit_price,
      remaining_quantity: (data as any).quantity,
      notes: (data as any).notes,
    });

    return { success: !error, error: error?.message };
  }

  private async executeRemoveInventory(
    supabase: any,
    data: any
  ): Promise<OperationResult> {
    // This would need to implement the FIFO logic
    // For now, simplified version
    const { error } = await supabase.from('inventory_transactions').insert({
      master_item_id: (data as any).master_item_id,
      transaction_type: 'remove',
      quantity: (data as any).quantity,
      unit_price: (data as any).unit_price || 0,
      remaining_quantity: 0,
      notes: (data as any).notes,
    });

    return { success: !error, error: error?.message };
  }

  private async executeCreateMasterItem(
    supabase: any,
    data: any
  ): Promise<OperationResult> {
    const { error } = await supabase.from('master_items').insert({
      name: (data as any).name,
      unit: (data as any).unit,
    });

    return { success: !error, error: error?.message };
  }

  private async executeUpdateMasterItem(
    supabase: any,
    data: any
  ): Promise<OperationResult> {
    const { error } = await supabase
      .from('master_items')
      .update({
        name: (data as any).name,
        unit: (data as any).unit,
      })
      .eq('id', (data as any).id);

    return { success: !error, error: error?.message };
  }

  private async executeDeleteMasterItem(
    supabase: any,
    data: any
  ): Promise<OperationResult> {
    const { error } = await supabase
      .from('master_items')
      .delete()
      .eq('id', (data as any).id);

    return { success: !error, error: error?.message };
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    total: number;
    pending: number;
    failed: number;
    operations: QueuedOperation[];
  }> {
    const operations = await this.storage.getAll();
    const pending = operations.filter(op => op.status === 'pending').length;
    const failed = operations.filter(op => op.status === 'failed').length;

    return {
      total: operations.length,
      pending,
      failed,
      operations,
    };
  }

  /**
   * Clear all operations
   */
  async clearQueue(): Promise<void> {
    await this.storage.clear();
    this.emit('queueCleared', true);
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations(): Promise<void> {
    const operations = await this.storage.getAll();
    const failedOperations = operations.filter(op => op.status === 'failed');

    for (const operation of failedOperations) {
      operation.status = 'pending';
      operation.retryCount = 0;
      operation.error = undefined;
      await this.storage.update(operation);
    }

    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: unknown[]) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: unknown) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners.clear();
  }
}

/**
 * Hook for using offline queue in React components
 */
export function useOfflineQueue() {
  const queueManager = OfflineQueueManager.getInstance();

  return {
    queueOperation: (
      type: QueuedOperation['type'],
      data: unknown,
      maxRetries?: number
    ) => queueManager.queueOperation(type, data, maxRetries),
    syncPendingOperations: () => queueManager.syncPendingOperations(),
    getQueueStatus: () => queueManager.getQueueStatus(),
    clearQueue: () => queueManager.clearQueue(),
    retryFailedOperations: () => queueManager.retryFailedOperations(),
    on: (event: string, callback: (...args: unknown[]) => void) =>
      queueManager.on(event, callback),
    off: (event: string, callback: (...args: unknown[]) => void) =>
      queueManager.off(event, callback),
  };
}
