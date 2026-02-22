'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Smartphone as MobileIcon,
  Computer as DesktopIcon,
} from '@mui/icons-material';
import { usePWA } from '@/lib/utils/pwa';

interface PWAInstallPromptProps {
  autoShow?: boolean;
  showInSnackbar?: boolean;
}

export function PWAInstallPrompt({
  autoShow = true,
  showInSnackbar = false,
}: PWAInstallPromptProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { canInstall, isInstalled, promptInstall, on, off } = usePWA();

  useEffect(() => {
    const handleInstallable = () => {
      if (autoShow && !dismissed && !isInstalled) {
        if (showInSnackbar) {
          setShowSnackbar(true);
        } else {
          setShowDialog(true);
        }
      }
    };

    const handleInstalled = () => {
      setShowDialog(false);
      setShowSnackbar(false);
      setInstalling(false);
    };

    on('installable', handleInstallable);
    on('installed', handleInstalled);

    return () => {
      off('installable', handleInstallable);
      off('installed', handleInstalled);
    };
  }, [autoShow, dismissed, isInstalled, showInSnackbar, on, off]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const result = await promptInstall();
      if (result?.outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
        setDismissed(true);
      }
    } catch (error) {
      console.error('PWA installation error:', error);
    } finally {
      setInstalling(false);
      setShowDialog(false);
      setShowSnackbar(false);
    }
  };

  const handleDismiss = () => {
    setShowDialog(false);
    setShowSnackbar(false);
    setDismissed(true);
  };

  if (isInstalled || !canInstall) {
    return null;
  }

  if (showInSnackbar) {
    return (
      <Snackbar
        open={showSnackbar}
        autoHideDuration={10000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleInstall}
                disabled={installing}
                startIcon={<InstallIcon />}
              >
                Install
              </Button>
              <IconButton size="small" color="inherit" onClick={handleDismiss}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          Install IMS app for better experience!
        </Alert>
      </Snackbar>
    );
  }

  return (
    <Dialog
      open={showDialog}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          mx: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InstallIcon color="primary" />
          <Typography variant="h6" component="span">
            Install IMS App
          </Typography>
        </Box>
        <IconButton
          onClick={handleDismiss}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" paragraph>
          Install the Inventory Management System app for a better experience:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MobileIcon color="primary" />
            <Typography variant="body2">
              Works offline - manage inventory without internet
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DesktopIcon color="primary" />
            <Typography variant="body2">
              Native app experience with faster loading
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InstallIcon color="primary" />
            <Typography variant="body2">
              Quick access from home screen or desktop
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleDismiss} color="inherit">
          Not Now
        </Button>
        <Button
          onClick={handleInstall}
          variant="contained"
          disabled={installing}
          startIcon={<InstallIcon />}
        >
          {installing ? 'Installing...' : 'Install App'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PWAInstallPrompt;
