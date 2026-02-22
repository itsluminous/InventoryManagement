'use client';

import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Slide,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { usePWA } from '@/lib/utils/pwa';

interface OfflineIndicatorProps {
  showOnlineMessage?: boolean;
  autoHide?: boolean;
}

export function OfflineIndicator({
  showOnlineMessage = true,
  autoHide = true,
}: OfflineIndicatorProps) {
  const [showOffline, setShowOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const { isOnline, on, off } = usePWA();

  useEffect(() => {
    const handleOffline = () => {
      setShowOffline(true);
      setShowOnline(false);
      setWasOffline(true);
    };

    const handleOnline = () => {
      setShowOffline(false);
      if (wasOffline && showOnlineMessage) {
        setShowOnline(true);
        if (autoHide) {
          setTimeout(() => setShowOnline(false), 3000);
        }
      }
      setWasOffline(false);
    };

    // Set initial state
    if (!isOnline) {
      handleOffline();
    }

    on('offline', handleOffline);
    on('online', handleOnline);

    return () => {
      off('offline', handleOffline);
      off('online', handleOnline);
    };
  }, [isOnline, wasOffline, showOnlineMessage, autoHide, on, off]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleCloseOffline = () => {
    setShowOffline(false);
  };

  const handleCloseOnline = () => {
    setShowOnline(false);
  };

  return (
    <>
      {/* Offline Indicator */}
      <Snackbar
        open={showOffline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' } as any} // eslint-disable-line @typescript-eslint/no-explicit-any
      >
        <Alert
          severity="warning"
          icon={<OfflineIcon />}
          onClose={handleCloseOffline}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleRefresh}
              title="Refresh page"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            width: '100%',
            '& .MuiAlert-message': {
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            },
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            You&apos;re offline
          </Typography>
          <Typography variant="caption">
            Some features may not work. Changes will sync when you&apos;re back
            online.
          </Typography>
        </Alert>
      </Snackbar>

      {/* Online Indicator */}
      <Snackbar
        open={showOnline}
        autoHideDuration={autoHide ? 3000 : undefined}
        onClose={handleCloseOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' } as any} // eslint-disable-line @typescript-eslint/no-explicit-any
      >
        <Alert
          severity="success"
          icon={<OnlineIcon />}
          onClose={autoHide ? undefined : handleCloseOnline}
          sx={{
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              You&apos;re back online!
            </Typography>
            <Typography variant="caption">
              All features are now available.
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
}

export default OfflineIndicator;
