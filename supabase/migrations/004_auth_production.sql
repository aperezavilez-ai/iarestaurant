-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 004: AUTH EN PRODUCCIÓN
-- Ejecutar después de 003_qr_flow_realtime.sql
-- Crea perfil en public.users al registrar usuario en Auth
-- ================================================================

-- Trigger: auth.users → public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, tenant_id, email, full_name, role, sucursal_id, is_active)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin_restaurant'),
    '00000000-0000-0000-0000-000000000002',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: el usuario puede leer su propio perfil (necesario en primer login)
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid());

-- Si creaste el usuario en Auth antes de esta migración, vincula manualmente:
-- INSERT INTO users (id, tenant_id, email, full_name, role, sucursal_id, is_active)
-- VALUES (
--   'UUID-DEL-USUARIO-AUTH',
--   '00000000-0000-0000-0000-000000000001',
--   'tu@email.com',
--   'Tu Nombre',
--   'admin_restaurant',
--   '00000000-0000-0000-0000-000000000002',
--   true
-- ) ON CONFLICT (id) DO NOTHING;
