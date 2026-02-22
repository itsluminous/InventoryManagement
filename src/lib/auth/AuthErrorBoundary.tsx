'use client';

import React, { ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Refresh, Home } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Authentication error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <AuthErrorFallback
            error={this.state.error}
            resetError={() => this.setState({ hasError: false, error: null })}
          />
        )
      );
    }

    return this.props.children;
  }
}

interface AuthErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

function AuthErrorFallback({ error, resetError }: AuthErrorFallbackProps) {
  const router = useRouter();

  const handleRetry = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    resetError();
    router.push('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h5" gutterBottom color="error">
            Authentication Error
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Something went wrong with the authentication system.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                {error.message || 'An unexpected error occurred'}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRetry}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              Go Home
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
