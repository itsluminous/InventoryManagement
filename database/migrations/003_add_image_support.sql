-- Add image support to master_items table
-- Migration: 003_add_image_support.sql

-- Add image_url column to master_items table
ALTER TABLE master_items 
ADD COLUMN image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN master_items.image_url IS 'URL to the item image stored in Supabase Storage';

-- Create storage bucket for item images (if not exists)
-- This needs to be run in Supabase dashboard or via SQL editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload item images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'item-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own images
CREATE POLICY "Users can view their own item images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'item-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own item images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'item-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view images (since bucket is public)
CREATE POLICY "Public can view item images" ON storage.objects
FOR SELECT USING (bucket_id = 'item-images');

-- Drop and recreate the get_current_inventory function to include image_url
DROP FUNCTION IF EXISTS get_current_inventory(UUID);

CREATE OR REPLACE FUNCTION get_current_inventory(p_user_id UUID)
RETURNS TABLE (
  master_item_id UUID,
  name TEXT,
  unit TEXT,
  image_url TEXT,
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
    mi.image_url,
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
  GROUP BY mi.id, mi.name, mi.unit, mi.image_url
  ORDER BY mi.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;