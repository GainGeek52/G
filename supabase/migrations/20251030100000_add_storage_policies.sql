-- Migration: add RLS policies for storage
-- Purpose: allow authenticated users to upload product images and all users to view them

-- Safely drop policies if they already exist (allows re-running this migration)
DROP POLICY IF EXISTS "Allow authenticated uploads to product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product-images bucket" ON storage.objects;

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT into storage.objects (upload)
CREATE POLICY "Allow authenticated uploads to product-images bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow all users to SELECT from storage.objects (download/view)
CREATE POLICY "Allow public read access to product-images bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');
