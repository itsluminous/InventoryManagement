import { createClient } from '@/lib/supabase/client';
import {
  AddInventoryData,
  RemoveInventoryData,
  FIFORemovalResult,
  InventoryBatch,
  InventoryItem,
} from '@/lib/types/inventory';
import { calculateItemValue, roundToPrecision } from '@/lib/utils/calculations';

// Type for the RPC response
type GetCurrentInventoryResponse = {
  master_item_id: string;
  name: string;
  unit: string;
  current_quantity: number;
  total_value: number;
  last_transaction_date: string | null;
};

export class InventoryService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any = createClient();

  /**
   * Add inventory with precise value calculations
   * Implements calculation precision and consistency
   */
  async addInventory(userId: string, data: AddInventoryData): Promise<void> {
    // Validate and calculate precise values
    const quantity = roundToPrecision(data.quantity, 3); // Allow 3 decimal places for quantity
    const unitPrice = roundToPrecision(data.unit_price, 2); // 2 decimal places for price
    // Note: totalPrice calculation is handled by database as stored generated column

    const insertData = {
      user_id: userId,
      master_item_id: data.master_item_id,
      transaction_type: 'add' as const,
      quantity,
      unit_price: unitPrice,
      remaining_quantity: quantity, // For FIFO tracking
      notes: data.notes,
      // total_price is calculated by database as stored generated column
    };

    const { error } = await this.supabase
      .from('inventory_transactions')
      .insert(insertData);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Remove inventory using FIFO (First In, First Out) method
   * Processes oldest inventory batches first and calculates weighted average cost
   */
  async removeInventory(
    userId: string,
    data: RemoveInventoryData
  ): Promise<FIFORemovalResult> {
    try {
      // Start a transaction to ensure data consistency
      const result = await this.performFIFORemoval(userId, data);
      return result;
    } catch (error) {
      return {
        success: false,
        totalCost: 0,
        error:
          error instanceof Error ? error.message : 'Failed to remove inventory',
      };
    }
  }

  /**
   * Core FIFO removal logic with batch processing
   */
  private async performFIFORemoval(
    userId: string,
    data: RemoveInventoryData
  ): Promise<FIFORemovalResult> {
    // Get available inventory batches ordered by date (FIFO)
    const batches = await this.getAvailableBatches(userId, data.master_item_id);

    if (!batches.length) {
      return {
        success: false,
        totalCost: 0,
        error: 'No inventory available for this item',
      };
    }

    // Check if sufficient inventory exists
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + batch.remaining_quantity,
      0
    );

    if (totalAvailable < data.quantity) {
      return {
        success: false,
        totalCost: 0,
        error: `Insufficient inventory. Available: ${totalAvailable}, Requested: ${data.quantity}`,
      };
    }

    // Calculate FIFO removal and prepare batch updates
    const removalPlan = this.calculateFIFORemoval(batches, data.quantity);

    // Execute the removal plan
    await this.executeFIFORemoval(userId, data, removalPlan);

    return {
      success: true,
      totalCost: removalPlan.totalCost,
      weightedAveragePrice: removalPlan.weightedAveragePrice,
      batchesAffected: removalPlan.batchUpdates.length,
    };
  }

  /**
   * Get available inventory batches for FIFO processing
   */
  private async getAvailableBatches(
    userId: string,
    masterItemId: string
  ): Promise<InventoryBatch[]> {
    const { data, error } = await this.supabase
      .from('inventory_transactions')
      .select('id, quantity, unit_price, remaining_quantity, transaction_date')
      .eq('user_id', userId)
      .eq('master_item_id', masterItemId)
      .eq('transaction_type', 'add')
      .gt('remaining_quantity', 0)
      .order('transaction_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch inventory batches: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate FIFO removal plan with precise calculations
   * Maintains calculation precision and consistency
   */
  private calculateFIFORemoval(
    batches: InventoryBatch[],
    quantityToRemove: number
  ) {
    let remainingToRemove = quantityToRemove;
    let totalCost = 0;
    const batchUpdates: Array<{
      id: string;
      newRemainingQuantity: number;
      quantityUsed: number;
    }> = [];

    for (const batch of batches) {
      if (remainingToRemove <= 0) break;

      const quantityFromThisBatch = Math.min(
        remainingToRemove,
        batch.remaining_quantity
      );

      // Use precise calculation utility
      const costFromThisBatch = calculateItemValue(
        quantityFromThisBatch,
        batch.unit_price
      );

      totalCost += costFromThisBatch;
      remainingToRemove -= quantityFromThisBatch;

      batchUpdates.push({
        id: batch.id,
        newRemainingQuantity: roundToPrecision(
          batch.remaining_quantity - quantityFromThisBatch,
          3
        ),
        quantityUsed: quantityFromThisBatch,
      });
    }

    // Calculate weighted average price with precision
    const weightedAveragePrice =
      quantityToRemove > 0
        ? roundToPrecision(totalCost / quantityToRemove, 2)
        : 0;

    return {
      totalCost: roundToPrecision(totalCost, 2),
      weightedAveragePrice,
      batchUpdates,
    };
  }

  /**
   * Execute the FIFO removal plan by updating batches and creating removal record
   */
  private async executeFIFORemoval(
    userId: string,
    data: RemoveInventoryData,
    removalPlan: {
      totalCost: number;
      weightedAveragePrice: number;
      batchUpdates: Array<{
        id: string;
        newRemainingQuantity: number;
        quantityUsed: number;
      }>;
    }
  ): Promise<void> {
    // Update batch remaining quantities
    for (const update of removalPlan.batchUpdates) {
      const updateData = {
        remaining_quantity: update.newRemainingQuantity,
      };

      const { error: updateError } = await this.supabase
        .from('inventory_transactions')
        .update(updateData)
        .eq('id', update.id);

      if (updateError) {
        throw new Error(
          `Failed to update batch ${update.id}: ${updateError.message}`
        );
      }
    }

    // Create removal transaction record
    const insertData = {
      user_id: userId,
      master_item_id: data.master_item_id,
      transaction_type: 'remove' as const,
      quantity: data.quantity,
      unit_price: removalPlan.weightedAveragePrice,
      remaining_quantity: 0, // Removal transactions don't have remaining quantity
      notes: data.notes || null,
    };

    const { error: insertError } = await this.supabase
      .from('inventory_transactions')
      .insert(insertData);

    if (insertError) {
      throw new Error(
        `Failed to create removal record: ${insertError.message}`
      );
    }
  }

  /**
   * Get current inventory levels for a user
   */
  async getCurrentInventory(userId: string): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase.rpc('get_current_inventory', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to fetch current inventory: ${error.message}`);
    }

    return (data || []).map((item: GetCurrentInventoryResponse) => ({
      master_item_id: item.master_item_id,
      name: item.name,
      unit: item.unit,
      current_quantity: item.current_quantity,
      total_value: item.total_value,
      last_transaction_date: item.last_transaction_date,
    }));
  }

  /**
   * Get transaction history for an item
   */
  async getTransactionHistory(
    userId: string,
    masterItemId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    let query = this.supabase
      .from('inventory_transactions')
      .select(
        `
        *,
        master_items (
          id,
          name,
          unit
        )
      `
      )
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (masterItemId) {
      query = query.eq('master_item_id', masterItemId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }

    return data || [];
  }
}

export const inventoryService = new InventoryService();
