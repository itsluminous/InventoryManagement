-- Migration: 002_enhanced_rls_policies.sql
-- Description: Enhanced Row Level Security policies for comprehensive data isolation
-- Created: 2024-01-01
-- 
-- This migration enhances the RLS policies to ensure complete data isolation

-- =====================================================
-- ENHANCED RLS POLICIES
-- =====================================================

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Users can only see their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can only see their own master items" ON master_items;
DROP POLICY IF EXISTS "Users can only see their own transactions" ON inventory_transactions;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Policy for SELECT operations on profiles
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for INSERT operations on profiles (only allow creating own profile)
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for UPDATE operations on profiles (only allow updating own profile)
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policy for DELETE operations on profiles (only allow deleting own profile)
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- MASTER_ITEMS TABLE POLICIES
-- =====================================================

-- Policy for SELECT operations on master_items
CREATE POLICY "master_items_select_policy" ON master_items
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT operations on master_items (auto-associate with authenticated user)
CREATE POLICY "master_items_insert_policy" ON master_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE operations on master_items (only allow updating own items)
CREATE POLICY "master_items_update_policy" ON master_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE operations on master_items (only allow deleting own items)
CREATE POLICY "master_items_delete_policy" ON master_items
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- INVENTORY_TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Policy for SELECT operations on inventory_transactions
CREATE POLICY "inventory_transactions_select_policy" ON inventory_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT operations on inventory_transactions (auto-associate with authenticated user)
CREATE POLICY "inventory_transactions_insert_policy" ON inventory_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE operations on inventory_transactions (only allow updating own transactions)
CREATE POLICY "inventory_transactions_update_policy" ON inventory_transactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE operations on inventory_transactions (only allow deleting own transactions)
CREATE POLICY "inventory_transactions_delete_policy" ON inventory_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to ensure user can only access their own master items
CREATE OR REPLACE FUNCTION user_owns_master_item(item_id UUID, requesting_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM master_items 
    WHERE id = item_id AND user_id = requesting_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure user can only access their own transactions
CREATE OR REPLACE FUNCTION user_owns_transaction(transaction_id UUID, requesting_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM inventory_transactions 
    WHERE id = transaction_id AND user_id = requesting_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate that a master item belongs to the authenticated user
-- This is used in application logic to double-check ownership before operations
CREATE OR REPLACE FUNCTION validate_master_item_ownership(item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM master_items 
    WHERE id = item_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENHANCED HELPER FUNCTIONS WITH RLS AWARENESS
-- =====================================================

-- Enhanced function to get current inventory with explicit user validation
CREATE OR REPLACE FUNCTION get_user_current_inventory()
RETURNS TABLE (
  master_item_id UUID,
  name TEXT,
  unit TEXT,
  current_quantity DECIMAL(10,3),
  total_value DECIMAL(12,2),
  last_transaction_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Return empty result if no authenticated user
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
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
  WHERE mi.user_id = current_user_id
  GROUP BY mi.id, mi.name, mi.unit
  ORDER BY mi.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to check master item deletion with explicit user validation
CREATE OR REPLACE FUNCTION can_user_delete_master_item(p_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_count INTEGER;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Return false if no authenticated user
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the item belongs to the current user
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE id = p_item_id AND user_id = current_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there are any transactions for this item
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE master_item_id = p_item_id AND user_id = current_user_id;
  
  RETURN transaction_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURITY VALIDATION TRIGGERS
-- =====================================================

-- Trigger function to ensure user_id is always set to authenticated user on INSERT
CREATE OR REPLACE FUNCTION ensure_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- For master_items and inventory_transactions, ensure user_id matches auth.uid()
  IF TG_TABLE_NAME IN ('master_items', 'inventory_transactions') THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- For profiles, ensure id matches auth.uid()
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to master_items table
DROP TRIGGER IF EXISTS ensure_user_id_master_items ON master_items;
CREATE TRIGGER ensure_user_id_master_items
  BEFORE INSERT ON master_items
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_id_on_insert();

-- Apply the trigger to inventory_transactions table
DROP TRIGGER IF EXISTS ensure_user_id_inventory_transactions ON inventory_transactions;
CREATE TRIGGER ensure_user_id_inventory_transactions
  BEFORE INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_id_on_insert();

-- Apply the trigger to profiles table
DROP TRIGGER IF EXISTS ensure_user_id_profiles ON profiles;
CREATE TRIGGER ensure_user_id_profiles
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_id_on_insert();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 'Users can only SELECT their own profile';
COMMENT ON POLICY "profiles_insert_policy" ON profiles IS 'Users can only INSERT their own profile';
COMMENT ON POLICY "profiles_update_policy" ON profiles IS 'Users can only UPDATE their own profile';
COMMENT ON POLICY "profiles_delete_policy" ON profiles IS 'Users can only DELETE their own profile';

COMMENT ON POLICY "master_items_select_policy" ON master_items IS 'Users can only SELECT their own master items';
COMMENT ON POLICY "master_items_insert_policy" ON master_items IS 'Users can only INSERT master items for themselves';
COMMENT ON POLICY "master_items_update_policy" ON master_items IS 'Users can only UPDATE their own master items';
COMMENT ON POLICY "master_items_delete_policy" ON master_items IS 'Users can only DELETE their own master items';

COMMENT ON POLICY "inventory_transactions_select_policy" ON inventory_transactions IS 'Users can only SELECT their own transactions';
COMMENT ON POLICY "inventory_transactions_insert_policy" ON inventory_transactions IS 'Users can only INSERT transactions for themselves';
COMMENT ON POLICY "inventory_transactions_update_policy" ON inventory_transactions IS 'Users can only UPDATE their own transactions';
COMMENT ON POLICY "inventory_transactions_delete_policy" ON inventory_transactions IS 'Users can only DELETE their own transactions';

COMMENT ON FUNCTION user_owns_master_item(UUID, UUID) IS 'Validates that a user owns a specific master item';
COMMENT ON FUNCTION user_owns_transaction(UUID, UUID) IS 'Validates that a user owns a specific transaction';
COMMENT ON FUNCTION validate_master_item_ownership(UUID) IS 'Validates master item ownership for authenticated user';
COMMENT ON FUNCTION get_user_current_inventory() IS 'Returns current inventory for authenticated user only';
COMMENT ON FUNCTION can_user_delete_master_item(UUID) IS 'Checks if authenticated user can delete a master item';
COMMENT ON FUNCTION ensure_user_id_on_insert() IS 'Automatically sets user_id to authenticated user on INSERT operations';