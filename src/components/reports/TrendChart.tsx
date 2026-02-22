'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendData } from '@/lib/types/inventory';
import { formatCurrency } from '@/lib/utils/currency';

interface TrendChartProps {
  data: TrendData[];
  loading: boolean;
  error: string | null;
  onPeriodChange?: (period: 'week' | 'month' | 'quarter' | 'year') => void;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export function TrendChart({
  data,
  loading,
  error,
  onPeriodChange,
  period = 'week',
}: TrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expense Trends
          </Typography>
          <Skeleton variant="rectangular" height={300} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expense Trends
          </Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expense Trends
          </Typography>
          <Alert severity="info">
            No trend data available for the selected period and items.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (period) {
      case 'week':
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });
      case 'month':
        return date.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        });
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear().toString().slice(-2)}`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return tickItem;
    }
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length && label) {
      const date = new Date(label);
      let formattedLabel = '';

      switch (period) {
        case 'week':
          const weekEnd = new Date(date);
          weekEnd.setDate(date.getDate() + 6);
          formattedLabel = `Week of ${date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`;
          break;
        case 'month':
          formattedLabel = date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          });
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          formattedLabel = `Q${quarter} ${date.getFullYear()}`;
          break;
        case 'year':
          formattedLabel = date.getFullYear().toString();
          break;
      }

      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            {formattedLabel}
          </Typography>
          {payload.map((entry, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Calculate week-on-week change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  const change = previousData
    ? calculateChange(latestData.expense, previousData.expense)
    : 0;

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Expense Trends</Typography>

          {onPeriodChange && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e: SelectChangeEvent) =>
                  onPeriodChange(
                    e.target.value as 'week' | 'month' | 'quarter' | 'year'
                  )
                }
              >
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="quarter">Quarterly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Latest Period
            </Typography>
            <Typography variant="h6">
              {formatCurrency(latestData.expense)}
            </Typography>
          </Box>

          {previousData && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Change from Previous
              </Typography>
              <Typography
                variant="h6"
                color={change > 0 ? 'error.main' : 'success.main'}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>

        {/* Chart */}
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickFormatter={formatXAxisLabel}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={value => `₹${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#f44336"
                strokeWidth={2}
                dot={{ fill: '#f44336', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Expense"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Item Breakdown for Latest Period */}
        {Object.keys(latestData.items).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Latest Period Breakdown:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(latestData.items)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5) // Show top 5 items
                .map(([itemName, expense]) => (
                  <Box
                    key={itemName}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1,
                      py: 0.5,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {itemName}:
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(expense)}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
