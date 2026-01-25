# Migration Guide: Dynamic Bagel Types

This guide will help you add the dynamic bagel types feature to your database.

## What's New

- **Bagel Types Management**: Admin can now add, edit, and remove bagel types (Plain, Everything, Sesame, Poppy Seed, etc.)
- **Flexible Orders**: Customers can order any available bagel types
- **Admin Interface**: New "Bagel Types" page in the admin panel

## Migration Steps

### 1. Run the Migration SQL

1. **Open Supabase Dashboard** in your browser
2. Go to **SQL Editor** (in the left sidebar)
3. **Copy the contents** of `database/migration-dynamic-bagels.sql`
4. **Paste** into the SQL Editor
5. Click **Run**

You should see success messages for:
- Created `bagel_types` table
- Created `order_items` table
- Inserted default bagel types (Plain, Everything, Sesame)

### 2. Verify the Migration

1. In Supabase, go to **Table Editor**
2. You should now see three tables:
   - `time_slots`
   - `orders`
   - `bagel_types` (new!)
   - `order_items` (new!)

3. Click on `bagel_types` table
4. You should see 3 rows: Plain, Everything, Sesame

### 3. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 4. Test the New Features

**In the Admin Panel:**

1. Go to `http://localhost:3000/admin`
2. You should now see a **"Bagel Types"** link in the navigation
3. Click it to manage bagel types
4. Try adding a new type (e.g., "Poppy Seed" or "Cinnamon Raisin")

**On the Customer Order Form:**

1. Go to `http://localhost:3000`
2. The bagel selector should now show all active bagel types
3. If you added "Poppy Seed", it should appear in the list

## How It Works

### Before (Hardcoded)
- Only 3 bagel types: Plain, Everything, Sesame
- Hardcoded in the components
- Can't add new types without code changes

### After (Dynamic)
- Unlimited bagel types
- Managed through admin panel
- New types automatically appear on order form
- Can activate/deactivate types without deleting them

## Backward Compatibility

The migration is backward compatible:
- Old order records are preserved
- Old columns (`plain_count`, `everything_count`, `sesame_count`) still exist
- New orders use the `order_items` table
- Admin order display works with both old and new orders

## Troubleshooting

**Problem: Migration fails with "table already exists"**
- The migration has already been run
- Check if `bagel_types` table exists in Table Editor

**Problem: Bagel types don't show on order form**
- Check that bagel types are marked as "active" in the database
- Check browser console for API errors

**Problem: Old orders don't show bagel types**
- Old orders used the hardcoded columns, which still work
- They'll display as Plain/Everything/Sesame

## Next Steps

You can now:
1. Add more bagel types (Poppy Seed, Onion, Garlic, etc.)
2. Deactivate types seasonally
3. Reorder types using the `display_order` field
