'use client';

import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  Box,
  Divider,
  Button,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
} from '@mui/material';
import {
  CloudDone as CloudDoneIcon,
  CloudQueue as CloudQueueIcon,
  Error as ErrorIcon,
  SyncProblem as SyncProblemIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useOfflineQueue, QueuedOperation } from '@/lib/utils/offlineQueue';
import { usePWA } from '@/lib/utils/pwa';

export function SyncStatus() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    pending: 0,
    failed: 0,
    operations: [] as QueuedOperation[],
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    syncPendingOperations,
    getQueueStatus,
    clearQueue,
    retryFailedOperations,
    on,
    off,
  } = useOfflineQueue();

  const { isOnline } = usePWA();

  useEffect(() => {
    const updateStatus = async () => {
      const status = await getQueueStatus();
      setQueueStatus(status);
    };

    const handleSyncStarted = () => setIsSyncing(true);
    const handleSyncCompleted = () => {
      setIsSyncing(false);
      updateStatus();
    };
    const handleOperationQueued = () => updateStatus();
    const handleOperationSynced = () => updateStatus();
    const handleOperationFailed = () => updateStatus();

    // Initial load
    updateStatus();

    // Listen to queue events
    on('syncStarted', handleSyncStarted);
    on('syncCompleted', handleSyncCompleted);
    on('operationQueued', handleOperationQueued);
    on('operationSynced', handleOperationSynced);
    on('operationFailed', handleOperationFailed);

    return () => {
      off('syncStarted', handleSyncStarted);
      off('syncCompleted', handleSyncCompleted);
      off('operationQueued', handleOperationQueued);
      off('operationSynced', handleOperationSynced);
      off('operationFailed', handleOperationFailed);
    };
  }, [getQueueStatus, on, off]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSync = async () => {
    await syncPendingOperations();
    handleClose();
  };

  const handleRetryFailed = async () => {
    await retryFailedOperations();
    handleClose();
  };

  const handleClearQueue = async () => {
    await clearQueue();
    handleClose();
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <CircularProgress size={20} />;
    }

    if (!isOnline) {
      return <CloudQueueIcon color="warning" />;
    }

    if (queueStatus.failed > 0) {
      return <SyncProblemIcon color="error" />;
    }

    if (queueStatus.pending > 0) {
      return <CloudQueueIcon color="info" />;
    }

    return <CloudDoneIcon color="success" />;
  };

  const getStatusText = () => {
    if (isSyncing) {
      return 'Syncing...';
    }

    if (!isOnline) {
      return 'Offline';
    }

    if (queueStatus.failed > 0) {
      return `${queueStatus.failed} failed`;
    }

    if (queueStatus.pending > 0) {
      return `${queueStatus.pending} pending`;
    }

    return 'All synced';
  };

  const formatOperationType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const shouldShowBadge = queueStatus.pending > 0 || queueStatus.failed > 0;

  return (
    <>
      <IconButton onClick={handleClick} color="inherit" title={getStatusText()}>
        <Badge
          badgeContent={
            shouldShowBadge ? queueStatus.pending + queueStatus.failed : 0
          }
          color={queueStatus.failed > 0 ? 'error' : 'primary'}
          variant="dot"
          invisible={!shouldShowBadge}
        >
          {getStatusIcon()}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 320, maxWidth: 400 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sync Status
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              size="small"
              label={`${queueStatus.pending} Pending`}
              color={queueStatus.pending > 0 ? 'info' : 'default'}
              variant={queueStatus.pending > 0 ? 'filled' : 'outlined'}
            />
            <Chip
              size="small"
              label={`${queueStatus.failed} Failed`}
              color={queueStatus.failed > 0 ? 'error' : 'default'}
              variant={queueStatus.failed > 0 ? 'filled' : 'outlined'}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              fullWidth
            >
              Sync Now
            </Button>
            {queueStatus.failed > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={handleRetryFailed}
                disabled={isSyncing}
              >
                Retry
              </Button>
            )}
          </Box>

          {queueStatus.total > 0 && (
            <Button
              size="small"
              variant="text"
              color="error"
              startIcon={<ClearIcon />}
              onClick={handleClearQueue}
              fullWidth
            >
              Clear Queue
            </Button>
          )}
        </Box>

        {queueStatus.operations.length > 0 && (
          <>
            <Divider />
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {queueStatus.operations.slice(0, 10).map(operation => (
                  <ListItem key={operation.id}>
                    <ListItemIcon>
                      {operation.status === 'failed' ? (
                        <ErrorIcon color="error" fontSize="small" />
                      ) : operation.status === 'syncing' ? (
                        <CircularProgress size={16} />
                      ) : (
                        <CloudQueueIcon color="info" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={formatOperationType(operation.type)}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {formatTimestamp(operation.timestamp)}
                          </Typography>
                          {operation.error && (
                            <Typography
                              variant="caption"
                              color="error"
                              display="block"
                            >
                              {operation.error}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {queueStatus.operations.length > 10 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="caption" color="text.secondary">
                          ... and {queueStatus.operations.length - 10} more
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}

export default SyncStatus;
