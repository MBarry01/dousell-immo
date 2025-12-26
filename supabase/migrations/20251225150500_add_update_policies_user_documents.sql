-- Migration: Add UPDATE policies for user_documents
-- Description: Allow admins to update documents for certification workflow
-- Created: 2025-12-25 15:05

-- ================================================
-- UPDATE POLICIES for user_documents
-- ================================================

-- Policy: Admins can update all documents (for certification)
CREATE POLICY "Admins can update all documents"
  ON user_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'moderateur')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'moderateur')
    )
  );

-- Policy: Users can update their own manual documents (not verified ones)
CREATE POLICY "Users can update own manual documents"
  ON user_documents
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND source = 'manual'
    AND (is_certified = false OR is_certified IS NULL)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND source = 'manual'
    AND (is_certified = false OR is_certified IS NULL)
  );

-- ================================================
-- ✅ UPDATE POLICIES CREATED SUCCESSFULLY
-- ================================================
