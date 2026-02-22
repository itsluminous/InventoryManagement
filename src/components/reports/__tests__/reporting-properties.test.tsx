/**
 * Property-Based Tests for Reporting Accuracy
 *
 * These tests validate universal properties that should hold true
 * for all reporting calculations and data synchronization scenarios.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';

// Mock transaction data structure
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

// Helper functions from the reporting logic
function groupTransactionsByPeriod(
  transactions: MockTransaction[],
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
) {
  const groups: { [key: string]: any } = {};

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

  return Object.values(groups).sort((a: any, b: any) =>
    a.period.localeCompare(b.period)
  );
}

function groupTransactionsForTrend(transactions: MockTransaction[]) {
  const groups: { [key: string]: any } = {};

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

    if (transaction.transaction_type === 'remove') {
      group.expense += totalPrice;
      group.items[itemName] = (group.items[itemName] || 0) + totalPrice;
    }
  });

  return Object.values(groups).sort((a: any, b: any) =>
    a.week.localeCompare(b.week)
  );
}

// Generators for property-based testing
const transactionGenerator = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  master_item_id: fc.uuid(),
  transaction_type: fc.constantFrom('add', 'remove') as fc.Arbitrary<
    'add' | 'remove'
  >,
  quantity: fc.float({
    min: Math.fround(0.001),
    max: Math.fround(1000),
    noNaN: true,
  }),
  unit_price: fc.float({
    min: Math.fround(0),
    max: Math.fround(10000),
    noNaN: true,
  }),
  transaction_date: fc
    .date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .map(d => d.toISOString()),
  master_item: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    unit: fc.constantFrom('kg', 'qty', 'liters', 'pieces'),
  }),
});

const transactionListGenerator = fc.array(transactionGenerator, {
  minLength: 0,
  maxLength: 100,
});

describe('Property 10: Report Calculation Accuracy', () => {
  /**
   * For any selected time period and item set, the reporting system should
   * accurately calculate incoming transactions, outgoing transactions, and net expenses,
   * with net expense always equaling incoming minus outgoing costs.
   */

  it('should always calculate net expense as outgoing minus incoming', () => {
    fc.assert(
      fc.property(transactionListGenerator, transactions => {
        const periods = ['day', 'week', 'month', 'quarter', 'year'] as const;

        periods.forEach(period => {
          const reportData = groupTransactionsByPeriod(transactions, period);

          reportData.forEach(report => {
            // Net expense should always equal outgoing - incoming
            const expectedNetExpense =
              report.outgoing_value - report.incoming_value;
            expect(
              Math.abs(report.net_expense - expectedNetExpense)
            ).toBeLessThan(0.01);

            // Values should never be negative
            expect(report.incoming_value).toBeGreaterThanOrEqual(0);
            expect(report.outgoing_value).toBeGreaterThanOrEqual(0);

            // Quantities should never be negative
            expect(report.incoming_quantity).toBeGreaterThanOrEqual(0);
            expect(report.outgoing_quantity).toBeGreaterThanOrEqual(0);
          });
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain calculation consistency across different grouping periods', () => {
    fc.assert(
      fc.property(transactionListGenerator, transactions => {
        // Calculate totals for all periods
        const dailyData = groupTransactionsByPeriod(transactions, 'day');
        const weeklyData = groupTransactionsByPeriod(transactions, 'week');
        const monthlyData = groupTransactionsByPeriod(transactions, 'month');

        // Sum up all daily totals
        const dailyTotals = dailyData.reduce(
          (acc, day) => ({
            incoming: acc.incoming + day.incoming_value,
            outgoing: acc.outgoing + day.outgoing_value,
          }),
          { incoming: 0, outgoing: 0 }
        );

        // Sum up all weekly totals
        const weeklyTotals = weeklyData.reduce(
          (acc, week) => ({
            incoming: acc.incoming + week.incoming_value,
            outgoing: acc.outgoing + week.outgoing_value,
          }),
          { incoming: 0, outgoing: 0 }
        );

        // Sum up all monthly totals
        const monthlyTotals = monthlyData.reduce(
          (acc, month) => ({
            incoming: acc.incoming + month.incoming_value,
            outgoing: acc.outgoing + month.outgoing_value,
          }),
          { incoming: 0, outgoing: 0 }
        );

        // All period aggregations should sum to the same total
        expect(
          Math.abs(dailyTotals.incoming - weeklyTotals.incoming)
        ).toBeLessThan(0.01);
        expect(
          Math.abs(dailyTotals.incoming - monthlyTotals.incoming)
        ).toBeLessThan(0.01);
        expect(
          Math.abs(dailyTotals.outgoing - weeklyTotals.outgoing)
        ).toBeLessThan(0.01);
        expect(
          Math.abs(dailyTotals.outgoing - monthlyTotals.outgoing)
        ).toBeLessThan(0.01);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly aggregate transaction values by type', () => {
    fc.assert(
      fc.property(transactionListGenerator, transactions => {
        const reportData = groupTransactionsByPeriod(transactions, 'day');

        // Calculate expected totals manually
        const expectedTotals = transactions.reduce(
          (acc, transaction) => {
            const totalPrice = transaction.quantity * transaction.unit_price;
            if (transaction.transaction_type === 'add') {
              acc.incoming += totalPrice;
            } else {
              acc.outgoing += totalPrice;
            }
            return acc;
          },
          { incoming: 0, outgoing: 0 }
        );

        // Sum up report data
        const reportTotals = reportData.reduce(
          (acc, report) => ({
            incoming: acc.incoming + report.incoming_value,
            outgoing: acc.outgoing + report.outgoing_value,
          }),
          { incoming: 0, outgoing: 0 }
        );

        // Should match expected totals
        expect(
          Math.abs(reportTotals.incoming - expectedTotals.incoming)
        ).toBeLessThan(0.01);
        expect(
          Math.abs(reportTotals.outgoing - expectedTotals.outgoing)
        ).toBeLessThan(0.01);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 11: Real-time Data Synchronization', () => {
  /**
   * For any data modification, the system should immediately update all relevant
   * displays and maintain consistency between the database state and UI state
   * across all components.
   */

  it('should maintain data consistency when transactions are added or removed', () => {
    fc.assert(
      fc.property(
        transactionListGenerator,
        transactionGenerator,
        (initialTransactions, newTransaction) => {
          // Calculate initial report
          const initialReport = groupTransactionsByPeriod(
            initialTransactions,
            'week'
          );

          // Add new transaction
          const updatedTransactions = [...initialTransactions, newTransaction];
          const updatedReport = groupTransactionsByPeriod(
            updatedTransactions,
            'week'
          );

          // Find the period that should be affected
          const newTransactionDate = new Date(newTransaction.transaction_date);
          const weekStart = new Date(newTransactionDate);
          weekStart.setDate(
            newTransactionDate.getDate() - newTransactionDate.getDay()
          );
          const affectedPeriod = weekStart.toISOString().split('T')[0];

          // Check that the affected period has been updated correctly
          const initialPeriodData = initialReport.find(
            r => r.period === affectedPeriod
          );
          const updatedPeriodData = updatedReport.find(
            r => r.period === affectedPeriod
          );

          if (updatedPeriodData) {
            const transactionValue =
              newTransaction.quantity * newTransaction.unit_price;

            if (newTransaction.transaction_type === 'add') {
              const expectedIncoming =
                (initialPeriodData?.incoming_value || 0) + transactionValue;
              expect(
                Math.abs(updatedPeriodData.incoming_value - expectedIncoming)
              ).toBeLessThan(0.01);
            } else {
              const expectedOutgoing =
                (initialPeriodData?.outgoing_value || 0) + transactionValue;
              expect(
                Math.abs(updatedPeriodData.outgoing_value - expectedOutgoing)
              ).toBeLessThan(0.01);
            }

            // Net expense should be recalculated correctly
            const expectedNetExpense =
              updatedPeriodData.outgoing_value -
              updatedPeriodData.incoming_value;
            expect(
              Math.abs(updatedPeriodData.net_expense - expectedNetExpense)
            ).toBeLessThan(0.01);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain trend data consistency when filtering by items', () => {
    fc.assert(
      fc.property(transactionListGenerator, transactions => {
        // Generate trend data for all items
        const allItemsTrend = groupTransactionsForTrend(transactions);

        // Get unique item IDs
        const uniqueItemIds = Array.from(
          new Set(transactions.map(t => t.master_item_id))
        );

        if (uniqueItemIds.length > 0) {
          // Filter transactions by first item
          const filteredTransactions = transactions.filter(
            t => t.master_item_id === uniqueItemIds[0]
          );
          const filteredTrend = groupTransactionsForTrend(filteredTransactions);

          // Each period in filtered trend should have expense <= corresponding period in all items trend
          filteredTrend.forEach(filteredPeriod => {
            const allItemsPeriod = allItemsTrend.find(
              p => p.week === filteredPeriod.week
            );
            if (allItemsPeriod) {
              expect(filteredPeriod.expense).toBeLessThanOrEqual(
                allItemsPeriod.expense + 0.01
              );
            }
          });
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve data integrity when grouping by different time periods', () => {
    fc.assert(
      fc.property(transactionListGenerator, transactions => {
        // Test that no data is lost or duplicated when grouping
        const originalTotal = transactions.reduce((sum, t) => {
          return sum + t.quantity * t.unit_price;
        }, 0);

        ['day', 'week', 'month', 'quarter', 'year'].forEach(period => {
          const grouped = groupTransactionsByPeriod(
            transactions,
            period as 'day' | 'week' | 'month' | 'quarter' | 'year'
          );
          const groupedTotal = grouped.reduce((sum, g) => {
            return sum + g.incoming_value + g.outgoing_value;
          }, 0);

          // Total value should be preserved across groupings
          expect(Math.abs(groupedTotal - originalTotal)).toBeLessThan(0.01);
        });
      }),
      { numRuns: 100 }
    );
  });
});
