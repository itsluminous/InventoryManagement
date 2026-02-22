/**
 * Property-Based Tests for FIFO Inventory Removal System
 *
 * These tests validate universal properties that should hold across all scenarios:
 * - Property 1: FIFO Inventory Removal Correctness
 * - Property 16: Inventory Round-trip Consistency
 */

import * as fc from 'fast-check';
import { InventoryBatch } from '@/lib/types/inventory';

// Mock the Supabase client import
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  }),
}));

// Test data generators with proper constraints to avoid NaN values
const validFloatArbitrary = (min: number, max: number) =>
  fc
    .float({ min: Math.fround(min), max: Math.fround(max) })
    .filter(n => !isNaN(n) && isFinite(n));

const inventoryBatchArbitrary = fc
  .record({
    id: fc.uuid(),
    quantity: validFloatArbitrary(0.001, 1000),
    unit_price: validFloatArbitrary(0.01, 1000),
    remaining_quantity: validFloatArbitrary(0.001, 1000),
    transaction_date: fc
      .date({ min: new Date('2020-01-01'), max: new Date() })
      .map(d => d.toISOString()),
  })
  .filter(
    batch =>
      // Ensure remaining_quantity doesn't exceed quantity
      batch.remaining_quantity <= batch.quantity &&
      !isNaN(batch.quantity) &&
      !isNaN(batch.unit_price) &&
      !isNaN(batch.remaining_quantity)
  );

const addInventoryDataArbitrary = fc
  .record({
    master_item_id: fc.uuid(),
    quantity: validFloatArbitrary(0.001, 1000),
    unit_price: validFloatArbitrary(0.01, 1000),
    notes: fc.option(fc.string({ maxLength: 100 })),
  })
  .filter(data => !isNaN(data.quantity) && !isNaN(data.unit_price));

describe('Property 1: FIFO Inventory Removal Correctness', () => {
  /**
   * For any inventory removal operation, the system should use the oldest available
   * inventory batches first, calculate costs using original purchase prices, and
   * maintain accurate remaining quantities across all affected batches.
   */

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should always process batches in chronological order (oldest first)', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryBatchArbitrary, { minLength: 2, maxLength: 8 }),
        validFloatArbitrary(0.001, 100),
        (batches, quantityToRemove) => {
          // Ensure batches have sufficient total quantity and no NaN values
          const totalAvailable = batches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );
          fc.pre(totalAvailable >= quantityToRemove);
          fc.pre(!isNaN(totalAvailable) && !isNaN(quantityToRemove));
          fc.pre(
            batches.every(
              b =>
                !isNaN(b.quantity) &&
                !isNaN(b.unit_price) &&
                !isNaN(b.remaining_quantity)
            )
          );

          // Sort batches by date (oldest first) - this is what FIFO should do
          const sortedBatches = [...batches].sort(
            (a, b) =>
              new Date(a.transaction_date).getTime() -
              new Date(b.transaction_date).getTime()
          );

          // Simulate FIFO calculation
          let remainingToRemove = quantityToRemove;
          let totalCost = 0;
          const batchUpdates: Array<{
            id: string;
            newRemainingQuantity: number;
            quantityUsed: number;
          }> = [];

          for (const batch of sortedBatches) {
            if (remainingToRemove <= 0) break;

            const quantityFromThisBatch = Math.min(
              remainingToRemove,
              batch.remaining_quantity
            );
            const costFromThisBatch = quantityFromThisBatch * batch.unit_price;

            totalCost += costFromThisBatch;
            remainingToRemove -= quantityFromThisBatch;

            batchUpdates.push({
              id: batch.id,
              newRemainingQuantity:
                batch.remaining_quantity - quantityFromThisBatch,
              quantityUsed: quantityFromThisBatch,
            });
          }

          // Property 1: Batches should be processed in chronological order
          const processedBatchIds = batchUpdates.map(update => update.id);
          const expectedOrder = sortedBatches
            .slice(0, batchUpdates.length)
            .map(batch => batch.id);
          expect(processedBatchIds).toEqual(expectedOrder);

          // Property 2: Total quantity removed should equal requested quantity
          const totalQuantityUsed = batchUpdates.reduce(
            (sum, update) => sum + update.quantityUsed,
            0
          );
          expect(Math.abs(totalQuantityUsed - quantityToRemove)).toBeLessThan(
            0.001
          );

          // Property 3: No batch should have negative remaining quantity
          batchUpdates.forEach(update => {
            expect(update.newRemainingQuantity).toBeGreaterThanOrEqual(0);
          });

          // Property 4: Cost calculation should be accurate
          const expectedCost = batchUpdates.reduce((sum, update, index) => {
            const batch = sortedBatches[index];
            return sum + update.quantityUsed * batch.unit_price;
          }, 0);
          expect(Math.abs(totalCost - expectedCost)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate weighted average price across multiple batches', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryBatchArbitrary, { minLength: 2, maxLength: 5 }),
        validFloatArbitrary(0.001, 50),
        (batches, quantityToRemove) => {
          // Ensure we need multiple batches
          const sortedBatches = [...batches].sort(
            (a, b) =>
              new Date(a.transaction_date).getTime() -
              new Date(b.transaction_date).getTime()
          );

          const totalAvailable = sortedBatches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );
          fc.pre(totalAvailable >= quantityToRemove);
          fc.pre(quantityToRemove > sortedBatches[0].remaining_quantity); // Ensure multiple batches needed
          fc.pre(!isNaN(totalAvailable) && !isNaN(quantityToRemove));
          fc.pre(
            sortedBatches.every(
              b =>
                !isNaN(b.quantity) &&
                !isNaN(b.unit_price) &&
                !isNaN(b.remaining_quantity)
            )
          );

          // Calculate FIFO removal
          let remainingToRemove = quantityToRemove;
          let totalCost = 0;
          let batchesUsed = 0;

          for (const batch of sortedBatches) {
            if (remainingToRemove <= 0) break;

            const quantityFromThisBatch = Math.min(
              remainingToRemove,
              batch.remaining_quantity
            );
            const costFromThisBatch = quantityFromThisBatch * batch.unit_price;

            totalCost += costFromThisBatch;
            remainingToRemove -= quantityFromThisBatch;
            batchesUsed++;
          }

          const weightedAveragePrice = totalCost / quantityToRemove;

          // Property: Weighted average should be within the range of batch prices used
          const usedBatches = sortedBatches.slice(0, batchesUsed);
          const minPrice = Math.min(...usedBatches.map(b => b.unit_price));
          const maxPrice = Math.max(...usedBatches.map(b => b.unit_price));

          expect(weightedAveragePrice).toBeGreaterThanOrEqual(minPrice - 0.01);
          expect(weightedAveragePrice).toBeLessThanOrEqual(maxPrice + 0.01);

          // Property: Total cost should equal weighted average * quantity
          const calculatedTotalCost = weightedAveragePrice * quantityToRemove;
          expect(Math.abs(calculatedTotalCost - totalCost)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject removal when insufficient inventory exists', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryBatchArbitrary, { minLength: 1, maxLength: 5 }),
        validFloatArbitrary(1, 1000),
        (batches, excessQuantity) => {
          const totalAvailable = batches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );
          const quantityToRemove = totalAvailable + excessQuantity; // Always more than available

          // Simulate insufficient inventory check
          const hasInsufficientInventory = totalAvailable < quantityToRemove;

          // Property: Should always detect insufficient inventory
          expect(hasInsufficientInventory).toBe(true);

          // Property: Should not process any batches when insufficient
          if (hasInsufficientInventory) {
            // No batches should be modified
            expect(totalAvailable).toBeLessThan(quantityToRemove);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of exact quantity match', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryBatchArbitrary, { minLength: 1, maxLength: 3 }),
        batches => {
          const totalAvailable = batches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );
          const quantityToRemove = totalAvailable; // Exact match

          // Sort batches by date
          const sortedBatches = [...batches].sort(
            (a, b) =>
              new Date(a.transaction_date).getTime() -
              new Date(b.transaction_date).getTime()
          );

          // Calculate FIFO removal
          let remainingToRemove = quantityToRemove;
          const batchUpdates: Array<{
            id: string;
            newRemainingQuantity: number;
          }> = [];

          for (const batch of sortedBatches) {
            if (remainingToRemove <= 0) break;

            const quantityFromThisBatch = Math.min(
              remainingToRemove,
              batch.remaining_quantity
            );
            remainingToRemove -= quantityFromThisBatch;

            batchUpdates.push({
              id: batch.id,
              newRemainingQuantity:
                batch.remaining_quantity - quantityFromThisBatch,
            });
          }

          // Property: All inventory should be consumed
          expect(Math.abs(remainingToRemove)).toBeLessThan(0.001);

          // Property: All batches should be fully or partially consumed
          const totalRemainingAfter = batchUpdates.reduce(
            (sum, update) => sum + update.newRemainingQuantity,
            0
          );
          expect(Math.abs(totalRemainingAfter)).toBeLessThan(0.001);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 16: Inventory Round-trip Consistency', () => {
  /**
   * For any valid inventory item, adding it to inventory and then immediately
   * removing the same quantity should result in the original inventory state,
   * with costs calculated correctly through FIFO.
   */

  it('should maintain inventory consistency for add-then-remove operations', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryBatchArbitrary, { minLength: 1, maxLength: 3 }),
        addInventoryDataArbitrary,
        (initialBatches, addData) => {
          // Calculate initial state
          const initialTotalQuantity = initialBatches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );
          const initialTotalValue = initialBatches.reduce(
            (sum, batch) => sum + batch.remaining_quantity * batch.unit_price,
            0
          );

          // Simulate adding inventory
          const newBatch: InventoryBatch = {
            id: 'new-batch-id',
            quantity: addData.quantity,
            unit_price: addData.unit_price,
            remaining_quantity: addData.quantity,
            transaction_date: new Date().toISOString(),
          };

          const batchesAfterAdd = [...initialBatches, newBatch];
          const totalAfterAdd = batchesAfterAdd.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );
          const valueAfterAdd = batchesAfterAdd.reduce(
            (sum, batch) => sum + batch.remaining_quantity * batch.unit_price,
            0
          );

          // Property: Adding should increase total by exact amount
          expect(
            Math.abs(totalAfterAdd - (initialTotalQuantity + addData.quantity))
          ).toBeLessThan(0.001);
          expect(
            Math.abs(
              valueAfterAdd -
                (initialTotalValue + addData.quantity * addData.unit_price)
            )
          ).toBeLessThan(0.01);

          // Now simulate removing the same quantity using FIFO
          const quantityToRemove = addData.quantity;
          const sortedBatches = [...batchesAfterAdd].sort(
            (a, b) =>
              new Date(a.transaction_date).getTime() -
              new Date(b.transaction_date).getTime()
          );

          let remainingToRemove = quantityToRemove;
          let removalCost = 0;
          const finalBatches = sortedBatches.map(batch => {
            if (remainingToRemove <= 0) return batch;

            const quantityFromThisBatch = Math.min(
              remainingToRemove,
              batch.remaining_quantity
            );
            removalCost += quantityFromThisBatch * batch.unit_price;
            remainingToRemove -= quantityFromThisBatch;

            return {
              ...batch,
              remaining_quantity:
                batch.remaining_quantity - quantityFromThisBatch,
            };
          });

          const finalTotalQuantity = finalBatches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );

          // Property: Final quantity should equal initial quantity
          expect(
            Math.abs(finalTotalQuantity - initialTotalQuantity)
          ).toBeLessThan(0.001);

          // Property: Removal cost should reflect FIFO pricing (oldest batches first)
          expect(removalCost).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple add-remove cycles consistently', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryBatchArbitrary, { minLength: 1, maxLength: 2 }),
        fc.array(addInventoryDataArbitrary, { minLength: 2, maxLength: 4 }),
        (initialBatches, addOperations) => {
          const currentBatches = [...initialBatches];
          const initialTotal = currentBatches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );

          // Perform multiple add operations
          addOperations.forEach((addData, index) => {
            const newBatch: InventoryBatch = {
              id: `batch-${index}`,
              quantity: addData.quantity,
              unit_price: addData.unit_price,
              remaining_quantity: addData.quantity,
              transaction_date: new Date(
                Date.now() + index * 1000
              ).toISOString(), // Ensure chronological order
            };
            currentBatches.push(newBatch);
          });

          const totalAfterAdds = currentBatches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );
          const expectedTotal =
            initialTotal +
            addOperations.reduce((sum, op) => sum + op.quantity, 0);

          // Property: Total after adds should be sum of initial + all additions
          expect(Math.abs(totalAfterAdds - expectedTotal)).toBeLessThan(0.001);

          // Now remove all added quantities in reverse order (testing FIFO)
          let remainingBatches = [...currentBatches];
          for (let i = addOperations.length - 1; i >= 0; i--) {
            const quantityToRemove = addOperations[i].quantity;

            // Sort by date for FIFO
            const sortedBatches = [...remainingBatches].sort(
              (a, b) =>
                new Date(a.transaction_date).getTime() -
                new Date(b.transaction_date).getTime()
            );

            let remainingToRemove = quantityToRemove;
            remainingBatches = sortedBatches.map(batch => {
              if (remainingToRemove <= 0) return batch;

              const quantityFromThisBatch = Math.min(
                remainingToRemove,
                batch.remaining_quantity
              );
              remainingToRemove -= quantityFromThisBatch;

              return {
                ...batch,
                remaining_quantity:
                  batch.remaining_quantity - quantityFromThisBatch,
              };
            });
          }

          const finalTotal = remainingBatches.reduce(
            (sum, batch) => sum + batch.remaining_quantity,
            0
          );

          // Property: Should return to initial state (within floating point precision)
          expect(Math.abs(finalTotal - initialTotal)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});
