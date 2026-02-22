'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
  Backdrop,
  CircularProgress,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';

interface FeedbackMessage {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface FeedbackContextType {
  showMessage: (message: string, severity?: AlertColor, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  clearMessages: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loading, setLoadingState] = useState<LoadingState>({
    isLoading: false,
  });

  const showMessage = useCallback(
    (message: string, severity: AlertColor = 'info', duration: number = 6000) => {
      const id = Date.now().toString();
      const newMessage: FeedbackMessage = {
        id,
        message,
        severity,
        duration,
      };

      setMessages(prev => [...prev, newMessage]);

      // Auto-remove message after duration
      if (duration > 0) {
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== id));
        }, duration);
      }
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showMessage(message, 'success', duration);
    },
    [showMessage]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showMessage(message, 'error', duration || 8000); // Longer duration for errors
    },
    [showMessage]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showMessage(message, 'warning', duration);
    },
    [showMessage]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showMessage(message, 'info', duration);
    },
    [showMessage]
  );

  const setLoading = useCallback(
    (isLoading: boolean, message?: string, progress?: number) => {
      setLoadingState({
        isLoading,
        message,
        progress,
      });
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const handleCloseMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const contextValue: FeedbackContextType = {
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    setLoading,
    clearMessages,
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2,
        }}
        open={loading.isLoading}
      >
        <CircularProgress color="inherit" />
        {loading.message && (
          <Typography variant="body1" textAlign="center">
            {loading.message}
          </Typography>
        )}
        {loading.progress !== undefined && (
          <Box sx={{ width: 300 }}>
            <LinearProgress
              variant="determinate"
              value={loading.progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
              {Math.round(loading.progress)}%
            </Typography>
          </Box>
        )}
      </Backdrop>

      {/* Message Snackbars */}
      {messages.map((message, index) => (
        <Snackbar
          key={message.id}
          open={true}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          sx={{
            bottom: theme => theme.spacing(8 * index + 2),
          }}
        >
          <Alert
            onClose={() => handleCloseMessage(message.id)}
            severity={message.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {message.message}
          </Alert>
        </Snackbar>
      ))}
    </FeedbackContext.Provider>
  );
}

// Higher-order component for automatic error handling
export function withErrorHandling<T extends object>(
  Component: React.ComponentType<T>
) {
  return function WrappedComponent(props: T) {
    const feedback = useFeedback();

    const handleError = useCallback(
      (error: Error | string) => {
        const message = typeof error === 'string' ? error : error.message;
        feedback.showError(message);
      },
      [feedback]
    );

    return <Component {...props} onError={handleError} />;
  };
}

// Hook for async operations with automatic feedback
export function useAsyncOperation() {
  const feedback = useFeedback();

  const execute = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: {
        loadingMessage?: string;
        successMessage?: string;
        errorMessage?: string;
        showProgress?: boolean;
      }
    ): Promise<T | null> => {
      try {
        feedback.setLoading(true, options?.loadingMessage);

        const result = await operation();

        if (options?.successMessage) {
          feedback.showSuccess(options.successMessage);
        }

        return result;
      } catch (error) {
        const errorMessage =
          options?.errorMessage ||
          (error instanceof Error ? error.message : 'An error occurred');
        feedback.showError(errorMessage);
        return null;
      } finally {
        feedback.setLoading(false);
      }
    },
    [feedback]
  );

  return { execute };
}

export default FeedbackProvider;