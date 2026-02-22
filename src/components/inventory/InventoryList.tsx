'use client';

import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { InventoryItem } from '@/lib/types/inventory';

interface InventoryListProps {
  items: InventoryItem[];
  onItemClick: (itemId: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function InventoryList({
  items,
  onItemClick,
  loading,
  error,
}: InventoryListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  if (items.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', m: 2 }}>
        <Typography variant="h6" color="text.secondary">
          No inventory items found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add some items to your master list and start tracking inventory.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ m: 2 }}>
      <List>
        {items.map(item => (
          <ListItem key={item.master_item_id} disablePadding>
            <ListItemButton
              onClick={() => onItemClick(item.master_item_id)}
              data-testid="inventory-item"
            >
              <ListItemText
                primary={
                  <Typography variant="body1">
                    {item.name}: {item.current_quantity} {item.unit}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Value: ₹{item.total_value.toFixed(2)}
                      {!isMobile && item.last_transaction_date && (
                        <>
                          {' '}
                          • Last Updated:{' '}
                          {new Date(
                            item.last_transaction_date
                          ).toLocaleDateString()}
                        </>
                      )}
                    </Typography>
                    {isMobile && item.last_transaction_date && (
                      <Typography variant="body2" color="text.secondary">
                        Last Updated:{' '}
                        {new Date(
                          item.last_transaction_date
                        ).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
