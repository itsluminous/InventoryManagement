'use client';

import { useMemo } from 'react';
import { InventoryItem, InventoryTransaction } from '@/lib/types/inventory';
import {
  calculateTotalInventoryValue,
  calculateInventorySummary,
  calculateTransactionTotals,
  calculateWeightedAveragePrice,
} from '@/lib/utils/calculations';

/**
 * Hook for real-time inventory value calculations
 * Implements real-time updates and calculation consistency
 */
export function useInventoryCalculations(items: InventoryItem[]) {
  // Memoize calculations to prevent unnecessary recalculations
  const calculations = useMemo(() => {
    const totalValue = calculateTotalInventoryValue(items);
    const summary = calculateInventorySummary(items);

    return {
      totalValue,
      summary,
      itemCount: items.length,
      hasItems: items.length > 0,
    };
  }, [items]);

  return calculations;
}

/**
 * Hook for transaction-based calculations
 * Used for item history and reporting calculations
 */
export function useTransactionCalculations(
  transactions: InventoryTransaction[]
) {
  const calculations = useMemo(() => {
    const addTotals = calculateTransactionTotals(transactions, 'add');
    const removeTotals = calculateTransactionTotals(transactions, 'remove');
    const allTotals = calculateTransactionTotals(transactions, 'all');
    const weightedAverage = calculateWeightedAveragePrice(transactions);

    // Calculate net values (incoming - outgoing)
    const netQuantity = addTotals.total_quantity - removeTotals.total_quantity;
    const netValue = addTotals.total_value - removeTotals.total_value;

    return {
      incoming: addTotals,
      outgoing: removeTotals,
      total: allTotals,
      net: {
        quantity: Number(netQuantity.toFixed(3)),
        value: Number(netValue.toFixed(2)),
      },
      weightedAveragePrice: weightedAverage,
      hasTransactions: transactions.length > 0,
    };
  }, [transactions]);

  return calculations;
}

/**
 * Hook for item-specific calculations
 * Calculates values for a single inventory item
 */
export function useItemCalculations(
  item: InventoryItem | null,
  transactions: InventoryTransaction[] = []
) {
  const calculations = useMemo(() => {
    if (!item) {
      return {
        currentValue: 0,
        averagePrice: 0,
        transactionSummary: null,
        hasData: false,
      };
    }

    const itemTransactions = transactions.filter(
      t => t.master_item_id === item.master_item_id
    );

    // Calculate transaction summary directly without using hook
    const addTotals = calculateTransactionTotals(itemTransactions, 'add');
    const removeTotals = calculateTransactionTotals(itemTransactions, 'remove');
    const allTotals = calculateTransactionTotals(itemTransactions, 'all');
    const weightedAverage = calculateWeightedAveragePrice(itemTransactions);

    // Calculate net values (incoming - outgoing)
    const netQuantity = addTotals.total_quantity - removeTotals.total_quantity;
    const netValue = addTotals.total_value - removeTotals.total_value;

    const transactionSummary = {
      incoming: addTotals,
      outgoing: removeTotals,
      total: allTotals,
      net: {
        quantity: Number(netQuantity.toFixed(3)),
        value: Number(netValue.toFixed(2)),
      },
      weightedAveragePrice: weightedAverage,
      hasTransactions: itemTransactions.length > 0,
    };

    const averagePrice = calculateWeightedAveragePrice(itemTransactions);

    return {
      currentValue: item.total_value,
      averagePrice,
      transactionSummary,
      hasData: true,
    };
  }, [item, transactions]);

  return calculations;
}

/**
 * Hook for real-time value updates
 * Provides formatted values with currency symbols
 */
export function useFormattedInventoryValues(items: InventoryItem[]) {
  const { totalValue, summary } = useInventoryCalculations(items);

  const formattedValues = useMemo(() => {
    // Import formatCurrency dynamically to avoid circular dependencies
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(amount)
        .replace('₹', '₹'); // Ensure proper rupee symbol
    };

    return {
      totalValue: formatCurrency(totalValue),
      averageItemValue: formatCurrency(summary.average_item_value),
      summary: {
        ...summary,
        total_value_formatted: formatCurrency(summary.total_value),
        average_item_value_formatted: formatCurrency(
          summary.average_item_value
        ),
      },
    };
  }, [totalValue, summary]);

  return formattedValues;
}
