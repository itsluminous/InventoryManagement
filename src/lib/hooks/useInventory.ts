'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import {
  InventoryItem,
  InventoryTransactionWithItem,
} from '@/lib/types/inventory';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const supabase = createClient();

  const fetchInventory = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Use the database function to get current inventory
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any).rpc(
        'get_current_inventory',
        { p_user_id: user.id }
      );

      if (fetchError) {
        throw fetchError;
      }

      // Transform and sort items alphabetically by name
      const inventoryItems: InventoryItem[] = (data || [])
        .map(
          (item: {
            master_item_id: string;
            name: string;
            unit: string;
            current_quantity: number;
            total_value: number;
            last_transaction_date: string | null;
          }) => ({
            master_item_id: item.master_item_id,
            name: item.name,
            unit: item.unit,
            current_quantity: item.current_quantity,
            total_value: item.total_value,
            last_transaction_date: item.last_transaction_date,
          })
        )
        .filter((item: InventoryItem) => item.current_quantity > 0); // Filter out items with 0 quantity

      const sortedItems = inventoryItems.sort(
        (a: InventoryItem, b: InventoryItem) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

      setItems(sortedItems);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch inventory'
      );
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    items,
    loading,
    error,
    refetch: fetchInventory,
  };
}

export function useItemHistory(itemId: string) {
  const [transactions, setTransactions] = useState<
    InventoryTransactionWithItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    if (!user || !itemId) return;

    try {
      setLoading(true);
      setError(null);

      // Get transactions for the last 3 months by default
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data, error: fetchError } = await supabase
        .from('inventory_transactions')
        .select(
          `
          *,
          master_item:master_items(*)
        `
        )
        .eq('user_id', user.id)
        .eq('master_item_id', itemId)
        .gte('transaction_date', threeMonthsAgo.toISOString())
        .order('transaction_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching item history:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch item history'
      );
    } finally {
      setLoading(false);
    }
  }, [user, itemId, supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchHistory,
  };
}
