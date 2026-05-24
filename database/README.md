# Database Migrations

This directory contains SQL migration files for the inventory management system.

## Migration Files

### 001_initial_schema.sql

- Creates the initial database schema
- Sets up tables: profiles, master_items, inventory_transactions
- Configures RLS policies and helper functions
- Creates indexes for performance

### 002_enhanced_rls_policies.sql

- Enhanced Row Level Security policies
- Additional security improvements

### 003_add_image_support.sql

- Adds image_url column to master_items table
- Creates Supabase Storage bucket for item images
- Sets up RLS policies for image storage
- Updates get_current_inventory function to include image_url

## Running Migrations

### Option 1: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration content
4. Execute the SQL

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset
# or apply specific migration
supabase db push
```

### Option 3: Manual SQL Execution

Connect to your PostgreSQL database and execute the migration files in order.

## Storage Setup

After running migration 003, you need to ensure the storage bucket is properly configured:

1. **Bucket Creation**: The migration creates an `item-images` bucket
2. **RLS Policies**: Policies are set up for authenticated users to upload/view/delete their own images
3. **File Limits**: 10MB file size limit with JPEG, PNG, WebP support
4. **Public Access**: Images are publicly viewable once uploaded

## Image Upload Features

The image upload system includes:

- **Client-side compression**: Images are resized to 320px max dimension
- **WebP conversion**: Automatic conversion to WebP format for better compression
- **File validation**: Type and size validation before upload
- **Unique naming**: Files are stored with user ID prefix and timestamp
- **Cleanup**: Old images are automatically deleted when replaced

## Troubleshooting

### Storage Bucket Issues

If you encounter storage issues:

1. Check if the bucket exists in Supabase Storage
2. Verify RLS policies are applied
3. Ensure your Supabase project has storage enabled

### Permission Issues

If users can't upload images:

1. Verify the user is authenticated
2. Check RLS policies on storage.objects
3. Ensure the bucket is public for read access

### Migration Errors

If migrations fail:

1. Check if previous migrations were applied
2. Verify database permissions
3. Look for conflicting table/function names
