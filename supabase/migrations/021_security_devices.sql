-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 021: Seguridad — dispositivos y auditoría
-- ================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_devices INT;

UPDATE tenants SET max_devices = CASE plan
  WHEN 'basico' THEN 3
  WHEN 'profesional' THEN 8
  WHEN 'enterprise' THEN 25
  ELSE 3
END WHERE max_devices IS NULL;

ALTER TABLE tenants ALTER COLUMN max_devices SET DEFAULT 3;

-- Nota: un solo admin_restaurant por tenant se valida en alta de personal (API staff).
-- No índice único aquí: puede haber datos legacy duplicados en tenants existentes.

CREATE TABLE IF NOT EXISTS tenant_devices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id      UUID REFERENCES sucursales(id),
  user_id          UUID REFERENCES users(id),
  fingerprint_hash TEXT NOT NULL,
  device_label     TEXT NOT NULL DEFAULT 'Dispositivo',
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('approved', 'pending', 'revoked')),
  ip_address       TEXT,
  user_agent       TEXT,
  last_seen_at     TIMESTAMPTZ DEFAULT NOW(),
  approved_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_devices_fingerprint_active
  ON tenant_devices (tenant_id, fingerprint_hash)
  WHERE status != 'revoked';

CREATE INDEX IF NOT EXISTS tenant_devices_tenant_status
  ON tenant_devices (tenant_id, status);

CREATE TABLE IF NOT EXISTS login_audit (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  device_id   UUID REFERENCES tenant_devices(id) ON DELETE SET NULL,
  email       TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  success     BOOLEAN NOT NULL DEFAULT true,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_audit_tenant_created
  ON login_audit (tenant_id, created_at DESC);

-- Helpers RLS
CREATE OR REPLACE FUNCTION is_saas_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin_saas' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_restaurant_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('admin_restaurant', 'gerente', 'admin_saas')
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- SaaS admin lee todos los tenants
CREATE POLICY tenants_saas_read ON tenants
  FOR SELECT USING (is_saas_admin());

CREATE POLICY tenants_saas_update ON tenants
  FOR UPDATE USING (is_saas_admin());

ALTER TABLE tenant_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_devices_select ON tenant_devices
  FOR SELECT USING (tenant_id = get_tenant_id() OR is_saas_admin());

CREATE POLICY tenant_devices_insert ON tenant_devices
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id());

CREATE POLICY tenant_devices_update ON tenant_devices
  FOR UPDATE USING (
    (tenant_id = get_tenant_id() AND is_restaurant_admin())
    OR is_saas_admin()
  );

CREATE POLICY login_audit_select ON login_audit
  FOR SELECT USING (tenant_id = get_tenant_id() OR is_saas_admin());

CREATE POLICY login_audit_insert ON login_audit
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id() OR is_saas_admin());
