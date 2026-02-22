'use client';

import { useState } from 'react';
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

export default function HomePage() {
  const { user } = useAuthContext();
  const { items, loading, error, refetch } = useInventory();
  const { items: masterItems } = useMasterItems();
  const router = useRouter();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleItemClick = (itemId: string) => {
    router.push(`/item/${itemId}`);
  };

  const handleAddInventory = () => {
    setShowAddForm(true);
    setAddError(null);
  };

  const handleAddSubmit = async (data: AddInventoryData) => {
    if (!user) return;

    try {
      setAddLoading(true);
      setAddError(null);
      
      await inventoryService.addInventory(user.id, data);
      
      setShowAddForm(false);
      setSuccessMessage('Inventory added successfully!');
      refetch(); // Refresh the inventory list
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add inventory');
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
    setAddError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Current Inventory
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Hello, {user?.user_metadata?.full_name || user?.email}!
        </Typography>
      </Box>

      <InventoryList
        items={items}
        onItemClick={handleItemClick}
        loading={loading}
        error={error}
      />

      {/* Floating Action Button for Add Inventory */}
      <Fab
        color="primary"
        aria-label="add inventory"
        onClick={handleAddInventory}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

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
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
