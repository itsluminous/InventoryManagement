'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { ReportData, TrendData, DateRange } from '@/lib/types/inventory';

// Mock transaction data structure for internal processing
interface MockTransaction {
  id: string;
  user_id: string;
  master_item_id: string;
  transaction_type: 'add' | 'remove';
  quantity: number;
  unit_price: number;
  transaction_date: string;
  master_item?: {
    name: string;
    unit: string;
  };
}

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  // Memoize the Supabase client to prevent unnecessary re-renders
  const supabase = useMemo(() => createClient(), []);

  const generateReport = useCallback(
    async (
      dateRange: DateRange,
      selectedItems: string[],
      period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'week'
    ): Promise<ReportData[]> => {
      if (!user) return [];

      try {
        setLoading(true);
        setError(null);

        // Build the query for transactions within date range
        let query = supabase
          .from('inventory_transactions')
          .select(
            `
          *,
          master_item:master_items(name, unit)
        `
          )
          .eq('user_id', user.id)
          .gte('transaction_date', dateRange.start.toISOString())
          .lte('transaction_date', dateRange.end.toISOString())
          .order('transaction_date', { ascending: true });

        // Filter by selected items if specified
        if (selectedItems.length > 0) {
          query = query.in('master_item_id', selectedItems);
        }

        const { data: transactions, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // Group transactions by period
        const groupedData = groupTransactionsByPeriod(
          transactions || [],
          period
        );

        return groupedData;
      } catch (err) {
        console.error('Error generating report:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to generate report'
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user, supabase]
  );

  const generateTrendData = useCallback(
    async (
      dateRange: DateRange,
      selectedItems: string[]
    ): Promise<TrendData[]> => {
      if (!user) return [];

      try {
        setLoading(true);
        setError(null);

        // Get transactions for trend analysis
        let query = supabase
          .from('inventory_transactions')
          .select(
            `
          *,
          master_item:master_items(name, unit)
        `
          )
          .eq('user_id', user.id)
          .eq('transaction_type', 'remove') // Only outgoing for expense trends
          .gte('transaction_date', dateRange.start.toISOString())
          .lte('transaction_date', dateRange.end.toISOString())
          .order('transaction_date', { ascending: true });

        if (selectedItems.length > 0) {
          query = query.in('master_item_id', selectedItems);
        }

        const { data: transactions, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // Group by week for trend analysis
        const trendData = groupTransactionsForTrend(transactions || []);

        return trendData;
      } catch (err) {
        console.error('Error generating trend data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to generate trend data'
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user, supabase]
  );

  return {
    generateReport,
    generateTrendData,
    loading,
    error,
  };
}

// Helper function to group transactions by period
function groupTransactionsByPeriod(
  transactions: MockTransaction[],
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
): ReportData[] {
  const groups: { [key: string]: ReportData } = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.transaction_date);
    let periodKey: string;

    switch (period) {
      case 'day':
        periodKey = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        periodKey = `${date.getFullYear()}`;
        break;
      default:
        periodKey = date.toISOString().split('T')[0];
    }

    if (!groups[periodKey]) {
      groups[periodKey] = {
        period: periodKey,
        incoming_quantity: 0,
        incoming_value: 0,
        outgoing_quantity: 0,
        outgoing_value: 0,
        net_expense: 0,
      };
    }

    const group = groups[periodKey];
    const totalPrice = transaction.quantity * transaction.unit_price;

    if (transaction.transaction_type === 'add') {
      group.incoming_quantity += transaction.quantity;
      group.incoming_value += totalPrice;
    } else {
      group.outgoing_quantity += transaction.quantity;
      group.outgoing_value += totalPrice;
    }

    group.net_expense = group.outgoing_value - group.incoming_value;
  });

  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
}

// Helper function to group transactions for trend analysis
function groupTransactionsForTrend(
  transactions: MockTransaction[]
): TrendData[] {
  const groups: { [key: string]: TrendData } = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.transaction_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!groups[weekKey]) {
      groups[weekKey] = {
        week: weekKey,
        expense: 0,
        items: {},
      };
    }

    const group = groups[weekKey];
    const totalPrice = transaction.quantity * transaction.unit_price;
    const itemName = transaction.master_item?.name || 'Unknown';

    group.expense += totalPrice;
    group.items[itemName] = (group.items[itemName] || 0) + totalPrice;
  });

  return Object.values(groups).sort((a, b) => a.week.localeCompare(b.week));
}
