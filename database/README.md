# Database Setup

This directory contains the database schema and migration files for the Inventory Management System.

## Database Schema Overview

The database consists of three main tables:

### 1. `profiles`

- Stores user account information
- Linked to Supabase `auth.users` table
- Contains email, full name, and business name

### 2. `master_items`

- Master list of inventory items
- Each item has a name and unit (e.g., "Rice" - "kg")
- Unique constraint on (user_id, name) to prevent duplicates

### 3. `inventory_transactions`

- Records all inventory movements (add/remove)
- Implements FIFO cost tracking with `remaining_quantity`
- Contains quantity, unit price, and calculated total price

## Key Features

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only access their own data
- Policies enforce data isolation at the database level

### Performance Indexes

- Optimized indexes for common query patterns
- Special FIFO index for efficient cost calculations
- User-based and date-based indexes for fast filtering

### Business Logic Functions

- `get_current_inventory(user_id)` - Returns current inventory summary
- `can_delete_master_item(item_id, user_id)` - Checks deletion safety
- `handle_new_user()` - Auto-creates profile on signup

### Automatic Features

- Auto-updating timestamps on profile and master item changes
- Automatic profile creation when users sign up
- Computed `total_price` column (quantity × unit_price)

## Setup Instructions

1. **Open Supabase Dashboard**
   - Go to your project dashboard at [supabase.com](https://supabase.com)
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `migrations/001_initial_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify Setup**
   - Check the "Table Editor" to see the created tables
   - Verify RLS is enabled on all tables
   - Test the helper functions in the SQL Editor

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Data Model Relationships

```
auth.users (Supabase)
    ↓ (1:1)
profiles
    ↓ (1:many)
master_items
    ↓ (1:many)
inventory_transactions
```

## FIFO Implementation

The FIFO (First In, First Out) inventory costing is implemented using:

- `remaining_quantity` field tracks unused inventory from each "add" transaction
- Specialized index `idx_inventory_transactions_fifo` for efficient FIFO queries
- Business logic in the application layer processes FIFO removals

## Security Considerations

- All tables use Row Level Security (RLS)
- Foreign key constraints ensure data integrity
- Check constraints validate business rules (positive quantities, valid transaction types)
- Functions use `SECURITY DEFINER` for controlled access
