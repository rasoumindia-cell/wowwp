-- Add page-level permissions to profiles.
-- Three roles:
--   role = 'admin' → full access to all pages + can manage roles
--   role = 'user'  → full access to all pages (default, unrestricted)
--   role = 'staff' → only pages listed in page_permissions

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS page_permissions TEXT[] DEFAULT '{}';

-- RLS: admins can read/update any profile (needed for the Roles manager)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  USING (
    auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.role = 'admin')
  );
