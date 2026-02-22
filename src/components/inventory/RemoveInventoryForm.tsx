'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  MasterItem,
  RemoveInventoryData,
  InventoryItem,
} from '@/lib/types/inventory';

interface RemoveInventoryFormProps {
  open: boolean;
  masterItems: MasterItem[];
  currentInventory: InventoryItem[];
  onSubmit: (data: RemoveInventoryData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  preselectedItemId?: string; // Add preselected item ID prop
}

export function RemoveInventoryForm({
  open,
  masterItems,
  currentInventory,
  onSubmit,
  onCancel,
  loading = false,
  error,
  preselectedItemId,
}: RemoveInventoryFormProps) {
  const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  // Filter items that have current inventory
  const availableItems = useMemo(() => {
    const itemsWithInventory = masterItems.filter(masterItem => {
      const inventoryItem = currentInventory.find(
        inv => inv.master_item_id === masterItem.id
      );
      return inventoryItem && inventoryItem.current_quantity > 0;
    });

    if (!searchText) return itemsWithInventory;

    return itemsWithInventory.filter(item =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [masterItems, currentInventory, searchText]);

  // Get current inventory info for selected item
  const selectedInventoryItem = useMemo(() => {
    if (!selectedItem) return null;
    return currentInventory.find(inv => inv.master_item_id === selectedItem.id);
  }, [selectedItem, currentInventory]);

  // Effect to preselect item when form opens
  useEffect(() => {
    if (open && preselectedItemId && masterItems.length > 0) {
      const preselectedItem = masterItems.find(
        item => item.id === preselectedItemId
      );
      if (preselectedItem) {
        // Check if this item has available inventory
        const hasInventory = currentInventory.some(
          inv =>
            inv.master_item_id === preselectedItemId && inv.current_quantity > 0
        );
        if (hasInventory) {
          setSelectedItem(preselectedItem);
          setSearchText(preselectedItem.name);
        }
      }
    }
  }, [open, preselectedItemId, masterItems, currentInventory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem || !quantity) {
      return;
    }

    const quantityNum = parseFloat(quantity);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      return;
    }

    // Check if requested quantity exceeds available inventory
    if (
      selectedInventoryItem &&
      quantityNum > selectedInventoryItem.current_quantity
    ) {
      return;
    }

    const data: RemoveInventoryData = {
      master_item_id: selectedItem.id,
      quantity: quantityNum,
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit(data);
      // Reset form on success
      setSelectedItem(null);
      setQuantity('');
      setNotes('');
      setSearchText('');
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setQuantity('');
    setNotes('');
    setSearchText('');
    onCancel();
  };

  const quantityNum = parseFloat(quantity);
  const isQuantityValid = !isNaN(quantityNum) && quantityNum > 0;
  const isQuantityExceeded =
    selectedInventoryItem &&
    isQuantityValid &&
    quantityNum > selectedInventoryItem.current_quantity;

  const isValid = selectedItem && isQuantityValid && !isQuantityExceeded;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Remove Inventory</DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Item Selection with Search */}
            <Autocomplete
              options={availableItems}
              getOptionLabel={option => option.name}
              value={selectedItem}
              onChange={(_, newValue) => setSelectedItem(newValue)}
              inputValue={searchText}
              onInputChange={(_, newInputValue) => setSearchText(newInputValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select Item"
                  required
                  helperText="Only items with available inventory are shown"
                />
              )}
              renderOption={(props, option) => {
                const inventoryItem = currentInventory.find(
                  inv => inv.master_item_id === option.id
                );
                return (
                  <li {...props} key={option.id}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Available: {inventoryItem?.current_quantity || 0}{' '}
                        {option.unit}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              noOptionsText="No items with inventory available"
            />

            {/* Current Inventory Display */}
            {selectedInventoryItem && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'info.light',
                  borderRadius: 1,
                  color: 'info.contrastText',
                }}
              >
                <Typography variant="subtitle2">Current Inventory</Typography>
                <Typography variant="body1">
                  {selectedInventoryItem.current_quantity} {selectedItem?.unit}
                </Typography>
                <Typography variant="body2">
                  Total Value: ₹{selectedInventoryItem.total_value.toFixed(2)}
                </Typography>
              </Box>
            )}

            {/* Quantity Input */}
            <TextField
              label="Quantity to Remove"
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
              inputProps={{
                min: 0,
                step: 0.001,
                max: selectedInventoryItem?.current_quantity || undefined,
              }}
              helperText={
                selectedItem
                  ? `Enter quantity in ${selectedItem.unit} (Max: ${selectedInventoryItem?.current_quantity || 0})`
                  : 'Select an item first'
              }
              error={isQuantityExceeded || false}
            />

            {/* Quantity Validation Error */}
            {isQuantityExceeded && (
              <Alert severity="error">
                Requested quantity ({quantityNum}) exceeds available inventory (
                {selectedInventoryItem?.current_quantity}).
              </Alert>
            )}

            {/* FIFO Cost Estimation */}
            {selectedItem && isQuantityValid && !isQuantityExceeded && (
              <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="warning.contrastText">
                  FIFO Removal Information
                </Typography>
                <Typography variant="body2" color="warning.contrastText">
                  This removal will use the oldest inventory first (FIFO
                  method). The actual cost will be calculated based on the
                  original purchase prices.
                </Typography>
              </Box>
            )}

            <Divider />

            {/* Notes Input */}
            <TextField
              label="Notes (Optional)"
              multiline
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              helperText="Add any additional notes about this inventory removal"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="warning"
            disabled={!isValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Removing...' : 'Remove Inventory'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
