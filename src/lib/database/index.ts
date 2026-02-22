/**
 * Database utility functions for the Inventory Management System
 *
 * This module provides type-safe database operations and business logic
 * for interacting with the Supabase database schema.
 */

// @ts-nocheck - Supabase types are complex and cause inference issues
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

// Type aliases for better readability
type TypedSupabaseClient = ReturnType<typeof createClient>;
type Profile = Database['public']['Tables']['profiles']['Row'];
type MasterItem = Database['public']['Tables']['master_items']['Row'];
type InventoryTransaction =
  Database['public']['Tables']['inventory_transactions']['Row'];

// Insert types
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type MasterItemInsert = Database['public']['Tables']['master_items']['Insert'];
type InventoryTransactionInsert =
  Database['public']['Tables']['inventory_transactions']['Insert'];

// Update types
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type MasterItemUpdate = Database['public']['Tables']['master_items']['Update'];

/**
 * Database operation result type
 */
export type DatabaseResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Current inventory item type (computed from transactions)
 */
export type CurrentInventoryItem = {
  master_item_id: string;
  name: string;
  unit: string;
  current_quantity: number;
  total_value: number;
  last_transaction_date: string | null;
};

/**
 * FIFO removal result type
 */
export type FIFORemovalResult = {
  success: boolean;
  totalCost: number;
  error?: string;
};

/**
 * Profile operations
 */
export class ProfileService {
  constructor(private supabase: TypedSupabaseClient) {}

  async getProfile(userId: string): Promise<DatabaseResult<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch profile' };
    }
  }

  async ensureProfile(
    userId: string,
    email: string
  ): Promise<DatabaseResult<Profile>> {
    try {
      // First try to get existing profile
      const existingProfile = await this.getProfile(userId);

      if (existingProfile.data) {
        return existingProfile;
      }

      // If profile doesn't exist, create it
      const { data, error } = await this.supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: '',
          business_name: '',
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to ensure profile exists' };
    }
  }

  async updateProfile(
    userId: string,
    updates: ProfileUpdate
  ): Promise<DatabaseResult<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to update profile' };
    }
  }
}

/**
 * Master items operations
 */
export class MasterItemService {
  constructor(
    private supabase: TypedSupabaseClient,
    private profileService: ProfileService
  ) {}

  async getMasterItems(userId: string): Promise<DatabaseResult<MasterItem[]>> {
    try {
      const { data, error } = await this.supabase
        .from('master_items')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch master items' };
    }
  }

  async createMasterItem(
    item: MasterItemInsert
  ): Promise<DatabaseResult<MasterItem>> {
    try {
      // Ensure profile exists before creating master item
      if (item.user_id) {
        // Get user email from auth to create profile if needed
        const { data: authUser, error: authError } =
          await this.supabase.auth.getUser();

        if (authError || !authUser.user) {
          return { data: null, error: 'User not authenticated' };
        }

        const profileResult = await this.profileService.ensureProfile(
          item.user_id,
          authUser.user.email || ''
        );

        if (profileResult.error) {
          return {
            data: null,
            error: `Profile creation failed: ${profileResult.error}`,
          };
        }
      }

      const { data, error } = await this.supabase
        .from('master_items')
        .insert(item)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to create master item' };
    }
  }

  async updateMasterItem(
    itemId: string,
    updates: MasterItemUpdate
  ): Promise<DatabaseResult<MasterItem>> {
    try {
      const { data, error } = await this.supabase
        .from('master_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to update master item' };
    }
  }

  async deleteMasterItem(
    itemId: string,
    userId: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      // First check if the item can be deleted using the database function
      const { data: canDelete, error: checkError } = await this.supabase.rpc(
        'can_delete_master_item',
        {
          p_item_id: itemId,
          p_user_id: userId,
        }
      );

      if (checkError) {
        return { data: null, error: checkError.message };
      }

      if (!canDelete) {
        return {
          data: null,
          error: 'Cannot delete item that has inventory transactions',
        };
      }

      // Proceed with deletion
      const { error } = await this.supabase
        .from('master_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to delete master item' };
    }
  }
}

/**
 * Inventory operations
 */
export class InventoryService {
  constructor(private supabase: TypedSupabaseClient) {}

  async getCurrentInventory(
    userId: string
  ): Promise<DatabaseResult<CurrentInventoryItem[]>> {
    try {
      const { data, error } = await this.supabase.rpc('get_current_inventory', {
        p_user_id: userId,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch current inventory' };
    }
  }

  async getTransactionHistory(
    userId: string,
    masterItemId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<DatabaseResult<InventoryTransaction[]>> {
    try {
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
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch transaction history' };
    }
  }

  async addInventory(
    transaction: InventoryTransactionInsert
  ): Promise<DatabaseResult<InventoryTransaction>> {
    try {
      // For add transactions, set remaining_quantity equal to quantity
      const transactionData = {
        ...transaction,
        transaction_type: 'add' as const,
        remaining_quantity: transaction.quantity,
      };

      const { data, error } = await this.supabase
        .from('inventory_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to add inventory' };
    }
  }

  async removeInventory(
    userId: string,
    masterItemId: string,
    quantityToRemove: number,
    notes?: string
  ): Promise<DatabaseResult<FIFORemovalResult>> {
    try {
      // This is a simplified version - in a real implementation, you would
      // implement the full FIFO logic here or use a stored procedure

      // Get available inventory batches ordered by date (FIFO)
      const { data: batches, error: batchError } = await this.supabase
        .from('inventory_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('master_item_id', masterItemId)
        .eq('transaction_type', 'add')
        .gt('remaining_quantity', 0)
        .order('transaction_date', { ascending: true });

      if (batchError) {
        return { data: null, error: batchError.message };
      }

      // Check if sufficient inventory exists
      const totalAvailable =
        batches?.reduce((sum, batch) => sum + batch.remaining_quantity, 0) || 0;

      if (totalAvailable < quantityToRemove) {
        return {
          data: {
            success: false,
            totalCost: 0,
            error: 'Insufficient inventory',
          },
          error: null,
        };
      }

      // Calculate FIFO cost and update batches
      let remainingToRemove = quantityToRemove;
      let totalCost = 0;
      const updates: Array<{ id: string; remaining_quantity: number }> = [];

      for (const batch of batches || []) {
        if (remainingToRemove <= 0) break;

        const quantityFromThisBatch = Math.min(
          remainingToRemove,
          batch.remaining_quantity
        );
        const costFromThisBatch = quantityFromThisBatch * batch.unit_price;

        totalCost += costFromThisBatch;
        remainingToRemove -= quantityFromThisBatch;

        updates.push({
          id: batch.id,
          remaining_quantity: batch.remaining_quantity - quantityFromThisBatch,
        });
      }

      // Execute updates in a transaction
      const weightedAveragePrice = totalCost / quantityToRemove;

      // Update batch quantities
      for (const update of updates) {
        const { error: updateError } = await this.supabase
          .from('inventory_transactions')
          .update({ remaining_quantity: update.remaining_quantity })
          .eq('id', update.id);

        if (updateError) {
          return { data: null, error: updateError.message };
        }
      }

      // Create removal transaction record
      const { error: insertError } = await this.supabase
        .from('inventory_transactions')
        .insert({
          user_id: userId,
          master_item_id: masterItemId,
          transaction_type: 'remove',
          quantity: quantityToRemove,
          unit_price: weightedAveragePrice,
          remaining_quantity: 0,
          notes: notes || null,
        });

      if (insertError) {
        return { data: null, error: insertError.message };
      }

      return {
        data: { success: true, totalCost },
        error: null,
      };
    } catch (error) {
      return {
        data: {
          success: false,
          totalCost: 0,
          error: 'Failed to remove inventory',
        },
        error: null,
      };
    }
  }
}

/**
 * Main database service that combines all operations
 */
export class DatabaseService {
  public profiles: ProfileService;
  public masterItems: MasterItemService;
  public inventory: InventoryService;

  constructor(private supabase: TypedSupabaseClient) {
    this.profiles = new ProfileService(supabase);
    this.masterItems = new MasterItemService(supabase, this.profiles);
    this.inventory = new InventoryService(supabase);
  }
}

/**
 * Create a new database service instance
 */
export function createDatabaseService(): DatabaseService {
  const supabase = createClient();
  return new DatabaseService(supabase);
}

// Export types for use in components
export type {
  Profile,
  MasterItem,
  InventoryTransaction,
  ProfileInsert,
  MasterItemInsert,
  InventoryTransactionInsert,
  ProfileUpdate,
  MasterItemUpdate,
};
