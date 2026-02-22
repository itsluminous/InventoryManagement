'use client';

import { useState, useMemo } from 'react';
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
} from '@mui/material';
import { MasterItem, AddInventoryData } from '@/lib/types/inventory';

interface AddInventoryFormProps {
  open: boolean;
  masterItems: MasterItem[];
  onSubmit: (data: AddInventoryData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function AddInventoryForm({
  open,
  masterItems,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: AddInventoryFormProps) {
  const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  // Filter items based on search text
  const filteredItems = useMemo(() => {
    if (!searchText) return masterItems;
    
    return masterItems.filter(item =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [masterItems, searchText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !quantity || !unitPrice) {
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(unitPrice);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      return;
    }

    const data: AddInventoryData = {
      master_item_id: selectedItem.id,
      quantity: quantityNum,
      unit_price: priceNum,
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit(data);
      // Reset form on success
      setSelectedItem(null);
      setQuantity('');
      setUnitPrice('');
      setNotes('');
      setSearchText('');
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setQuantity('');
    setUnitPrice('');
    setNotes('');
    setSearchText('');
    onCancel();
  };

  const isValid = selectedItem && quantity && unitPrice && 
    parseFloat(quantity) > 0 && parseFloat(unitPrice) >= 0;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Inventory</DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Item Selection with Search */}
            <Autocomplete
              options={filteredItems}
              getOptionLabel={(option) => option.name}
              value={selectedItem}
              onChange={(_, newValue) => setSelectedItem(newValue)}
              inputValue={searchText}
              onInputChange={(_, newInputValue) => setSearchText(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Item"
                  required
                  helperText="Type to search for items"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unit: {option.unit}
                    </Typography>
                  </Box>
                </li>
              )}
              noOptionsText="No items found. Add items to your master list first."
            />

            {/* Auto-populated Unit Display */}
            {selectedItem && (
              <TextField
                label="Unit"
                value={selectedItem.unit}
                disabled
                helperText="Unit is automatically populated from master data"
              />
            )}

            {/* Quantity Input */}
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              inputProps={{ min: 0, step: 0.001 }}
              helperText={selectedItem ? `Enter quantity in ${selectedItem.unit}` : 'Select an item first'}
            />

            {/* Unit Price Input */}
            <TextField
              label="Unit Price (₹)"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Price per unit in Indian Rupees"
            />

            {/* Total Price Display */}
            {quantity && unitPrice && !isNaN(parseFloat(quantity)) && !isNaN(parseFloat(unitPrice)) && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" color="primary">
                  Total Price: ₹{(parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2)}
                </Typography>
              </Box>
            )}

            {/* Notes Input */}
            <TextField
              label="Notes (Optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              helperText="Add any additional notes about this inventory addition"
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
            disabled={!isValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Adding...' : 'Add Inventory'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}