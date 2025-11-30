-- CERT Dashboard: Fix User Records
-- Run this in Supabase SQL Editor if users can't authenticate with API keys
-- This script:
-- 1. Creates missing user records in public.users for existing auth.users
-- 2. Generates API keys for users who don't have one
-- 3. Ensures the trigger exists for new signups

-- Step 1: Ensure the handle_new_user function exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile with auto-generated API key
  INSERT INTO public.users (id, email, name, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'company'
  )
  ON CONFLICT (id) DO NOTHING;  -- Don't fail if user already exists

  -- Create default project for the new user (only if not exists)
  INSERT INTO public.projects (user_id, name, description)
  SELECT NEW.id, 'Default Project', 'Default project for trace collection'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects WHERE user_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Step 2: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create missing user records for existing auth.users
-- This handles users who signed up before the trigger was created
INSERT INTO public.users (id, email, name)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User')
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Step 4: Generate API keys for users who don't have one
UPDATE public.users
SET api_key = 'cert_' || replace(gen_random_uuid()::text, '-', '')
WHERE api_key IS NULL;

-- Step 5: Create default projects for users who don't have any
INSERT INTO public.projects (user_id, name, description)
SELECT
  u.id,
  'Default Project',
  'Default project for trace collection'
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.user_id
WHERE p.id IS NULL;

-- Verify the fix - show all users and their API keys
SELECT
  u.id,
  u.email,
  u.name,
  LEFT(u.api_key, 20) || '...' as api_key_prefix,
  u.is_active,
  (SELECT COUNT(*) FROM public.projects WHERE user_id = u.id) as project_count
FROM public.users u
ORDER BY u.created_at DESC;
