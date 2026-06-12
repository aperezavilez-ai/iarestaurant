-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 004: AUTH PRODUCCIÓN
-- Ejecutar después de 003. Vincula usuarios Auth → perfil public.users
-- ================================================================

-- Vincular manualmente un usuario de Supabase Auth al tenant demo:
-- 1. Crea el usuario en Authentication → Users
-- 2. Copia su UUID y ejecuta:

/*
INSERT INTO users (id, tenant_id, email, full_name, role, sucursal_id, is_active)
VALUES (
  'PEGAR-UUID-AUTH-AQUI',
  '00000000-0000-0000-0000-000000000001',
  'tu@email.com',
  'Tu Nombre',
  'admin_restaurant',
  '00000000-0000-0000-0000-000000000002',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  sucursal_id = EXCLUDED.sucursal_id;
*/

-- Trigger: auto-crear perfil al registrarse (tenant demo por defecto)
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, tenant_id, email, full_name, role, sucursal_id, is_active)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin_restaurant',
    '00000000-0000-0000-0000-000000000002',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Política: usuario puede leer su propio perfil
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid() OR tenant_id = get_tenant_id());
