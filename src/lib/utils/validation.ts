import { z } from 'zod';

/**
 * Common validation schemas using Zod
 */

// Base schemas for common data types
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const quantitySchema = z
  .number()
  .positive('Quantity must be greater than 0')
  .finite('Quantity must be a valid number');

export const priceSchema = z
  .number()
  .min(0, 'Price cannot be negative')
  .finite('Price must be a valid number');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .optional(),
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Master item schemas
export const masterItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be less than 100 characters')
    .trim(),
  unit: z
    .string()
    .min(1, 'Unit is required')
    .max(20, 'Unit must be less than 20 characters')
    .trim(),
});

// Inventory transaction schemas
export const addInventorySchema = z.object({
  master_item_id: z.string().uuid('Please select a valid item'),
  quantity: quantitySchema,
  unit_price: priceSchema,
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

export const removeInventorySchema = z.object({
  master_item_id: z.string().uuid('Please select a valid item'),
  quantity: quantitySchema,
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

// Report schemas
export const dateRangeSchema = z
  .object({
    start: z.date(),
    end: z.date(),
  })
  .refine(data => data.start <= data.end, {
    message: 'Start date must be before or equal to end date',
    path: ['end'],
  });

export const reportFiltersSchema = z.object({
  dateRange: dateRangeSchema,
  selectedItems: z.array(z.string().uuid()).optional(),
  period: z.enum(['day', 'week', 'month', 'quarter']).optional(),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type MasterItemFormData = z.infer<typeof masterItemSchema>;
export type AddInventoryFormData = z.infer<typeof addInventorySchema>;
export type RemoveInventoryFormData = z.infer<typeof removeInventorySchema>;
export type ReportFiltersData = z.infer<typeof reportFiltersSchema>;

/**
 * Utility function to validate data against a schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data/errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}
