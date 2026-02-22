/**
 * Currency formatting utilities for Indian Rupee (₹)
 * Implements proper Indian currency formatting
 */

/**
 * Formats a number as Indian Rupee currency with proper decimal handling
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string with ₹ symbol and Indian numbering
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

  // Ensure the amount is a valid number and handle edge cases
  if (isNaN(amount) || !isFinite(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  // Maintain precision and round to exactly 2 decimal places
  const roundedAmount = Number(amount.toFixed(decimalPlaces));

  let formattedAmount: string;

  if (useIndianNumbering) {
    // Indian numbering system for large amounts (lakhs, crores)
    formattedAmount = formatIndianNumbering(roundedAmount, decimalPlaces);
  } else {
    // Standard international formatting
    formattedAmount = roundedAmount.toLocaleString('en-IN', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }

  // Always use Indian Rupee (₹) symbol
  return showSymbol ? `₹${formattedAmount}` : formattedAmount;
}

/**
 * Formats a number using Indian numbering system (lakhs, crores)
 * Implements large amount formatting
 * @param amount - The amount to format
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted number string with Indian comma placement
 */
function formatIndianNumbering(amount: number, decimalPlaces: number): string {
  const parts = amount.toFixed(decimalPlaces).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Apply Indian numbering pattern: first comma after 3 digits, then every 2 digits
  let formatted = '';
  const reversed = integerPart.split('').reverse();

  for (let i = 0; i < reversed.length; i++) {
    // Add comma after first 3 digits, then every 2 digits
    if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) {
      formatted = ',' + formatted;
    }
    formatted = reversed[i] + formatted;
  }

  // Maintain exactly 2 decimal places for currency precision
  return decimalPart ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * Parses a currency string and returns the numeric value
 * Handles Indian Rupee symbol and comma formatting
 * @param currencyString - The currency string to parse
 * @returns Numeric value or 0 if invalid (always non-negative)
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbol and commas, maintain precision
  const cleanString = currencyString.replace(/₹/g, '').replace(/,/g, '').trim();

  const parsed = parseFloat(cleanString);

  // Always return non-negative values (currency cannot be negative)
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return Number(parsed.toFixed(2)); // Maintain 2 decimal precision
}

/**
 * Validates if a string represents a valid currency amount
 * Ensures proper decimal handling
 * @param value - The value to validate
 * @returns True if valid currency format
 */
export function isValidCurrency(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Remove currency symbol and commas for validation
  const cleanValue = value.replace(/₹/g, '').replace(/,/g, '').trim();

  // Check if it's a valid positive number with up to 2 decimal places
  const currencyRegex = /^\d+(\.\d{1,2})?$/;
  const isValidFormat = currencyRegex.test(cleanValue);
  const numericValue = parseFloat(cleanValue);

  return isValidFormat && !isNaN(numericValue) && numericValue >= 0;
}

/**
 * Formats large amounts using Indian numbering terms
 * Converts numbers to lakhs/crores format for better readability
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted string with Indian terms (e.g., "2.5 Lakhs")
 */
export function formatIndianTerms(
  amount: number,
  options: { showSymbol?: boolean; precision?: number } = {}
): string {
  const { showSymbol = true, precision = 2 } = options;

  if (isNaN(amount) || !isFinite(amount)) {
    return showSymbol ? '₹0' : '0';
  }

  const absAmount = Math.abs(amount);
  let formattedValue: string;
  let term: string;

  if (absAmount >= 10000000) {
    // 1 crore
    formattedValue = (amount / 10000000).toFixed(precision);
    term = 'Crores';
  } else if (absAmount >= 100000) {
    // 1 lakh
    formattedValue = (amount / 100000).toFixed(precision);
    term = 'Lakhs';
  } else if (absAmount >= 1000) {
    // 1 thousand
    formattedValue = (amount / 1000).toFixed(precision);
    term = 'Thousands';
  } else {
    return formatCurrency(amount, { showSymbol });
  }

  // Remove trailing zeros after decimal
  const cleanValue = parseFloat(formattedValue).toString();
  const result = `${cleanValue} ${term}`;

  return showSymbol ? `₹${result}` : result;
}
