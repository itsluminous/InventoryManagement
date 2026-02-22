'use client';

import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { Navigation } from './Navigation';

interface AppShellProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disableGutters?: boolean;
  fullWidth?: boolean;
}

export function AppShell({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  fullWidth = false,
}: AppShellProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Navigation />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {fullWidth ? (
          <Box sx={{ flexGrow: 1 }}>{children}</Box>
        ) : (
          <Container
            maxWidth={maxWidth}
            disableGutters={disableGutters}
            sx={{
              flexGrow: 1,
              py: { xs: 1, sm: 2, md: 3 },
              px: { xs: 0.5, sm: 2 },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </Container>
        )}
      </Box>
    </Box>
  );
}
