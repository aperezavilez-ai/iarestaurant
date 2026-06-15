-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 016: Clientes CRM
-- ================================================================

CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id   UUID REFERENCES sucursales(id),
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  visits        INT NOT NULL DEFAULT 0,
  points        INT NOT NULL DEFAULT 0,
  total_spent   NUMERIC(12,2) NOT NULL DEFAULT 0,
  segment       TEXT NOT NULL DEFAULT 'nuevo' CHECK (segment IN ('nuevo', 'frecuente', 'vip')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_tenant_idx ON customers (tenant_id);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (tenant_id, name);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON customers
  USING (tenant_id = get_tenant_id());

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id());

CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (tenant_id = get_tenant_id());

-- Datos demo para tenant de prueba
INSERT INTO customers (id, tenant_id, sucursal_id, name, email, phone, visits, points, total_spent, segment, created_at) VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'María González', 'maria@email.com', '55 9876 5432', 24, 480, 12400, 'vip', '2025-11-01'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Carlos Ruiz', 'carlos@email.com', '55 8765 4321', 8, 128, 3200, 'frecuente', '2026-01-15'),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Laura Méndez', NULL, '55 7654 3210', 1, 20, 485, 'nuevo', '2026-06-10'),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Jorge Herrera', 'jorge@email.com', '55 6543 2109', 15, 310, 7800, 'frecuente', '2025-08-20')
ON CONFLICT (id) DO NOTHING;
