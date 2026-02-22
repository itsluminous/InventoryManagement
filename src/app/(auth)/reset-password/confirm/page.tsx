'use client';

import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/lib/auth/AuthProvider';

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

export default function ResetPasswordConfirmPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setError(
        'Invalid or expired reset link. Please request a new password reset.'
      );
    }
  }, [searchParams]);

  const onSubmit = async (data: NewPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await updatePassword(data.password);
      setSuccess(true);

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Password Updated
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          Your password has been successfully updated. You will be redirected to
          the login page shortly.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Set New Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your new password below
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* New Password Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register('password')}
          fullWidth
          label="New Password"
          type="password"
          autoComplete="new-password"
          autoFocus
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ mb: 2 }}
        />

        <TextField
          {...register('confirmPassword')}
          fullWidth
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading || !!error}
          sx={{ mb: 2 }}
        >
          {isLoading ? 'Updating Password...' : 'Update Password'}
        </Button>
      </Box>
    </Box>
  );
}
