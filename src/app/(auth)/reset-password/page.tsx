'use client';

import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from '@/lib/utils/validation';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(data.email);
      setSuccess(true);
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
          Check Your Email
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          We&apos;ve sent you a password reset link. Please check your inbox and
          follow the instructions to reset your password.
        </Alert>
        <Button component={Link} href="/login" variant="outlined" size="large">
          Back to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your email address and we&apos;ll send you a link to reset your
          password
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Reset Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register('email')}
          fullWidth
          label="Email Address"
          type="email"
          autoComplete="email"
          autoFocus
          error={!!errors.email}
          helperText={errors.email?.message}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mb: 3 }}
        >
          {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
        </Button>

        {/* Navigation Links */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Remember your password?{' '}
            <MuiLink component={Link} href="/login" underline="hover">
              Back to Login
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
