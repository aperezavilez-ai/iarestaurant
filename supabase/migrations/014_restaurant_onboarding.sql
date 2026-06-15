-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 014: Onboarding restaurante al registrarse
-- Crea tenant + organization + sucursal cuando viene restaurant_name
-- ================================================================

CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE USING (id = get_tenant_id());

CREATE POLICY "organizations_update_own" ON organizations
  FOR UPDATE USING (tenant_id = get_tenant_id());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_org_id UUID;
  v_sucursal_id UUID;
  v_restaurant_name TEXT;
  v_slug TEXT;
  v_demo_tenant UUID := '00000000-0000-0000-0000-000000000001';
  v_demo_sucursal UUID := '00000000-0000-0000-0000-000000000002';
BEGIN
  v_restaurant_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'restaurant_name', ''));

  IF v_restaurant_name <> '' THEN
    v_slug := lower(regexp_replace(v_restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    IF v_slug = '' THEN
      v_slug := 'restaurante';
    END IF;
    v_slug := v_slug || '-' || substr(replace(NEW.id::text, '-', ''), 1, 8);

    INSERT INTO tenants (name, slug, plan, max_sucursales, max_usuarios, max_mesas, max_productos)
    VALUES (v_restaurant_name, v_slug, 'profesional', 3, 15, 30, 150)
    RETURNING id INTO v_tenant_id;

    INSERT INTO organizations (tenant_id, name, email)
    VALUES (v_tenant_id, v_restaurant_name, NEW.email)
    RETURNING id INTO v_org_id;

    INSERT INTO sucursales (tenant_id, organization_id, name, address, timezone, currency, tax_rate)
    VALUES (v_tenant_id, v_org_id, 'Sucursal Principal', '', 'America/Mexico_City', 'MXN', 16)
    RETURNING id INTO v_sucursal_id;

    INSERT INTO public.users (id, tenant_id, email, full_name, role, sucursal_id, is_active)
    VALUES (
      NEW.id,
      v_tenant_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'admin_restaurant',
      v_sucursal_id,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      sucursal_id = EXCLUDED.sucursal_id,
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  ELSE
    INSERT INTO public.users (id, tenant_id, email, full_name, role, sucursal_id, is_active)
    VALUES (
      NEW.id,
      v_demo_tenant,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'admin_restaurant'),
      v_demo_sucursal,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  END IF;

  RETURN NEW;
END;
$$;
