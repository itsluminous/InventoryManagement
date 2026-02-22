/**
 * Error handling utilities for the inventory management system
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Maps Supabase errors to user-friendly messages
 */
export function mapSupabaseError(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Handle specific Supabase error codes
  switch (error.code) {
    case '23505': // Unique violation
      if (error.constraint?.includes('master_items_user_id_name_key')) {
        return 'An item with this name already exists';
      }
      return 'This record already exists';

    case '23503': // Foreign key violation
      if (error.constraint?.includes('inventory_transactions_master_item_id_fkey')) {
        return 'Cannot delete item that has inventory transactions';
      }
      return 'Cannot delete item that is referenced by other records';

    case '23502': // Not null violation
      return 'Required field is missing';

    case 'PGRST116': // No rows returned
      return 'Record not found';

    case 'PGRST301': // Row Level Security violation
      return 'You do not have permission to access this data';

    case '42501': // Insufficient privilege
      return 'You do not have permission to perform this action';

    case '08006': // Connection failure
      return 'Database connection failed. Please try again.';

    case '08003': // Connection does not exist
      return 'Database connection lost. Please refresh the page.';

    default:
      // Handle auth errors
      if (error.message?.includes('Invalid login credentials')) {
        return 'Invalid email or password';
      }
      if (error.message?.includes('Email not confirmed')) {
        return 'Please check your email and click the confirmation link';
      }
      if (error.message?.includes('User already registered')) {
        return 'An account with this email already exists';
      }
      if (error.message?.includes('Password should be at least')) {
        return 'Password must be at least 6 characters long';
      }

      // Return the original message if it's user-friendly
      if (error.message && error.message.length < 100) {
        return error.message;
      }

      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Wraps async operations with error handling
 */
export async function executeWithErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const result = await operation();

    if (result.error) {
      const userMessage = mapSupabaseError(result.error);
      return { data: null, error: userMessage };
    }

    if (result.data === null) {
      return { data: null, error: 'No data returned' };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('Operation failed:', error);

    if (error instanceof ApiError) {
      return { data: null, error: error.message };
    }

    if (error instanceof NetworkError) {
      return { data: null, error: error.message };
    }

    if (error instanceof Error) {
      return { data: null, error: mapSupabaseError(error) };
    }

    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Validates form data and throws ValidationError if invalid
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      throw new ValidationError(`${field} is required`, field, data[field]);
    }
  }
}

/**
 * Validates numeric fields
 */
export function validateNumeric(
  value: any,
  fieldName: string,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): void {
  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }

  if (options?.min !== undefined && num < options.min) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.min}`,
      fieldName,
      value
    );
  }

  if (options?.max !== undefined && num > options.max) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.max}`,
      fieldName,
      value
    );
  }

  if (options?.integer && !Number.isInteger(num)) {
    throw new ValidationError(
      `${fieldName} must be a whole number`,
      fieldName,
      value
    );
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent the default browser behavior
      event.preventDefault();
      
      // In production, send to error monitoring service
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error monitoring service
        console.error('Production unhandled rejection:', {
          reason: event.reason,
          promise: event.promise,
        });
      }
    });

    window.addEventListener('error', event => {
      console.error('Global error:', event.error);
      
      // In production, send to error monitoring service
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error monitoring service
        console.error('Production global error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        });
      }
    });
  }
}