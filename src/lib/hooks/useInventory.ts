'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { InventoryItem, InventoryTransactionWithItem } from '@/lib/types/inventory';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const supabase = createClient();

  const fetchInventory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Use the database function to get current inventory
      const { data, error: fetchError } = await supabase
        .rpc('get_current_inventory', { p_user_id: user.id });

      if (fetchError) {
        throw fetchError;
      }

      // Sort items alphabetically by name
      const sortedItems = (data || []).sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

      setItems(sortedItems);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  return {
    items,
    loading,
    error,
    refetch: fetchInventory,
  };
}

export function useItemHistory(itemId: string) {
  const [transactions, setTransactions] = useState<InventoryTransactionWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const supabase = createClient();

  const fetchHistory = async () => {
    if (!user || !itemId) return;

    try {
      setLoading(true);
      setError(null);

      // Get transactions for the last 3 months by default
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data, error: fetchError } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          master_item:master_items(*)
        `)
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
      setError(err instanceof Error ? err.message : 'Failed to fetch item history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, itemId]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchHistory,
  };
}