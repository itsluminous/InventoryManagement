'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportDisplay } from '@/components/reports/ReportDisplay';
import { TrendChart } from '@/components/reports/TrendChart';
import { useReports } from '@/lib/hooks/useReports';
import { useMasterItems } from '@/lib/hooks/useMasterItems';
import { DateRange, ReportData, TrendData } from '@/lib/types/inventory';

export default function ReportsPage() {
  // Initialize date range to last 30 days - memoized to prevent recreation
  const initialDateRange = useMemo<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start, end };
  }, []);

  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [period, setPeriod] = useState<
    'day' | 'week' | 'month' | 'quarter' | 'year'
  >('week');
  const [trendPeriod, setTrendPeriod] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('week');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const { generateReport, generateTrendData, loading, error } = useReports();
  const { items: masterItems, loading: masterItemsLoading } = useMasterItems();

  // Memoize the data loading functions to prevent unnecessary re-renders
  const loadReportData = useCallback(async () => {
    if (!masterItemsLoading) {
      const data = await generateReport(dateRange, selectedItems, period);
      setReportData(data);
    }
  }, [dateRange, selectedItems, period, generateReport, masterItemsLoading]);

  const loadTrendData = useCallback(async () => {
    if (!masterItemsLoading) {
      const data = await generateTrendData(dateRange, selectedItems);
      setTrendData(data);
    }
  }, [dateRange, selectedItems, generateTrendData, masterItemsLoading]);

  // Generate reports when filters change
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  // Pre-select all items when master items are loaded
  useEffect(() => {
    if (
      !masterItemsLoading &&
      masterItems.length > 0 &&
      selectedItems.length === 0
    ) {
      setSelectedItems(masterItems.map(item => item.id));
    }
  }, [masterItems, masterItemsLoading, selectedItems.length]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed reports and analytics for your inventory expenses and
          trends
        </Typography>
      </Box>

      {/* Report Filters */}
      <ReportFilters
        dateRange={dateRange}
        selectedItems={selectedItems}
        masterItems={masterItems}
        period={period}
        onDateRangeChange={setDateRange}
        onItemsChange={setSelectedItems}
        onPeriodChange={setPeriod}
      />

      {/* Report Display */}
      <ReportDisplay
        data={reportData}
        loading={loading}
        error={error}
        period={period}
      />

      {/* Trend Chart */}
      <Box sx={{ mb: 3 }}>
        <TrendChart
          data={trendData}
          loading={loading}
          error={error}
          period={trendPeriod}
          onPeriodChange={setTrendPeriod}
        />
      </Box>
    </Container>
  );
}
