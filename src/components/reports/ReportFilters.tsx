'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  TextField,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { MasterItem, DateRange } from '@/lib/types/inventory';

interface ReportFiltersProps {
  dateRange: DateRange;
  selectedItems: string[];
  masterItems: MasterItem[];
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  onDateRangeChange: (range: DateRange) => void;
  onItemsChange: (items: string[]) => void;
  onPeriodChange: (
    period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ) => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export function ReportFilters({
  dateRange,
  selectedItems,
  masterItems,
  period,
  onDateRangeChange,
  onItemsChange,
  onPeriodChange,
}: ReportFiltersProps) {
  const handleItemChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onItemsChange(typeof value === 'string' ? value.split(',') : value);
  };

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const date = new Date(event.target.value);
    if (!isNaN(date.getTime())) {
      onDateRangeChange({ ...dateRange, start: date });
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(event.target.value);
    if (!isNaN(date.getTime())) {
      onDateRangeChange({ ...dateRange, end: date });
    }
  };

  const getSelectedItemNames = () => {
    return selectedItems
      .map(id => masterItems.find(item => item.id === id)?.name)
      .filter(Boolean) as string[];
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Report Filters
        </Typography>

        <Grid container spacing={3}>
          {/* Date Range */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={handleStartDateChange}
              fullWidth
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={handleEndDateChange}
              fullWidth
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          {/* Period Selection */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={e =>
                  onPeriodChange(
                    e.target.value as
                      | 'day'
                      | 'week'
                      | 'month'
                      | 'quarter'
                      | 'year'
                  )
                }
              >
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="quarter">Quarterly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Item Selection */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Items</InputLabel>
              <Select
                multiple
                value={selectedItems}
                onChange={handleItemChange}
                input={<OutlinedInput label="Items" />}
                renderValue={() => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {getSelectedItemNames().map(name => (
                      <Chip key={name} label={name} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {masterItems
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, {
                      sensitivity: 'base',
                    })
                  )
                  .map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {selectedItems.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No items selected - showing data for all items
          </Typography>
        )}

        {selectedItems.length > 0 &&
          selectedItems.length === masterItems.length && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              All items selected ({selectedItems.length} items)
            </Typography>
          )}

        {selectedItems.length > 0 &&
          selectedItems.length < masterItems.length && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {selectedItems.length} of {masterItems.length} items selected
            </Typography>
          )}
      </CardContent>
    </Card>
  );
}
