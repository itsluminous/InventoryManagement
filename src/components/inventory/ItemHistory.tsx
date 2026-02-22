'use client';

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { InventoryTransactionWithItem } from '@/lib/types/inventory';

interface ItemHistoryProps {
  itemName?: string;
  itemUnit?: string;
  transactions: InventoryTransactionWithItem[];
  loading?: boolean;
  error?: string | null;
  onAddInventory: () => void;
  onRemoveInventory: () => void;
}

export function ItemHistory({
  itemName,
  itemUnit,
  transactions,
  loading,
  error,
  onAddInventory,
  onRemoveInventory,
}: ItemHistoryProps) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Calculate total current value
  const totalValue = transactions
    .filter(t => t.transaction_type === 'add')
    .reduce((sum, t) => sum + t.remaining_quantity * t.unit_price, 0);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with item info and actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h5" gutterBottom>
              {itemName || 'Item History'}
            </Typography>
            {itemUnit && (
              <Typography variant="body2" color="text.secondary">
                Unit: {itemUnit}
              </Typography>
            )}
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              Total Value: ₹{totalValue.toFixed(2)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddInventory}
              color="success"
            >
              Add Inventory
            </Button>
            <Button
              variant="outlined"
              startIcon={<RemoveIcon />}
              onClick={onRemoveInventory}
              color="error"
            >
              Remove Inventory
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Transaction History */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Transaction History (Last 3 Months)
          </Typography>
        </Box>

        {transactions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No transactions found for this item.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total Price</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(
                        transaction.transaction_date
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.transaction_type.toUpperCase()}
                        color={
                          transaction.transaction_type === 'add'
                            ? 'success'
                            : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {transaction.quantity} {itemUnit}
                    </TableCell>
                    <TableCell align="right">
                      ₹{transaction.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{transaction.total_price.toFixed(2)}
                    </TableCell>
                    <TableCell>{transaction.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
