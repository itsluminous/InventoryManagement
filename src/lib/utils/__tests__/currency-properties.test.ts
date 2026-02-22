/**
 * Property-based tests for currency formatting
 * **Property 4: Currency Formatting Standards**
 */

import * as fc from 'fast-check';
import {
  formatCurrency,
  parseCurrency,
  isValidCurrency,
  formatIndianTerms,
} from '../currency';

describe('Property 4: Currency Formatting Standards', () => {
  describe('formatCurrency properties', () => {
    it('should always include ₹ symbol when showSymbol is true', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1000000, noNaN: true }), amount => {
          const formatted = formatCurrency(amount, { showSymbol: true });
          expect(formatted).toMatch(/^₹/);
        }),
        { numRuns: 100 }
      );
    });

    it('should never include ₹ symbol when showSymbol is false', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1000000, noNaN: true }), amount => {
          const formatted = formatCurrency(amount, { showSymbol: false });
          expect(formatted).not.toMatch(/₹/);
        }),
        { numRuns: 100 }
      );
    });

    it('should always format with exactly 2 decimal places by default', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1000000, noNaN: true }), amount => {
          const formatted = formatCurrency(amount);
          const withoutSymbol = formatted.replace('₹', '').replace(/,/g, '');
          const decimalPart = withoutSymbol.split('.')[1];
          expect(decimalPart).toBeDefined();
          expect(decimalPart).toHaveLength(2);
        }),
        { numRuns: 100 }
      );
    });

    it('should use Indian numbering system for amounts >= 1000', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1000, max: 10000000 }), amount => {
          const formatted = formatCurrency(amount, {
            useIndianNumbering: true,
          });
          const withoutSymbol = formatted.replace('₹', '');

          // Should have commas for Indian numbering
          if (amount >= 1000) {
            expect(withoutSymbol).toMatch(/,/);
          }

          // For amounts >= 100000 (1 lakh), should follow Indian pattern
          if (amount >= 100000) {
            const parts = withoutSymbol.split('.')[0].split(',');
            // Last part should be 3 digits, others should be 2 digits (except first)
            if (parts.length > 1) {
              expect(parts[parts.length - 1]).toHaveLength(3);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.constant(0)
          ),
          amount => {
            const formatted = formatCurrency(amount);
            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe('string');

            if (isNaN(amount) || !isFinite(amount)) {
              expect(formatted).toBe('₹0.00');
            } else if (amount === 0) {
              expect(formatted).toBe('₹0.00');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('parseCurrency properties', () => {
    it('should be inverse of formatCurrency for valid amounts', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1000000, noNaN: true }), amount => {
          const formatted = formatCurrency(amount);
          const parsed = parseCurrency(formatted);

          // Should be approximately equal (within 0.01 due to rounding)
          expect(Math.abs(parsed - amount)).toBeLessThan(0.01);
        }),
        { numRuns: 100 }
      );
    });

    it('should always return a non-negative number', () => {
      fc.assert(
        fc.property(fc.string(), input => {
          const parsed = parseCurrency(input);
          expect(parsed).toBeGreaterThanOrEqual(0);
          expect(typeof parsed).toBe('number');
          expect(isFinite(parsed)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle currency strings with commas correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1000, max: 10000000 }), amount => {
          const formatted = formatCurrency(amount);
          const parsed = parseCurrency(formatted);

          // Should parse back to approximately the same value
          expect(Math.abs(parsed - amount)).toBeLessThan(0.01);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidCurrency properties', () => {
    it('should accept all properly formatted currency strings', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1000000, noNaN: true }), amount => {
          const formatted = formatCurrency(amount);
          expect(isValidCurrency(formatted)).toBe(true);

          // Also test without symbol
          const withoutSymbol = formatted.replace('₹', '');
          expect(isValidCurrency(withoutSymbol)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid inputs consistently', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('abc'),
            fc.constant('₹abc'),
            fc
              .string()
              .filter(
                s =>
                  !/^\d+(\.\d{1,2})?$/.test(
                    s.replace(/₹/g, '').replace(/,/g, '').trim()
                  )
              )
          ),
          input => {
            expect(isValidCurrency(input)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject negative amounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.01) }),
          amount => {
            const formatted = amount.toString();
            expect(isValidCurrency(formatted)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('formatIndianTerms properties', () => {
    it('should use appropriate terms for different ranges', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100000000 }), amount => {
          const formatted = formatIndianTerms(amount);

          if (amount >= 10000000) {
            expect(formatted).toMatch(/Crores/);
          } else if (amount >= 100000) {
            expect(formatted).toMatch(/Lakhs/);
          } else if (amount >= 1000) {
            expect(formatted).toMatch(/Thousands/);
          } else {
            // Should fall back to regular currency formatting
            expect(formatted).toMatch(/₹\d+\.\d{2}/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain precision in conversions', () => {
      fc.assert(
        fc.property(fc.integer({ min: 100000, max: 10000000 }), amount => {
          const formatted = formatIndianTerms(amount, { precision: 2 });

          // Extract the numeric part
          const numericPart = formatted.replace(/₹/, '').split(' ')[0];
          const parsed = parseFloat(numericPart);

          expect(isFinite(parsed)).toBe(true);
          expect(parsed).toBeGreaterThan(0);

          // Should have at most 2 decimal places
          const decimalPart = numericPart.split('.')[1];
          if (decimalPart) {
            expect(decimalPart.length).toBeLessThanOrEqual(2);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Exactly two decimal places', () => {
    it('should always display exactly 2 decimal places for currency', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1000000, noNaN: true }), amount => {
          const formatted = formatCurrency(amount);
          const decimalMatch = formatted.match(/\.(\d+)$/);

          expect(decimalMatch).not.toBeNull();
          expect(decimalMatch![1]).toHaveLength(2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Indian numbering system', () => {
    it('should follow Indian comma placement pattern', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100000, max: 99999999 }), // 1 lakh to 9.99 crores
          amount => {
            const formatted = formatCurrency(amount, {
              useIndianNumbering: true,
            });
            const withoutSymbolAndDecimal = formatted
              .replace('₹', '')
              .split('.')[0];

            // Should have commas
            expect(withoutSymbolAndDecimal).toMatch(/,/);

            // Check Indian pattern: last group is 3 digits, others are 2
            const groups = withoutSymbolAndDecimal.split(',');
            if (groups.length > 1) {
              // Last group should be 3 digits
              expect(groups[groups.length - 1]).toHaveLength(3);

              // Middle groups should be 2 digits
              for (let i = 1; i < groups.length - 1; i++) {
                expect(groups[i]).toHaveLength(2);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
