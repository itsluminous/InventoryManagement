/**
 * Property-based tests for inventory calculations
 * **Property 5: Inventory Calculation Consistency**
 */

import * as fc from 'fast-check';
import {
  calculateTotalInventoryValue,
  calculateItemValue,
  calculateInventorySummary,
  calculateTransactionTotals,
  calculateWeightedAveragePrice,
  validateCalculationInput,
  roundToPrecision,
} from '../calculations';
import { InventoryItem, InventoryTransaction } from '@/lib/types/inventory';

// Arbitraries for generating test data
const inventoryItemArbitrary = fc.record({
  master_item_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  unit: fc.constantFrom('kg', 'qty', 'liters', 'pieces'),
  current_quantity: fc.float({ min: 0, max: 1000, noNaN: true }),
  total_value: fc.float({ min: 0, max: 100000, noNaN: true }),
  last_transaction_date: fc.date().map(d => d.toISOString()),
}) as fc.Arbitrary<InventoryItem>;

const transactionArbitrary = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  master_item_id: fc.uuid(),
  transaction_type: fc.constantFrom('add', 'remove') as fc.Arbitrary<
    'add' | 'remove'
  >,
  quantity: fc.float({ min: Math.fround(0.001), max: 1000, noNaN: true }),
  unit_price: fc.float({ min: 0, max: 1000, noNaN: true }),
  total_price: fc.float({ min: 0, max: 100000, noNaN: true }),
  remaining_quantity: fc.float({ min: 0, max: 1000, noNaN: true }),
  transaction_date: fc.date().map(d => d.toISOString()),
  notes: fc.option(fc.string(), { nil: null }),
  created_at: fc.date().map(d => d.toISOString()),
}) as fc.Arbitrary<InventoryTransaction>;

describe('Property 5: Inventory Calculation Consistency', () => {
  describe('calculateTotalInventoryValue properties', () => {
    it('should always return a non-negative finite number', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { maxLength: 100 }),
          items => {
            const total = calculateTotalInventoryValue(items);

            expect(typeof total).toBe('number');
            expect(isFinite(total)).toBe(true);
            expect(total).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be commutative (order independent)', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { minLength: 2, maxLength: 20 }),
          items => {
            const total1 = calculateTotalInventoryValue(items);
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            const total2 = calculateTotalInventoryValue(shuffled);

            expect(Math.abs(total1 - total2)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should equal sum of individual item values', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { maxLength: 50 }),
          items => {
            const total = calculateTotalInventoryValue(items);
            const manualSum = items.reduce(
              (sum, item) => sum + (item.total_value || 0),
              0
            );

            expect(Math.abs(total - manualSum)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalInventoryValue([])).toBe(0);
    });

    it('should handle items with zero values correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            inventoryItemArbitrary.map(item => ({ ...item, total_value: 0 })),
            { maxLength: 20 }
          ),
          items => {
            const total = calculateTotalInventoryValue(items);
            expect(total).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateItemValue properties', () => {
    it('should always return non-negative values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          (quantity, unitPrice) => {
            const value = calculateItemValue(quantity, unitPrice);

            expect(value).toBeGreaterThanOrEqual(0);
            expect(isFinite(value)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be commutative (quantity * price = price * quantity)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: 1000, noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: 1000, noNaN: true }),
          (quantity, unitPrice) => {
            const value1 = calculateItemValue(quantity, unitPrice);
            const value2 = calculateItemValue(unitPrice, quantity);

            expect(Math.abs(value1 - value2)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain precision to 2 decimal places', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: 1000, noNaN: true }),
          fc.float({ min: Math.fround(0.001), max: 1000, noNaN: true }),
          (quantity, unitPrice) => {
            const value = calculateItemValue(quantity, unitPrice);

            // Should have at most 2 decimal places
            const decimalPart = value.toString().split('.')[1];
            if (decimalPart) {
              expect(decimalPart.length).toBeLessThanOrEqual(2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when either quantity or price is 0', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1000, noNaN: true }), value => {
          expect(calculateItemValue(0, value)).toBe(0);
          expect(calculateItemValue(value, 0)).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateInventorySummary properties', () => {
    it('should always return valid summary structure', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { maxLength: 100 }),
          items => {
            const summary = calculateInventorySummary(items);

            expect(summary).toHaveProperty('total_items');
            expect(summary).toHaveProperty('total_value');
            expect(summary).toHaveProperty('low_stock_items');
            expect(summary).toHaveProperty('items_with_value');
            expect(summary).toHaveProperty('average_item_value');

            expect(summary.total_items).toBe(items.length);
            expect(summary.total_value).toBeGreaterThanOrEqual(0);
            expect(summary.low_stock_items).toBeGreaterThanOrEqual(0);
            expect(summary.items_with_value).toBeGreaterThanOrEqual(0);
            expect(summary.average_item_value).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent total_items count', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { maxLength: 50 }),
          items => {
            const summary = calculateInventorySummary(items);
            expect(summary.total_items).toBe(items.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have items_with_value <= total_items', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { maxLength: 50 }),
          items => {
            const summary = calculateInventorySummary(items);
            expect(summary.items_with_value).toBeLessThanOrEqual(
              summary.total_items
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateTransactionTotals properties', () => {
    it('should return consistent totals for transaction types', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { maxLength: 50 }),
          transactions => {
            const addTotals = calculateTransactionTotals(transactions, 'add');
            const removeTotals = calculateTransactionTotals(
              transactions,
              'remove'
            );
            const allTotals = calculateTransactionTotals(transactions, 'all');

            expect(addTotals.transaction_count).toBeLessThanOrEqual(
              transactions.length
            );
            expect(removeTotals.transaction_count).toBeLessThanOrEqual(
              transactions.length
            );
            expect(allTotals.transaction_count).toBe(transactions.length);

            expect(
              addTotals.transaction_count + removeTotals.transaction_count
            ).toBe(allTotals.transaction_count);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain non-negative totals', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { maxLength: 50 }),
          transactions => {
            const totals = calculateTransactionTotals(transactions);

            expect(totals.total_quantity).toBeGreaterThanOrEqual(0);
            expect(totals.total_value).toBeGreaterThanOrEqual(0);
            expect(totals.transaction_count).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateWeightedAveragePrice properties', () => {
    it('should return 0 for empty transactions', () => {
      expect(calculateWeightedAveragePrice([])).toBe(0);
    });

    it('should return unit price for single transaction', () => {
      fc.assert(
        fc.property(
          transactionArbitrary.filter(t => t.transaction_type === 'add'),
          transaction => {
            const avgPrice = calculateWeightedAveragePrice([transaction]);
            expect(Math.abs(avgPrice - transaction.unit_price)).toBeLessThan(
              0.01
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be within range of min and max unit prices', () => {
      fc.assert(
        fc.property(
          fc.array(
            transactionArbitrary.filter(t => t.transaction_type === 'add'),
            { minLength: 2, maxLength: 10 }
          ),
          transactions => {
            if (transactions.length === 0) return;

            const avgPrice = calculateWeightedAveragePrice(transactions);
            const prices = transactions.map(t => t.unit_price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            expect(avgPrice).toBeGreaterThanOrEqual(minPrice - 0.01);
            expect(avgPrice).toBeLessThanOrEqual(maxPrice + 0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateCalculationInput properties', () => {
    it('should accept valid positive numbers', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000000, noNaN: true }),
          fc.constantFrom(
            'quantity' as const,
            'price' as const,
            'value' as const
          ),
          (value, type) => {
            expect(validateCalculationInput(value, type)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid inputs consistently', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.string(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          fc.constantFrom(
            'quantity' as const,
            'price' as const,
            'value' as const
          ),
          (value, type) => {
            expect(validateCalculationInput(value, type)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject negative numbers', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.001) }),
          fc.constantFrom(
            'quantity' as const,
            'price' as const,
            'value' as const
          ),
          (value, type) => {
            expect(validateCalculationInput(value, type)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('roundToPrecision properties', () => {
    it('should maintain specified decimal places', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000000), max: 1000000, noNaN: true }),
          fc.integer({ min: 0, max: 5 }),
          (value, decimalPlaces) => {
            const rounded = roundToPrecision(value, decimalPlaces);

            if (decimalPlaces === 0) {
              expect(Math.abs(rounded % 1)).toBe(0); // Use Math.abs to handle -0 vs 0
            } else {
              const decimalPart = rounded.toString().split('.')[1];
              if (decimalPart) {
                expect(decimalPart.length).toBeLessThanOrEqual(decimalPlaces);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent (rounding twice gives same result)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000000), max: 1000000, noNaN: true }),
          fc.integer({ min: 0, max: 5 }),
          (value, decimalPlaces) => {
            const rounded1 = roundToPrecision(value, decimalPlaces);
            const rounded2 = roundToPrecision(rounded1, decimalPlaces);

            expect(rounded1).toBe(rounded2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity)
          ),
          value => {
            const rounded = roundToPrecision(value);
            expect(rounded).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Total price calculation consistency', () => {
    it('should maintain calculation precision across operations', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { minLength: 1, maxLength: 20 }),
          items => {
            const total1 = calculateTotalInventoryValue(items);

            // Split into two groups and calculate separately
            const mid = Math.floor(items.length / 2);
            const group1 = items.slice(0, mid);
            const group2 = items.slice(mid);

            const total2 =
              calculateTotalInventoryValue(group1) +
              calculateTotalInventoryValue(group2);

            // Should be equal within precision tolerance (slightly higher for floating point arithmetic)
            expect(Math.abs(total1 - total2)).toBeLessThan(0.02);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Real-time calculation consistency', () => {
    it('should produce consistent results for equivalent data', () => {
      fc.assert(
        fc.property(
          fc.array(inventoryItemArbitrary, { maxLength: 30 }),
          items => {
            // Calculate multiple times to ensure consistency
            const result1 = calculateInventorySummary(items);
            const result2 = calculateInventorySummary(items);
            const result3 = calculateInventorySummary([...items]); // Copy array

            expect(result1.total_items).toBe(result2.total_items);
            expect(result1.total_items).toBe(result3.total_items);
            expect(
              Math.abs(result1.total_value - result2.total_value)
            ).toBeLessThan(0.01);
            expect(
              Math.abs(result1.total_value - result3.total_value)
            ).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
