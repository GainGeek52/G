-- Migration: add RLS policies for products
-- Purpose: allow authenticated users to INSERT/UPDATE/DELETE products
-- NOTE: This file uses PostgreSQL / Supabase RLS syntax. Apply it in your Supabase project.

-- Safely drop policies if they already exist (allows re-running this migration)
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT into products
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to UPDATE products
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to DELETE products
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- IMPORTANT: In production, restrict product management to admin users only.
-- Example (commented): check an admins table or a profiles table with is_admin flag
-- CREATE POLICY "Admins can manage products"
--   ON products
--   FOR ALL
--   USING (
--     exists (
--       select 1 from profiles p where p.id = auth.uid() and p.is_admin
--     )
--   )
