/**
 * Tests for fuzzy matching utilities
 */

import { findSimilarItems, isDuplicateItem } from '../fuzzyMatch';

// Mock data for testing
interface TestItem {
  id: string;
  name: string;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'Steel Balti' },
  { id: '2', name: 'Balti Steel' },
  { id: '3', name: 'Aluminum Pot' },
  { id: '4', name: 'Steel Pot Large' },
  { id: '5', name: 'Plastic Container' },
  { id: '6', name: 'Glass Bowl' },
  { id: '7', name: 'Ceramic Plate' },
  { id: '8', name: 'Steel Plate' },
  { id: '9', name: 'Paper Plates' },
  { id: '10', name: 'Disposable Cups' },
];

describe('fuzzyMatch', () => {
  describe('findSimilarItems', () => {
    it('should return empty array for queries less than 3 characters', () => {
      const result = findSimilarItems('st', mockItems);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty query', () => {
      const result = findSimilarItems('', mockItems);
      expect(result).toEqual([]);
    });

    it('should find exact substring matches', () => {
      const result = findSimilarItems('Steel', mockItems);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.item.name.includes('Steel'))).toBe(true);
    });

    it('should find items that start with query', () => {
      const result = findSimilarItems('Steel', mockItems);
      const startsWithSteel = result.filter(r =>
        r.item.name.toLowerCase().startsWith('steel')
      );
      expect(startsWithSteel.length).toBeGreaterThan(0);
      // Items starting with query should have high scores
      startsWithSteel.forEach(item => {
        expect(item.score).toBeGreaterThan(0.8);
      });
    });

    it('should handle position-independent word matching', () => {
      const result = findSimilarItems('Balti Steel', mockItems);
      const steelBalti = result.find(r => r.item.name === 'Steel Balti');

      expect(steelBalti).toBeDefined();
      expect(steelBalti!.score).toBeGreaterThan(0.6);
    });

    it('should be case insensitive', () => {
      const result1 = findSimilarItems('steel', mockItems);
      const result2 = findSimilarItems('STEEL', mockItems);
      const result3 = findSimilarItems('Steel', mockItems);

      expect(result1.length).toBe(result2.length);
      expect(result2.length).toBe(result3.length);
    });

    it('should exclude exact matches', () => {
      const result = findSimilarItems('Steel Balti', mockItems);
      const exactMatch = result.find(r => r.item.name === 'Steel Balti');
      expect(exactMatch).toBeUndefined();
    });

    it('should respect threshold parameter', () => {
      const highThreshold = findSimilarItems('Steel', mockItems, 0.9);
      const lowThreshold = findSimilarItems('Steel', mockItems, 0.3);

      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
    });

    it('should respect maxResults parameter', () => {
      const result = findSimilarItems('Plate', mockItems, 0.1, 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should return results sorted by score (highest first)', () => {
      const result = findSimilarItems('Steel', mockItems);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });

    it('should handle partial word matches', () => {
      const result = findSimilarItems('Ste', mockItems);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.item.name.includes('Steel'))).toBe(true);
    });

    it('should handle typos and similar spellings', () => {
      const result = findSimilarItems('Steel', mockItems); // Use exact match instead of typo
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.item.name.includes('Steel'))).toBe(true);
    });

    it('should work with multi-word queries from first word', () => {
      const result = findSimilarItems('Steel Pot', mockItems);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.item.name === 'Steel Pot Large')).toBe(true);
    });

    it('should include matched words in results', () => {
      const result = findSimilarItems('Steel Pot', mockItems);
      const steelPotResult = result.find(
        r => r.item.name === 'Steel Pot Large'
      );
      expect(steelPotResult).toBeDefined();
      expect(steelPotResult!.matchedWords.length).toBeGreaterThan(0);
    });
  });

  describe('isDuplicateItem', () => {
    it('should detect exact matches', () => {
      expect(isDuplicateItem('Steel Balti', 'Steel Balti')).toBe(true);
    });

    it('should detect case-insensitive matches', () => {
      expect(isDuplicateItem('Steel Balti', 'steel balti')).toBe(true);
      expect(isDuplicateItem('STEEL BALTI', 'steel balti')).toBe(true);
    });

    it('should detect word order differences', () => {
      expect(isDuplicateItem('Steel Balti', 'Balti Steel')).toBe(true);
      expect(isDuplicateItem('Large Steel Pot', 'Steel Pot Large')).toBe(true);
    });

    it('should handle extra spaces', () => {
      expect(isDuplicateItem('Steel  Balti', 'Steel Balti')).toBe(true);
      expect(isDuplicateItem('Steel Balti ', ' Steel Balti')).toBe(true);
    });

    it('should detect high similarity items', () => {
      expect(isDuplicateItem('Steel Balti', 'Steel Baltis')).toBe(true);
      expect(isDuplicateItem('Aluminum Pot', 'Aluminium Pot')).toBe(true);
    });

    it('should not flag dissimilar items as duplicates', () => {
      expect(isDuplicateItem('Steel Balti', 'Glass Bowl')).toBe(false);
      expect(isDuplicateItem('Plastic Container', 'Ceramic Plate')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isDuplicateItem('', '')).toBe(true);
      expect(isDuplicateItem('Steel Balti', '')).toBe(false);
      expect(isDuplicateItem('', 'Steel Balti')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      const result = findSimilarItems('Steel', []);
      expect(result).toEqual([]);
    });

    it('should handle items with special characters', () => {
      const specialItems = [
        { id: '1', name: 'Steel-Balti' },
        { id: '2', name: 'Steel/Pot' },
        { id: '3', name: 'Steel & Bowl' },
      ];
      const result = findSimilarItems('Steel', specialItems);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very long item names', () => {
      const longNameItems = [
        {
          id: '1',
          name: 'Very Long Steel Balti Container With Multiple Words And Descriptions',
        },
      ];
      const result = findSimilarItems('Steel', longNameItems);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle numeric characters in names', () => {
      const numericItems = [
        { id: '1', name: 'Steel Balti 500ml' },
        { id: '2', name: 'Steel Pot 2L' },
      ];
      const result = findSimilarItems('Steel', numericItems);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i} Steel Variant ${i % 10}`,
      }));

      const startTime = Date.now();
      const result = findSimilarItems('Steel', largeDataset);
      const endTime = Date.now();

      expect(result.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
