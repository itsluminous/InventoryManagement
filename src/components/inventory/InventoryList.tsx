'use client';

import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { InventoryItem } from '@/lib/types/inventory';
import {
  InventoryListSkeleton,
  StaggeredList,
  AnimatedBox,
} from '@/components/layout';

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
    return <InventoryListSkeleton />;
  }

  if (error) {
    return (
      <AnimatedBox animation="slideUp">
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      </AnimatedBox>
    );
  }

  if (items.length === 0) {
    return (
      <AnimatedBox animation="scaleIn">
        <Paper sx={{ p: 4, textAlign: 'center', m: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No inventory items found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Add some items to your master list and start tracking inventory.
          </Typography>
        </Paper>
      </AnimatedBox>
    );
  }

  const listItems = items.map(item => (
    <ListItem key={item.master_item_id} disablePadding>
      <ListItemButton
        onClick={() => onItemClick(item.master_item_id)}
        data-testid="inventory-item"
        sx={{
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'translateX(4px)',
          },
        }}
      >
        <ListItemText
          primary={
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                    {new Date(item.last_transaction_date).toLocaleDateString()}
                  </>
                )}
              </Typography>
              {isMobile && item.last_transaction_date && (
                <Typography variant="body2" color="text.secondary">
                  Last Updated:{' '}
                  {new Date(item.last_transaction_date).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  ));

  return (
    <AnimatedBox animation="slideUp">
      <Paper sx={{ m: 2, overflow: 'hidden' }}>
        <List>
          <StaggeredList staggerDelay={0.05}>{listItems}</StaggeredList>
        </List>
      </Paper>
    </AnimatedBox>
  );
}
