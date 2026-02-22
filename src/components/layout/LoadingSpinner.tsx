'use client';

import React from 'react';
import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

// Optimized loading animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  variant?: 'circular' | 'skeleton' | 'pulse';
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 40,
  message,
  variant = 'circular',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const containerSx = fullScreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        animation: `${fadeIn} 0.2s ease-out`,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column' as const,
        gap: 2,
        p: 3,
        animation: `${fadeIn} 0.2s ease-out`,
      };

  if (variant === 'skeleton') {
    return (
      <Box sx={containerSx}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={60}
          sx={{ mb: 1 }}
        />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </Box>
    );
  }

  if (variant === 'pulse') {
    return (
      <Box
        sx={{
          ...containerSx,
          animation: `${pulse} 1.5s ease-in-out infinite`,
        }}
      >
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={containerSx}>
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 2,
            animation: `${fadeIn} 0.3s ease-out 0.1s both`,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

// Optimized skeleton loaders for specific components
export function InventoryListSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            mb: 2,
            animation: `${fadeIn} 0.3s ease-out ${index * 0.1}s both`,
          }}
        >
          <Skeleton
            variant="rectangular"
            height={72}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      ))}
    </Box>
  );
}

export function ReportSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton
        variant="rectangular"
        height={200}
        sx={{ mb: 3, borderRadius: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Skeleton variant="rectangular" width="30%" height={40} />
        <Skeleton variant="rectangular" width="30%" height={40} />
        <Skeleton variant="rectangular" width="30%" height={40} />
      </Box>
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
    </Box>
  );
}

export function MasterListSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            animation: `${fadeIn} 0.3s ease-out ${index * 0.05}s both`,
          }}
        >
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="20%" height={24} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
      ))}
    </Box>
  );
}
