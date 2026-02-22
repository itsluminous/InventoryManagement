import { formatCurrency, parseCurrency, isValidCurrency } from '../currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('formats basic amounts correctly', () => {
      expect(formatCurrency(100)).toBe('₹100.00');
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(100000)).toBe('₹1,00,000.00');
    });

    it('handles Indian numbering system', () => {
      expect(formatCurrency(1000000)).toBe('₹10,00,000.00');
      expect(formatCurrency(10000000)).toBe('₹1,00,00,000.00');
    });

    it('respects formatting options', () => {
      expect(formatCurrency(100, { showSymbol: false })).toBe('100.00');
      expect(formatCurrency(100.5, { decimalPlaces: 1 })).toBe('₹100.5');
      expect(formatCurrency(100.567, { decimalPlaces: 0 })).toBe('₹101');
    });

    it('handles edge cases', () => {
      expect(formatCurrency(0)).toBe('₹0.00');
      expect(formatCurrency(NaN)).toBe('₹0.00');
      expect(formatCurrency(Infinity)).toBe('₹0.00');
    });
  });

  describe('parseCurrency', () => {
    it('parses currency strings correctly', () => {
      expect(parseCurrency('₹100.00')).toBe(100);
      expect(parseCurrency('₹1,000.50')).toBe(1000.5);
      expect(parseCurrency('1000')).toBe(1000);
    });

    it('handles invalid inputs', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency('₹abc')).toBe(0);
    });
  });

  describe('isValidCurrency', () => {
    it('validates correct currency formats', () => {
      expect(isValidCurrency('100')).toBe(true);
      expect(isValidCurrency('100.50')).toBe(true);
      expect(isValidCurrency('₹100.00')).toBe(true);
      expect(isValidCurrency('1,000.00')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidCurrency('')).toBe(false);
      expect(isValidCurrency('abc')).toBe(false);
      expect(isValidCurrency('100.123')).toBe(false);
      expect(isValidCurrency('-100')).toBe(false);
    });
  });
});
