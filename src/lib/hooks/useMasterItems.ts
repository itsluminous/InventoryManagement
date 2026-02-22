'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { MasterItem } from '@/lib/types/inventory';

export function useMasterItems() {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const supabase = createClient();

  const fetchMasterItems = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('master_items')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setItems(data || []);
    } catch (err) {
      console.error('Error fetching master items:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch master items'
      );
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchMasterItems();
  }, [fetchMasterItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchMasterItems,
  };
}
