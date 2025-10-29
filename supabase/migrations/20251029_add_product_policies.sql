-- Add policies to allow authenticated users to insert and update products

CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Optionally, allow delete if needed:
-- CREATE POLICY "Authenticated users can delete products"
--   ON products
--   FOR DELETE
--   USING (auth.role() = 'authenticated');
