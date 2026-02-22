'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Fab,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { useInventory } from '@/lib/hooks/useInventory';
import { useMasterItems } from '@/lib/hooks/useMasterItems';
import { InventoryList } from '@/components/inventory/InventoryList';
import { AddInventoryForm } from '@/components/inventory/AddInventoryForm';
import { inventoryService } from '@/lib/services/inventoryService';
import { AddInventoryData } from '@/lib/types/inventory';
import { PageTransition, AnimatedBox } from '@/components/layout';

export default function HomePage() {
  const { user } = useAuthContext();
  const { items, loading, error, refetch } = useInventory();
  const { items: masterItems } = useMasterItems();
  const router = useRouter();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Memoize sorted items for better performance
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // Debounced navigation for better performance
  const debouncedNavigate = useCallback(
    (itemId: string) => {
      router.push(`/item/${itemId}`);
    },
    [router]
  );

  const handleItemClick = useCallback(
    (itemId: string) => {
      debouncedNavigate(itemId);
    },
    [debouncedNavigate]
  );

  const handleAddInventory = useCallback(() => {
    setShowAddForm(true);
    setAddError(null);
  }, []);

  const handleAddSubmit = useCallback(
    async (data: AddInventoryData) => {
      if (!user) return;

      try {
        setAddLoading(true);
        setAddError(null);

        await inventoryService.addInventory(user.id, data);

        setShowAddForm(false);
        setSuccessMessage('Inventory added successfully!');
        refetch(); // Refresh the inventory list
      } catch (err) {
        setAddError(
          err instanceof Error ? err.message : 'Failed to add inventory'
        );
      } finally {
        setAddLoading(false);
      }
    },
    [user, refetch]
  );

  const handleAddCancel = useCallback(() => {
    setShowAddForm(false);
    setAddError(null);
  }, []);

  const handleCloseSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return (
    <>
      <PageTransition>
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 1, sm: 2, md: 4 },
            px: { xs: 1, sm: 2 },
            position: 'relative',
            minHeight: '100vh',
          }}
        >
          <AnimatedBox animation="slideUp" delay={0.1}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Current Inventory
              </Typography>
            </Box>
          </AnimatedBox>

          <InventoryList
            items={sortedItems}
            onItemClick={handleItemClick}
            loading={loading}
            error={error}
          />

          <AddInventoryForm
            open={showAddForm}
            masterItems={masterItems}
            onSubmit={handleAddSubmit}
            onCancel={handleAddCancel}
            loading={addLoading}
            error={addError}
          />

          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={handleCloseSuccess}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseSuccess}
              severity="success"
              variant="filled"
              sx={{
                animation: 'slideInUp 0.3s ease-out',
              }}
            >
              {successMessage}
            </Alert>
          </Snackbar>
        </Container>
      </PageTransition>

      {/* Floating Action Button - Outside PageTransition to ensure proper fixed positioning */}
      <Fab
        color="primary"
        aria-label="add inventory"
        onClick={handleAddInventory}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300, // Higher than MUI modal backdrop (1200)
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: 6,
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
      >
        <AddIcon />
      </Fab>
    </>
  );
}
