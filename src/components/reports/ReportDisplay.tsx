'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Skeleton,
} from '@mui/material';
import { ReportData } from '@/lib/types/inventory';
import { formatCurrency } from '@/lib/utils/currency';

interface ReportDisplayProps {
  data: ReportData[];
  loading: boolean;
  error: string | null;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export function ReportDisplay({
  data,
  loading,
  error,
  period,
}: ReportDisplayProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report Results
          </Typography>
          <Box sx={{ mt: 2 }}>
            {[...Array(5)].map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={40}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report Results
          </Typography>
          <Alert severity="info">
            No data found for the selected period and items. Try adjusting your
            filters.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatPeriod = (periodStr: string) => {
    switch (period) {
      case 'day':
        return new Date(periodStr).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      case 'week':
        const weekStart = new Date(periodStr);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      case 'month':
        const [year, month] = periodStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
          'en-IN',
          {
            month: 'long',
            year: 'numeric',
          }
        );
      case 'quarter':
        const [qYear, qPart] = periodStr.split('-');
        return `${qPart} ${qYear}`;
      case 'year':
        return periodStr;
      default:
        return periodStr;
    }
  };

  const totals = data.reduce(
    (acc, item) => ({
      incoming_value: acc.incoming_value + item.incoming_value,
      outgoing_value: acc.outgoing_value + item.outgoing_value,
      net_expense: acc.net_expense + item.net_expense,
    }),
    { incoming_value: 0, outgoing_value: 0, net_expense: 0 }
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Report Results
        </Typography>

        {/* Summary Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Typography variant="body2" color="text.secondary">
                Total Incoming
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(totals.incoming_value)}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Typography variant="body2" color="text.secondary">
                Total Outgoing
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(totals.outgoing_value)}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Typography variant="body2" color="text.secondary">
                Net Expense
              </Typography>
              <Typography
                variant="h6"
                color={totals.net_expense > 0 ? 'error.main' : 'success.main'}
              >
                {formatCurrency(totals.net_expense)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Detailed Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="right">Incoming</TableCell>
                <TableCell align="right">Outgoing</TableCell>
                <TableCell align="right">Net Expense</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.period}>
                  <TableCell component="th" scope="row">
                    {formatPeriod(row.period)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>
                    {formatCurrency(row.incoming_value)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    {formatCurrency(row.outgoing_value)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color:
                        row.net_expense > 0 ? 'error.main' : 'success.main',
                      fontWeight: 'medium',
                    }}
                  >
                    {formatCurrency(row.net_expense)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
