/**
 * Offline-aware inventory service that queues operations when offline
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { OfflineQueueManager } from '@/lib/utils/offlineQueue';
import { createClient } from '@/lib/supabase/client';

export interface AddInventoryData {
  master_item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface RemoveInventoryData {
  master_item_id: string;
  quantity: number;
  notes?: string;
}

export interface MasterItemData {
  id?: string;
  name: string;
  unit: string;
}

/**
 * Offline-aware inventory service
 */
export class OfflineInventoryService {
  private static instance: OfflineInventoryService;
  private queueManager: OfflineQueueManager;
  private supabase = createClient();

  private constructor() {
    this.queueManager = OfflineQueueManager.getInstance();
  }

  static getInstance(): OfflineInventoryService {
    if (!OfflineInventoryService.instance) {
      OfflineInventoryService.instance = new OfflineInventoryService();
    }
    return OfflineInventoryService.instance;
  }

  /**
   * Add inventory - works offline
   */
  async addInventory(
    data: AddInventoryData
  ): Promise<{ success: boolean; error?: string; operationId?: string }> {
    // Check if online
    if (navigator.onLine) {
      try {
        // Try direct operation first
        const { error } = await (this.supabase as any)
          .from('inventory_transactions')
          .insert({
            master_item_id: data.master_item_id,
            transaction_type: 'add',
            quantity: data.quantity,
            unit_price: data.unit_price,
            remaining_quantity: data.quantity,
            notes: data.notes,
          });

        if (!error) {
          return { success: true };
        }

        // If direct operation fails, queue it
        const operationId = await this.queueManager.queueOperation(
          'add_inventory',
          data
        );
        return { success: true, operationId };
      } catch (error) {
        // Network error, queue the operation
        const operationId = await this.queueManager.queueOperation(
          'add_inventory',
          data
        );
        return { success: true, operationId };
      }
    } else {
      // Offline, queue the operation
      const operationId = await this.queueManager.queueOperation(
        'add_inventory',
        data
      );
      return { success: true, operationId };
    }
  }

  /**
   * Remove inventory - works offline
   */
  async removeInventory(
    data: RemoveInventoryData
  ): Promise<{ success: boolean; error?: string; operationId?: string }> {
    // Check if online
    if (navigator.onLine) {
      try {
        // For remove operations, we need to implement FIFO logic
        // This is a simplified version - in production, you'd call the proper FIFO service
        const { error } = await (this.supabase as any)
          .from('inventory_transactions')
          .insert({
            master_item_id: data.master_item_id,
            transaction_type: 'remove',
            quantity: data.quantity,
            unit_price: 0, // This would be calculated by FIFO logic
            remaining_quantity: 0,
            notes: data.notes,
          });

        if (!error) {
          return { success: true };
        }

        // If direct operation fails, queue it
        const operationId = await this.queueManager.queueOperation(
          'remove_inventory',
          data
        );
        return { success: true, operationId };
      } catch (error) {
        // Network error, queue the operation
        const operationId = await this.queueManager.queueOperation(
          'remove_inventory',
          data
        );
        return { success: true, operationId };
      }
    } else {
      // Offline, queue the operation
      const operationId = await this.queueManager.queueOperation(
        'remove_inventory',
        data
      );
      return { success: true, operationId };
    }
  }

  /**
   * Create master item - works offline
   */
  async createMasterItem(
    data: MasterItemData
  ): Promise<{ success: boolean; error?: string; operationId?: string }> {
    // Check if online
    if (navigator.onLine) {
      try {
        // Try direct operation first
        const { error } = await (this.supabase as any)
          .from('master_items')
          .insert({
            name: data.name,
            unit: data.unit,
          });

        if (!error) {
          return { success: true };
        }

        // If direct operation fails, queue it
        const operationId = await this.queueManager.queueOperation(
          'create_master_item',
          data
        );
        return { success: true, operationId };
      } catch (error) {
        // Network error, queue the operation
        const operationId = await this.queueManager.queueOperation(
          'create_master_item',
          data
        );
        return { success: true, operationId };
      }
    } else {
      // Offline, queue the operation
      const operationId = await this.queueManager.queueOperation(
        'create_master_item',
        data
      );
      return { success: true, operationId };
    }
  }

  /**
   * Update master item - works offline
   */
  async updateMasterItem(
    data: MasterItemData
  ): Promise<{ success: boolean; error?: string; operationId?: string }> {
    if (!data.id) {
      return { success: false, error: 'Master item ID is required for update' };
    }

    // Check if online
    if (navigator.onLine) {
      try {
        // Try direct operation first
        const { error } = await (this.supabase as any)
          .from('master_items')
          .update({
            name: data.name,
            unit: data.unit,
          })
          .eq('id', data.id);

        if (!error) {
          return { success: true };
        }

        // If direct operation fails, queue it
        const operationId = await this.queueManager.queueOperation(
          'update_master_item',
          data
        );
        return { success: true, operationId };
      } catch (error) {
        // Network error, queue the operation
        const operationId = await this.queueManager.queueOperation(
          'update_master_item',
          data
        );
        return { success: true, operationId };
      }
    } else {
      // Offline, queue the operation
      const operationId = await this.queueManager.queueOperation(
        'update_master_item',
        data
      );
      return { success: true, operationId };
    }
  }

  /**
   * Delete master item - works offline
   */
  async deleteMasterItem(
    id: string
  ): Promise<{ success: boolean; error?: string; operationId?: string }> {
    // Check if online
    if (navigator.onLine) {
      try {
        // Try direct operation first
        const { error } = await this.supabase
          .from('master_items')
          .delete()
          .eq('id', id);

        if (!error) {
          return { success: true };
        }

        // If direct operation fails, queue it
        const operationId = await this.queueManager.queueOperation(
          'delete_master_item',
          { id }
        );
        return { success: true, operationId };
      } catch (error) {
        // Network error, queue the operation
        const operationId = await this.queueManager.queueOperation(
          'delete_master_item',
          { id }
        );
        return { success: true, operationId };
      }
    } else {
      // Offline, queue the operation
      const operationId = await this.queueManager.queueOperation(
        'delete_master_item',
        { id }
      );
      return { success: true, operationId };
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    return this.queueManager.getQueueStatus();
  }

  /**
   * Sync pending operations
   */
  async syncPendingOperations() {
    return this.queueManager.syncPendingOperations();
  }

  /**
   * Clear queue
   */
  async clearQueue() {
    return this.queueManager.clearQueue();
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations() {
    return this.queueManager.retryFailedOperations();
  }
}

/**
 * Hook for using offline inventory service
 */
export function useOfflineInventoryService() {
  const service = OfflineInventoryService.getInstance();

  return {
    addInventory: (data: AddInventoryData) => service.addInventory(data),
    removeInventory: (data: RemoveInventoryData) =>
      service.removeInventory(data),
    createMasterItem: (data: MasterItemData) => service.createMasterItem(data),
    updateMasterItem: (data: MasterItemData) => service.updateMasterItem(data),
    deleteMasterItem: (id: string) => service.deleteMasterItem(id),
    getQueueStatus: () => service.getQueueStatus(),
    syncPendingOperations: () => service.syncPendingOperations(),
    clearQueue: () => service.clearQueue(),
    retryFailedOperations: () => service.retryFailedOperations(),
  };
}
