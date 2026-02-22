import { createClient } from '@/lib/supabase/client';
import { AddInventoryData, RemoveInventoryData } from '@/lib/types/inventory';

export class InventoryService {
  private supabase = createClient();

  async addInventory(userId: string, data: AddInventoryData): Promise<void> {
    const { error } = await this.supabase
      .from('inventory_transactions')
      .insert({
        user_id: userId,
        master_item_id: data.master_item_id,
        transaction_type: 'add',
        quantity: data.quantity,
        unit_price: data.unit_price,
        remaining_quantity: data.quantity, // For FIFO tracking
        notes: data.notes,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  async removeInventory(userId: string, data: RemoveInventoryData): Promise<void> {
    // TODO: Implement FIFO removal logic in task 7
    throw new Error('Remove inventory functionality will be implemented in task 7');
  }
}

export const inventoryService = new InventoryService();