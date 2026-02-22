'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Typography, Box, IconButton } from '@mui/material';
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
import {
  useFeedback,
  useAsyncOperation,
} from '@/components/layout/FeedbackSystem';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const feedback = useFeedback();
  const { execute } = useAsyncOperation();
  const itemId = params.id as string;

  const {
    transactions,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refetch,
  } = useItemHistory(itemId);
  const { items: masterItems } = useMasterItems();
  const { items: currentInventory, refetch: refetchInventory } = useInventory();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showRemoveForm, setShowRemoveForm] = useState(false);

  // Get item details from the first transaction
  const itemDetails =
    transactions.length > 0 ? transactions[0].master_item : null;

  const handleAddInventory = () => {
    setShowAddForm(true);
  };

  const handleRemoveInventory = () => {
    setShowRemoveForm(true);
  };

  const handleAddSubmit = async (data: AddInventoryData) => {
    if (!user) return;

    const result = await execute(
      () => inventoryService.addInventory(user.id, data),
      {
        loadingMessage: 'Adding inventory...',
        successMessage: 'Inventory added successfully!',
        errorMessage: 'Failed to add inventory',
      }
    );

    if (result) {
      setShowAddForm(false);
      refetch(); // Refresh the transaction history
      refetchInventory(); // Refresh current inventory
    }
  };

  const handleRemoveSubmit = async (data: RemoveInventoryData) => {
    if (!user) return;

    const result = await execute(
      async () => {
        const removeResult = await inventoryService.removeInventory(
          user.id,
          data
        );
        if (!removeResult.success) {
          throw new Error(removeResult.error || 'Failed to remove inventory');
        }
        return removeResult;
      },
      {
        loadingMessage: 'Removing inventory...',
        errorMessage: 'Failed to remove inventory',
      }
    );

    if (result) {
      setShowRemoveForm(false);
      feedback.showSuccess(
        `Inventory removed successfully! Total cost: ₹${result.totalCost.toFixed(2)}`
      );
      refetch(); // Refresh the transaction history
      refetchInventory(); // Refresh current inventory
    }
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
  };

  const handleRemoveCancel = () => {
    setShowRemoveForm(false);
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
        hasMore={hasMore}
        totalCount={totalCount}
        onAddInventory={handleAddInventory}
        onRemoveInventory={handleRemoveInventory}
        onLoadMore={loadMore}
      />

      <AddInventoryForm
        open={showAddForm}
        masterItems={masterItems}
        onSubmit={handleAddSubmit}
        onCancel={handleAddCancel}
        preselectedItemId={itemId}
      />

      <RemoveInventoryForm
        open={showRemoveForm}
        masterItems={masterItems}
        currentInventory={currentInventory}
        onSubmit={handleRemoveSubmit}
        onCancel={handleRemoveCancel}
        preselectedItemId={itemId}
      />
    </Container>
  );
}
