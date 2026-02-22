'use client';

import {
  Alert,
  Box,
  Button,
  Divider,
  Link as MuiLink,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { signupSchema, SignupFormData } from '@/lib/utils/validation';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await signUp(data.email, data.password, {
        full_name: data.fullName || '',
        business_name: data.businessName || '',
      });

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
          We&apos;ve sent you a confirmation email. Please check your inbox and
          click the verification link to activate your account.
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
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Join the Inventory Management System
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Signup Form */}
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
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            {...register('fullName')}
            fullWidth
            label="Full Name (Optional)"
            autoComplete="name"
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
          />

          <TextField
            {...register('businessName')}
            fullWidth
            label="Business Name (Optional)"
            autoComplete="organization"
            error={!!errors.businessName}
            helperText={errors.businessName?.message}
          />
        </Box>

        <TextField
          {...register('password')}
          fullWidth
          label="Password"
          type="password"
          autoComplete="new-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ mb: 2 }}
        />

        <TextField
          {...register('confirmPassword')}
          fullWidth
          label="Confirm Password"
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
          disabled={isLoading}
          sx={{ mb: 2 }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Navigation Links */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <MuiLink component={Link} href="/login" underline="hover">
              Sign in
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
