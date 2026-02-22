import { Database } from '@/lib/supabase/types';

// Database types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MasterItem = Database['public']['Tables']['master_items']['Row'];
export type InventoryTransaction =
  Database['public']['Tables']['inventory_transactions']['Row'];

// Computed types for UI
export interface InventoryItem {
  master_item_id: string;
  name: string;
  unit: string;
  current_quantity: number;
  total_value: number;
  last_transaction_date: string | null;
}

export interface InventorySummary {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  recent_transactions: number;
}

// Form data types
export interface AddInventoryData {
  master_item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface RemoveInventoryData {
  master_item_id: string;
  quantity: number;
  notes?: string;
}

export interface MasterItemData {
  name: string;
  unit: string;
}

// Extended transaction type with master item details
export interface InventoryTransactionWithItem extends InventoryTransaction {
  master_item?: MasterItem;
}

// FIFO-related types
export interface InventoryBatch {
  id: string;
  quantity: number;
  unit_price: number;
  remaining_quantity: number;
  transaction_date: string;
}

export interface FIFORemovalResult {
  success: boolean;
  totalCost: number;
  error?: string;
  weightedAveragePrice?: number;
  batchesAffected?: number;
}

// Reporting types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface ReportData {
  period: string;
  incoming_quantity: number;
  incoming_value: number;
  outgoing_quantity: number;
  outgoing_value: number;
  net_expense: number;
}

export interface TrendData {
  week: string;
  expense: number;
  items: { [itemName: string]: number };
}

export interface ReportFilters {
  dateRange: DateRange;
  selectedItems: string[];
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}
