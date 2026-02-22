'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { useItemHistory } from '@/lib/hooks/useInventory';
import { useMasterItems } from '@/lib/hooks/useMasterItems';
import { useInventory } from '@/lib/hooks/useInventory';
import { ItemHistory } from '@/components/inventory/ItemHistory';
import { AddInventoryForm } from '@/components/inventory/AddInventoryForm';
import { RemoveInventoryForm } from '@/components/inventory/RemoveInventoryForm';
import { inventoryService } from '@/lib/services/inventoryService';
import { AddInventoryData, RemoveInventoryData } from '@/lib/types/inventory';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const itemId = params.id as string;

  const { transactions, loading, error, refetch } = useItemHistory(itemId);
  const { items: masterItems } = useMasterItems();
  const { items: currentInventory, refetch: refetchInventory } = useInventory();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get item details from the first transaction
  const itemDetails =
    transactions.length > 0 ? transactions[0].master_item : null;

  const handleAddInventory = () => {
    setShowAddForm(true);
    setAddError(null);
  };

  const handleRemoveInventory = () => {
    setShowRemoveForm(true);
    setRemoveError(null);
  };

  const handleAddSubmit = async (data: AddInventoryData) => {
    if (!user) return;

    try {
      setAddLoading(true);
      setAddError(null);

      await inventoryService.addInventory(user.id, data);

      setShowAddForm(false);
      setSuccessMessage('Inventory added successfully!');
      refetch(); // Refresh the transaction history
      refetchInventory(); // Refresh current inventory
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : 'Failed to add inventory'
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveSubmit = async (data: RemoveInventoryData) => {
    if (!user) return;

    try {
      setRemoveLoading(true);
      setRemoveError(null);

      const result = await inventoryService.removeInventory(user.id, data);

      if (result.success) {
        setShowRemoveForm(false);
        setSuccessMessage(
          `Inventory removed successfully! Total cost: ₹${result.totalCost.toFixed(2)}`
        );
        refetch(); // Refresh the transaction history
        refetchInventory(); // Refresh current inventory
      } else {
        setRemoveError(result.error || 'Failed to remove inventory');
      }
    } catch (err) {
      setRemoveError(
        err instanceof Error ? err.message : 'Failed to remove inventory'
      );
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
    setAddError(null);
  };

  const handleRemoveCancel = () => {
    setShowRemoveForm(false);
    setRemoveError(null);
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" display="inline">
          Item Details
        </Typography>
      </Box>

      <ItemHistory
        itemName={itemDetails?.name}
        itemUnit={itemDetails?.unit}
        transactions={transactions}
        loading={loading}
        error={error}
        onAddInventory={handleAddInventory}
        onRemoveInventory={handleRemoveInventory}
      />

      <AddInventoryForm
        open={showAddForm}
        masterItems={masterItems}
        onSubmit={handleAddSubmit}
        onCancel={handleAddCancel}
        loading={addLoading}
        error={addError}
        preselectedItemId={itemId}
      />

      <RemoveInventoryForm
        open={showRemoveForm}
        masterItems={masterItems}
        currentInventory={currentInventory}
        onSubmit={handleRemoveSubmit}
        onCancel={handleRemoveCancel}
        loading={removeLoading}
        error={removeError}
        preselectedItemId={itemId}
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
