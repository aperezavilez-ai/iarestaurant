-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 010: Gestión de personal (admin)
-- ================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT '{}';

CREATE OR REPLACE FUNCTION is_restaurant_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('admin_restaurant', 'admin_saas', 'gerente')
      AND is_active = true
  );
$$;

DROP POLICY IF EXISTS "users_admin_update" ON users;
CREATE POLICY "users_admin_update" ON users
  FOR UPDATE USING (tenant_id = get_tenant_id() AND is_restaurant_admin());

DROP POLICY IF EXISTS "users_admin_delete" ON users;
CREATE POLICY "users_admin_delete" ON users
  FOR DELETE USING (
    tenant_id = get_tenant_id()
    AND is_restaurant_admin()
    AND id <> auth.uid()
  );

-- Trigger: incluir módulos permitidos desde metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mods TEXT[];
BEGIN
  SELECT COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'allowed_modules')),
    '{}'::TEXT[]
  ) INTO mods;

  INSERT INTO public.users (id, tenant_id, email, full_name, role, sucursal_id, is_active, allowed_modules)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cajero'),
    COALESCE(
      (NEW.raw_user_meta_data->>'sucursal_id')::UUID,
      '00000000-0000-0000-0000-000000000002'::UUID
    ),
    true,
    mods
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    allowed_modules = EXCLUDED.allowed_modules;
  RETURN NEW;
END;
$$;
