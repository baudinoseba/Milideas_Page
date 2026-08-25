-- Migration: Fix comprobantes bucket - remove anonymous read access
-- SECURITY: Comprobantes (payment receipts) contain sensitive banking data.
-- Anonymous users should NOT be able to read any comprobante files.
-- Only admin users should have access.

-- Drop the anonymous read policy
DROP POLICY IF EXISTS "comprobantes_storage_select_anon" ON storage.objects;

-- Drop and recreate the insert policy to require a valid session for uploads
-- (Still allows anonymous orders to upload but uses supabase.auth instead of anon role)
DROP POLICY IF EXISTS "comprobantes_storage_insert" ON storage.objects;

CREATE POLICY "comprobantes_storage_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'comprobantes');

-- Only admins can read comprobantes
DROP POLICY IF EXISTS "comprobantes_storage_select" ON storage.objects;

CREATE POLICY "comprobantes_storage_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprobantes' AND public.is_admin());
