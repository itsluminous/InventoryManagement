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
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { InventoryTransactionWithItem } from '@/lib/types/inventory';

interface ItemHistoryProps {
  itemName?: string;
  itemUnit?: string;
  transactions: InventoryTransactionWithItem[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  totalCount?: number;
  onAddInventory: () => void;
  onRemoveInventory: () => void;
  onLoadMore?: () => void;
}

export function ItemHistory({
  itemName,
  itemUnit,
  transactions,
  loading,
  error,
  hasMore = false,
  totalCount = 0,
  onAddInventory,
  onRemoveInventory,
  onLoadMore,
}: ItemHistoryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  if (loading && transactions.length === 0) {
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

  // Calculate total current value from add transactions with remaining quantity
  const totalValue = transactions
    .filter(t => t.transaction_type === 'add')
    .reduce((sum, t) => sum + t.remaining_quantity * t.unit_price, 0);

  return (
    <Box sx={{ p: { xs: 0.5, sm: 1, md: 2 } }}>
      {/* Header with item info and actions */}
      <Paper
        sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: { xs: 1.5, sm: 2, md: 3 } }}
      >
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
            {totalCount > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Showing {transactions.length} of {totalCount} transactions
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddInventory}
              color="success"
            >
              {isMobile ? 'Add' : 'Add Inventory'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RemoveIcon />}
              onClick={onRemoveInventory}
              color="error"
            >
              {isMobile ? 'Remove' : 'Remove Inventory'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Transaction History */}
      <Paper>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
        </Box>

        {/* Loading indicator for pagination */}
        {loading && transactions.length > 0 && <LinearProgress />}

        {transactions.length === 0 && !loading ? (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No transactions found for this item.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: { xs: 60, sm: 120 } }}>
                      Date
                    </TableCell>
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
                      <TableCell
                        sx={{
                          minWidth: { xs: 60, sm: 120 },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isMobile ? (
                          <Box sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>
                            <Box>
                              {new Date(
                                transaction.transaction_date
                              ).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                              })}
                            </Box>
                            <Box
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.65rem',
                              }}
                            >
                              {new Date(
                                transaction.transaction_date
                              ).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </Box>
                          </Box>
                        ) : (
                          new Date(
                            transaction.transaction_date
                          ).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        )}
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

            {/* Load More Button */}
            {hasMore && onLoadMore && (
              <Box sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<ExpandMoreIcon />}
                  onClick={onLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Transactions'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
