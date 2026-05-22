-- Add page-level permissions to profiles.
-- Usage:
--   role = 'admin' → full access to all pages
--   role = 'user'  → only pages listed in page_permissions
--
-- After applying this migration, run:
--   UPDATE profiles SET page_permissions = ARRAY['dashboard','inbox','contacts','pipelines','broadcasts','automations','settings'] WHERE role = 'admin';
--   (page_permissions is ignored for admins at the app level, but it's clean to fill it)

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
