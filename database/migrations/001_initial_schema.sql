-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for inventory management system
-- Created: 2024-01-01
-- 
-- This migration creates the complete database schema including:
-- - Tables: profiles, master_items, inventory_transactions
-- - Indexes for performance optimization
-- - RLS policies for data security
-- - Helper functions for business logic
-- - Triggers for automatic profile creation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  business_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Master items table (item templates)
CREATE TABLE IF NOT EXISTS master_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure unique item names per user
  CONSTRAINT unique_user_item_name UNIQUE(user_id, name)
);

-- Inventory transactions table (FIFO tracking)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  master_item_id UUID REFERENCES master_items(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'remove')),
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  remaining_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_master_items_user_id ON master_items(user_id);
CREATE INDEX IF NOT EXISTS idx_master_items_name ON master_items(user_id, name);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_item ON inventory_transactions(user_id, master_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_fifo ON inventory_transactions(user_id, master_item_id, transaction_date ASC) 
WHERE transaction_type = 'add' AND remaining_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(user_id, transaction_type);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_master_items_updated_at ON master_items;
CREATE TRIGGER update_master_items_updated_at
    BEFORE UPDATE ON master_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can only see their own profiles" ON profiles;
CREATE POLICY "Users can only see their own profiles" ON profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can only see their own master items" ON master_items;
CREATE POLICY "Users can only see their own master items" ON master_items
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only see their own transactions" ON inventory_transactions;
CREATE POLICY "Users can only see their own transactions" ON inventory_transactions
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_inventory(p_user_id UUID)
RETURNS TABLE (
  master_item_id UUID,
  name TEXT,
  unit TEXT,
  current_quantity DECIMAL(10,3),
  total_value DECIMAL(12,2),
  last_transaction_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.id as master_item_id,
    mi.name,
    mi.unit,
    COALESCE(
      SUM(CASE WHEN it.transaction_type = 'add' THEN it.quantity ELSE -it.quantity END), 
      0
    )::DECIMAL(10,3) as current_quantity,
    COALESCE(
      SUM(CASE WHEN it.transaction_type = 'add' THEN it.remaining_quantity * it.unit_price ELSE 0 END), 
      0
    )::DECIMAL(12,2) as total_value,
    MAX(it.transaction_date) as last_transaction_date
  FROM master_items mi
  LEFT JOIN inventory_transactions it ON mi.id = it.master_item_id
  WHERE mi.user_id = p_user_id
  GROUP BY mi.id, mi.name, mi.unit
  ORDER BY mi.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_delete_master_item(p_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE id = p_item_id AND user_id = p_user_id) THEN
    RETURN FALSE;
  END IF;
  
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE master_item_id = p_item_id AND user_id = p_user_id;
  
  RETURN transaction_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTO PROFILE CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user_after()
RETURNS TRIGGER AS $$
BEGIN
  -- Add a small delay to ensure the user record is fully committed
  PERFORM pg_sleep(0.1);
  
  -- Insert the profile with null-safe handling
  INSERT INTO public.profiles (id, email, full_name, business_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't break user creation
    RAISE LOG 'Error in handle_new_user_after: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_after();