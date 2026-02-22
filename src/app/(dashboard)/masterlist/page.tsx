'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { createDatabaseService, MasterItem } from '@/lib/database';

interface MasterItemFormData {
  name: string;
  unit: string;
}

// Predefined unit options organized by category
const UNIT_OPTIONS = [
  // Count/Quantity
  { value: 'pcs', label: 'Pieces (pcs)', category: 'Count' },
  { value: 'qty', label: 'Quantity (qty)', category: 'Count' },
  { value: 'units', label: 'Units', category: 'Count' },
  { value: 'items', label: 'Items', category: 'Count' },
  { value: 'boxes', label: 'Boxes', category: 'Count' },
  { value: 'packets', label: 'Packets', category: 'Count' },

  // Weight
  { value: 'kg', label: 'Kilograms (kg)', category: 'Weight' },
  { value: 'g', label: 'Grams (g)', category: 'Weight' },
  { value: 'mg', label: 'Milligrams (mg)', category: 'Weight' },
  { value: 'ton', label: 'Tons', category: 'Weight' },

  // Volume/Liquid
  { value: 'L', label: 'Liters (L)', category: 'Liquid' },
  { value: 'ml', label: 'Milliliters (ml)', category: 'Liquid' },
  { value: 'cup', label: 'Cups', category: 'Liquid' },

  // Distance/Length
  { value: 'm', label: 'Meters (m)', category: 'Distance' },
  { value: 'cm', label: 'Centimeters (cm)', category: 'Distance' },
  { value: 'mm', label: 'Millimeters (mm)', category: 'Distance' },
  { value: 'km', label: 'Kilometers (km)', category: 'Distance' },
  { value: 'ft', label: 'Feet (ft)', category: 'Distance' },
  { value: 'in', label: 'Inches (in)', category: 'Distance' },
];

export default function MasterlistPage() {
  const { user } = useAuthContext();
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formData, setFormData] = useState<MasterItemFormData>({
    name: '',
    unit: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<MasterItemFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // Helper function to get unit display label
  const getUnitLabel = (unitValue: string): string => {
    const unit = UNIT_OPTIONS.find(option => option.value === unitValue);
    return unit ? unit.label : unitValue;
  };

  const dbService = useMemo(() => createDatabaseService(), []);

  // Load master items
  const loadMasterItems = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const result = await dbService.masterItems.getMasterItems(user.id);

    if (result.error) {
      setError(result.error);
    } else {
      setMasterItems(result.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      const result = await dbService.masterItems.getMasterItems(user.id);

      if (result.error) {
        setError(result.error);
      } else {
        setMasterItems(result.data || []);
      }

      setLoading(false);
    };

    loadData();
  }, [user, dbService]); // Only depend on user and dbService (which is stable due to useMemo)

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<MasterItemFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Item name is required';
    }

    if (!formData.unit.trim()) {
      errors.unit = 'Unit is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user || !validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (editingItem) {
        // Update existing item
        const result = await dbService.masterItems.updateMasterItem(
          editingItem.id,
          {
            name: formData.name.trim(),
            unit: formData.unit.trim(),
            updated_at: new Date().toISOString(),
          }
        );

        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Master item updated successfully');
          handleCloseDialog();
          loadMasterItems();
        }
      } else {
        // Create new item
        const result = await dbService.masterItems.createMasterItem({
          user_id: user.id,
          name: formData.name.trim(),
          unit: formData.unit.trim(),
        });

        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Master item created successfully');
          handleCloseDialog();
          loadMasterItems();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }

    setSubmitting(false);
  };

  // Handle delete
  const handleDelete = async (item: MasterItem) => {
    if (!user) return;

    // Show confirmation dialog with warning about references
    const confirmMessage =
      `Are you sure you want to delete "${item.name}"?\n\n` +
      'Note: Items with inventory transaction history cannot be deleted to maintain data integrity.';

    if (!confirm(confirmMessage)) {
      return;
    }

    setError(null);

    const result = await dbService.masterItems.deleteMasterItem(
      item.id,
      user.id
    );

    if (result.error) {
      if (result.error.includes('inventory transactions')) {
        setError(
          `Cannot delete "${item.name}" because it has inventory transactions. ` +
            'Items with transaction history cannot be deleted to maintain data integrity.'
        );
      } else {
        setError(result.error);
      }
    } else {
      setSuccess(`Master item "${item.name}" deleted successfully`);
      loadMasterItems();
    }
  };

  // Dialog handlers
  const handleOpenDialog = (item?: MasterItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, unit: item.unit });
    } else {
      setEditingItem(null);
      setFormData({ name: '', unit: '' });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: '', unit: '' });
    setFormErrors({});
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Master Data Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your master list of inventory items and their units
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Master Items
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : masterItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                No master items found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click the + button to add your first master item
              </Typography>
            </Box>
          ) : (
            <List>
              {masterItems.map((item, index) => (
                <Box key={item.id}>
                  <ListItem>
                    <ListItemText
                      primary={item.name}
                      secondary={`Unit: ${getUnitLabel(item.unit)}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpenDialog(item)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(item)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < masterItems.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit Master Item' : 'Add Master Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mb: 2 }}
          />
          <FormControl
            fullWidth
            variant="outlined"
            error={!!formErrors.unit}
            sx={{ mb: 1 }}
          >
            <InputLabel>Unit</InputLabel>
            <Select
              value={formData.unit}
              onChange={e => setFormData({ ...formData, unit: e.target.value })}
              label="Unit"
            >
              {/* Group units by category */}
              <MenuItem
                disabled
                sx={{ fontWeight: 'bold', color: 'primary.main' }}
              >
                Count
              </MenuItem>
              {UNIT_OPTIONS.filter(unit => unit.category === 'Count').map(
                unit => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                )
              )}

              <MenuItem
                disabled
                sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}
              >
                Weight
              </MenuItem>
              {UNIT_OPTIONS.filter(unit => unit.category === 'Weight').map(
                unit => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                )
              )}

              <MenuItem
                disabled
                sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}
              >
                Liquid
              </MenuItem>
              {UNIT_OPTIONS.filter(unit => unit.category === 'Liquid').map(
                unit => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                )
              )}

              <MenuItem
                disabled
                sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}
              >
                Distance
              </MenuItem>
              {UNIT_OPTIONS.filter(unit => unit.category === 'Distance').map(
                unit => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                )
              )}
            </Select>
            {formErrors.unit && (
              <FormHelperText>{formErrors.unit}</FormHelperText>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={20} />
            ) : editingItem ? (
              'Update'
            ) : (
              'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
