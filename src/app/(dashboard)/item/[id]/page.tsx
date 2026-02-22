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
import { ItemHistory } from '@/components/inventory/ItemHistory';
import { AddInventoryForm } from '@/components/inventory/AddInventoryForm';
import { inventoryService } from '@/lib/services/inventoryService';
import { AddInventoryData } from '@/lib/types/inventory';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const itemId = params.id as string;
  
  const { transactions, loading, error, refetch } = useItemHistory(itemId);
  const { items: masterItems } = useMasterItems();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Get item details from the first transaction
  const itemDetails = transactions.length > 0 ? transactions[0].master_item : null;

  const handleAddInventory = () => {
    setShowAddForm(true);
    setAddError(null);
  };

  const handleRemoveInventory = () => {
    // TODO: Open remove inventory dialog
    console.log('Remove inventory for item:', itemId);
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
        itemId={itemId}
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