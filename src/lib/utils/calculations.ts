/**
 * Inventory value calculation utilities
 * Implements total value calculations and real-time updates
 */

import { InventoryItem, InventoryTransaction } from '@/lib/types/inventory';

/**
 * Calculates the total value of inventory items
 * Implements total price calculation
 * @param items - Array of inventory items
 * @returns Total value with precision maintained
 */
export function calculateTotalInventoryValue(items: InventoryItem[]): number {
  if (!items || items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => {
    // Ensure we're working with valid numbers
    const itemValue =
      typeof item.total_value === 'number' && isFinite(item.total_value)
        ? item.total_value
        : 0;
    return sum + itemValue;
  }, 0);

  // Maintain precision to 2 decimal places
  return Number(total.toFixed(2));
}

/**
 * Calculates the value of a single inventory item
 * @param quantity - Current quantity
 * @param unitPrice - Price per unit
 * @returns Item value with precision
 */
export function calculateItemValue(
  quantity: number,
  unitPrice: number
): number {
  if (
    !isFinite(quantity) ||
    !isFinite(unitPrice) ||
    quantity < 0 ||
    unitPrice < 0
  ) {
    return 0;
  }

  const value = quantity * unitPrice;
  return Number(value.toFixed(2));
}

/**
 * Calculates inventory summary statistics
 * Implements real-time calculation consistency
 * @param items - Array of inventory items
 * @returns Summary with total items, value, and statistics
 */
export function calculateInventorySummary(items: InventoryItem[]) {
  if (!items || items.length === 0) {
    return {
      total_items: 0,
      total_value: 0,
      low_stock_items: 0,
      items_with_value: 0,
      average_item_value: 0,
    };
  }

  const totalValue = calculateTotalInventoryValue(items);
  const itemsWithValue = items.filter(item => item.total_value > 0).length;
  const lowStockItems = items.filter(item => item.current_quantity <= 5).length; // Configurable threshold
  const averageItemValue = itemsWithValue > 0 ? totalValue / itemsWithValue : 0;

  return {
    total_items: items.length,
    total_value: totalValue,
    low_stock_items: lowStockItems,
    items_with_value: itemsWithValue,
    average_item_value: Number(averageItemValue.toFixed(2)),
  };
}

/**
 * Calculates transaction totals for reporting
 * @param transactions - Array of transactions
 * @param transactionType - Filter by transaction type ('add' | 'remove' | 'all')
 * @returns Total value and quantity for the specified transaction type
 */
export function calculateTransactionTotals(
  transactions: InventoryTransaction[],
  transactionType: 'add' | 'remove' | 'all' = 'all'
) {
  if (!transactions || transactions.length === 0) {
    return {
      total_quantity: 0,
      total_value: 0,
      transaction_count: 0,
    };
  }

  const filteredTransactions =
    transactionType === 'all'
      ? transactions
      : transactions.filter(t => t.transaction_type === transactionType);

  const totalQuantity = filteredTransactions.reduce((sum, transaction) => {
    const quantity =
      typeof transaction.quantity === 'number' && isFinite(transaction.quantity)
        ? transaction.quantity
        : 0;
    return sum + quantity;
  }, 0);

  const totalValue = filteredTransactions.reduce((sum, transaction) => {
    const value =
      typeof transaction.total_price === 'number' &&
      isFinite(transaction.total_price)
        ? transaction.total_price
        : 0;
    return sum + value;
  }, 0);

  return {
    total_quantity: Number(totalQuantity.toFixed(3)), // Allow 3 decimal places for quantity
    total_value: Number(totalValue.toFixed(2)), // 2 decimal places for currency
    transaction_count: filteredTransactions.length,
  };
}

/**
 * Calculates weighted average price from transactions
 * Used for FIFO calculations and reporting
 * @param transactions - Array of add transactions
 * @returns Weighted average price
 */
export function calculateWeightedAveragePrice(
  transactions: InventoryTransaction[]
): number {
  if (!transactions || transactions.length === 0) {
    return 0;
  }

  // Only consider 'add' transactions for weighted average
  const addTransactions = transactions.filter(
    t => t.transaction_type === 'add'
  );

  if (addTransactions.length === 0) {
    return 0;
  }

  let totalValue = 0;
  let totalQuantity = 0;

  for (const transaction of addTransactions) {
    const quantity =
      typeof transaction.quantity === 'number' && isFinite(transaction.quantity)
        ? transaction.quantity
        : 0;
    const unitPrice =
      typeof transaction.unit_price === 'number' &&
      isFinite(transaction.unit_price)
        ? transaction.unit_price
        : 0;

    totalValue += quantity * unitPrice;
    totalQuantity += quantity;
  }

  if (totalQuantity === 0) {
    return 0;
  }

  const weightedAverage = totalValue / totalQuantity;
  return Number(weightedAverage.toFixed(2));
}

/**
 * Validates calculation inputs to ensure data integrity
 * @param value - Value to validate
 * @param type - Type of validation ('quantity' | 'price' | 'value')
 * @returns True if valid, false otherwise
 */
export function validateCalculationInput(
  value: unknown,
  type: 'quantity' | 'price' | 'value'
): boolean {
  if (typeof value !== 'number' || !isFinite(value)) {
    return false;
  }

  switch (type) {
    case 'quantity':
      return value >= 0; // Quantities can be zero but not negative
    case 'price':
      return value >= 0; // Prices can be zero but not negative
    case 'value':
      return value >= 0; // Values can be zero but not negative
    default:
      return false;
  }
}

/**
 * Rounds a number to specified decimal places with proper precision
 * Ensures consistent rounding behavior across calculations
 * @param value - Value to round
 * @param decimalPlaces - Number of decimal places (default: 2 for currency)
 * @returns Rounded value (handles -0 vs 0 properly)
 */
export function roundToPrecision(
  value: number,
  decimalPlaces: number = 2
): number {
  if (!isFinite(value)) {
    return 0;
  }

  const multiplier = Math.pow(10, decimalPlaces);
  const rounded = Math.round(value * multiplier) / multiplier;

  // Handle -0 vs 0 issue by converting -0 to 0
  return rounded === 0 ? 0 : rounded;
}
