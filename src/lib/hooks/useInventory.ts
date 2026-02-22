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

export function useItemHistory(itemId: string, pageSize: number = 20) {
  const [transactions, setTransactions] = useState<
    InventoryTransactionWithItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const { user } = useAuthContext();
  const supabase = createClient();

  const fetchHistory = useCallback(
    async (page: number = 0, append: boolean = false) => {
      if (!user || !itemId) return;

      try {
        setLoading(true);
        setError(null);

        // Get total count first
        const { count, error: countError } = await supabase
          .from('inventory_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('master_item_id', itemId);

        if (countError) {
          throw countError;
        }

        setTotalCount(count || 0);

        // Get paginated transactions
        const from = page * pageSize;
        const to = from + pageSize - 1;

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
          .order('transaction_date', { ascending: false })
          .range(from, to);

        if (fetchError) {
          throw fetchError;
        }

        const newTransactions = data || [];

        if (append) {
          setTransactions(prev => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }

        setHasMore(
          newTransactions.length === pageSize && (count || 0) > to + 1
        );
        setCurrentPage(page);
      } catch (err) {
        console.error('Error fetching item history:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch item history'
        );
      } finally {
        setLoading(false);
      }
    },
    [user, itemId, supabase, pageSize]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchHistory(currentPage + 1, true);
    }
  }, [fetchHistory, currentPage, loading, hasMore]);

  const refresh = useCallback(() => {
    fetchHistory(0, false);
  }, [fetchHistory]);

  useEffect(() => {
    fetchHistory(0, false);
  }, [fetchHistory]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    loadMore,
    refetch: refresh,
  };
}
