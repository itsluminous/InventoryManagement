'use client';

import { Box, Chip, Typography, Alert } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { MasterItem } from '@/lib/database';
import { FuzzyMatchResult } from '@/lib/utils/fuzzyMatch';

interface SimilarItemsAlertProps {
  similarItems: FuzzyMatchResult<MasterItem>[];
  onItemClick: (item: MasterItem) => void;
}

export function SimilarItemsAlert({
  similarItems,
  onItemClick,
}: SimilarItemsAlertProps) {
  if (similarItems.length === 0) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      icon={<WarningIcon />}
      sx={{
        mt: 1,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <Typography variant="body2" gutterBottom>
        Similar items found. Click to edit existing item instead:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {similarItems.map((result, index) => (
          <Chip
            key={`${result.item.id}-${index}`}
            label={result.item.name}
            variant="outlined"
            size="small"
            clickable
            onClick={() => onItemClick(result.item)}
            sx={{
              borderColor: 'warning.main',
              color: 'warning.dark',
              '&:hover': {
                backgroundColor: 'warning.light',
                borderColor: 'warning.dark',
              },
            }}
          />
        ))}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: 'block' }}
      >
        Similarity scores:{' '}
        {similarItems
          .map(r => `${r.item.name} (${Math.round(r.score * 100)}%)`)
          .join(', ')}
      </Typography>
    </Alert>
  );
}
