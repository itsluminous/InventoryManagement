/**
 * Currency formatting utilities for Indian Rupee (₹)
 */

/**
 * Formats a number as Indian Rupee currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options: {
    showSymbol?: boolean;
    decimalPlaces?: number;
    useIndianNumbering?: boolean;
  } = {}
): string {
  const {
    showSymbol = true,
    decimalPlaces = 2,
    useIndianNumbering = true,
  } = options;

  // Ensure the amount is a valid number
  if (isNaN(amount) || !isFinite(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  // Round to specified decimal places
  const roundedAmount = Number(amount.toFixed(decimalPlaces));

  let formattedAmount: string;

  if (useIndianNumbering) {
    // Indian numbering system (lakhs, crores)
    formattedAmount = formatIndianNumbering(roundedAmount, decimalPlaces);
  } else {
    // Standard international formatting
    formattedAmount = roundedAmount.toLocaleString('en-IN', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }

  return showSymbol ? `₹${formattedAmount}` : formattedAmount;
}

/**
 * Formats a number using Indian numbering system
 * @param amount - The amount to format
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted number string
 */
function formatIndianNumbering(amount: number, decimalPlaces: number): string {
  const parts = amount.toFixed(decimalPlaces).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Apply Indian numbering pattern
  let formatted = '';
  const reversed = integerPart.split('').reverse();

  for (let i = 0; i < reversed.length; i++) {
    if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) {
      formatted = ',' + formatted;
    }
    formatted = reversed[i] + formatted;
  }

  return decimalPart ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * Parses a currency string and returns the numeric value
 * @param currencyString - The currency string to parse
 * @returns Numeric value or 0 if invalid
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbol and commas
  const cleanString = currencyString.replace(/₹/g, '').replace(/,/g, '').trim();

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validates if a string represents a valid currency amount
 * @param value - The value to validate
 * @returns True if valid currency format
 */
export function isValidCurrency(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Remove currency symbol and commas for validation
  const cleanValue = value.replace(/₹/g, '').replace(/,/g, '').trim();

  // Check if it's a valid number with up to 2 decimal places
  const currencyRegex = /^\d+(\.\d{1,2})?$/;
  return currencyRegex.test(cleanValue) && !isNaN(parseFloat(cleanValue));
}
