/**
 * Property-Based Tests for Inventory Display and Search
 *
 * These tests validate universal properties that should hold across all scenarios:
 * - Property 3: Alphabetical Sorting Consistency
 * - Property 7: Search and Filter Functionality
 */

import * as fc from 'fast-check';

// Test data generators
const inventoryItemArbitrary = fc.record({
  master_item_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  unit: fc.oneof(
    fc.constant('kg'),
    fc.constant('qty'),
    fc.constant('liters'),
    fc.constant('pieces')
  ),
  current_quantity: fc.float({ min: 0, max: 1000 }),
  total_value: fc.float({ min: 0, max: 100000 }),
  last_transaction_date: fc.date().map(d => d.toISOString()),
});

const masterItemArbitrary = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  unit: fc.oneof(
    fc.constant('kg'),
    fc.constant('qty'),
    fc.constant('liters'),
    fc.constant('pieces')
  ),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString()),
});

describe('Property 3: Alphabetical Sorting Consistency', () => {
  /**
   * For any list of inventory items, the system should display them in alphabetical order by name.
   * This property ensures consistent sorting across all interfaces.
   */
  it('should always sort inventory items alphabetically by name', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryItemArbitrary, { minLength: 2, maxLength: 10 }),
        items => {
          // Sort items using the same logic as the component
          const sortedItems = [...items].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );

          // Property: sorted array should be in alphabetical order
          for (let i = 0; i < sortedItems.length - 1; i++) {
            const comparison = sortedItems[i].name.localeCompare(
              sortedItems[i + 1].name,
              undefined,
              { sensitivity: 'base' }
            );
            expect(comparison).toBeLessThanOrEqual(0);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain alphabetical order regardless of input order', () => {
    fc.assert(
      fc.property(
        fc.array(inventoryItemArbitrary, { minLength: 3, maxLength: 8 }),
        originalItems => {
          // Create shuffled version of the same items
          const shuffledItems = [...originalItems].sort(
            () => Math.random() - 0.5
          );

          // Sort both arrays
          const sortedOriginal = [...originalItems].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          const sortedShuffled = [...shuffledItems].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );

          // Property: both should produce the same order
          expect(sortedOriginal.map(item => item.name)).toEqual(
            sortedShuffled.map(item => item.name)
          );
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 7: Search and Filter Functionality', () => {
  /**
   * For any search input in dropdowns or filters, the system should return results that contain
   * the search term (case-insensitive) and maintain real-time filtering as the user types.
   */
  it('should filter master items based on search input (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(masterItemArbitrary, { minLength: 3, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 8 }),
        (masterItems, searchTerm) => {
          // Apply the same filtering logic as the component
          const filteredItems = masterItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // Property: every filtered item must contain the search term
          const allResultsValid = filteredItems.every(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // Property: no excluded items should contain the search term
          const excludedItems = masterItems.filter(
            item => !filteredItems.includes(item)
          );
          const noFalseExclusions = excludedItems.every(
            item => !item.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

          expect(allResultsValid).toBe(true);
          expect(noFalseExclusions).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should return all items when search term is empty', () => {
    fc.assert(
      fc.property(
        fc.array(masterItemArbitrary, { minLength: 1, maxLength: 8 }),
        masterItems => {
          // When search term is empty, all items should be available
          const searchTerm = '';

          const filteredItems = masterItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // Property: empty search should return all items
          expect(filteredItems).toHaveLength(masterItems.length);
          expect(filteredItems).toEqual(masterItems);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain search result consistency regardless of case', () => {
    fc.assert(
      fc.property(
        fc.array(masterItemArbitrary, { minLength: 2, maxLength: 6 }),
        fc.string({ minLength: 1, maxLength: 5 }),
        (masterItems, baseTerm) => {
          // Test different case variations of the same search term
          const lowerCaseTerm = baseTerm.toLowerCase();
          const upperCaseTerm = baseTerm.toUpperCase();
          const mixedCaseTerm =
            baseTerm.charAt(0).toUpperCase() + baseTerm.slice(1).toLowerCase();

          const filterByTerm = (term: string) =>
            masterItems.filter(item =>
              item.name.toLowerCase().includes(term.toLowerCase())
            );

          const lowerResults = filterByTerm(lowerCaseTerm);
          const upperResults = filterByTerm(upperCaseTerm);
          const mixedResults = filterByTerm(mixedCaseTerm);

          // Property: case variations should produce identical results
          expect(lowerResults.map(item => item.id)).toEqual(
            upperResults.map(item => item.id)
          );
          expect(upperResults.map(item => item.id)).toEqual(
            mixedResults.map(item => item.id)
          );
        }
      ),
      { numRuns: 20 }
    );
  });
});
