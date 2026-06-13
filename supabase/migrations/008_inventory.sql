-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 008: Inventario en Supabase
-- ================================================================

CREATE TABLE IF NOT EXISTS ingredients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id   UUID REFERENCES sucursales(id),
  name          TEXT NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'pza',
  stock         NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_stock     NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost          NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier_id   UUID,
  is_active     BOOLEAN DEFAULT true,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  delta         NUMERIC(12,2) NOT NULL,
  reason        TEXT,
  reference     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_tenant ON ingredients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ingredients_tenant" ON ingredients
  FOR SELECT USING (tenant_id = get_tenant_id());
CREATE POLICY "ingredients_insert" ON ingredients
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id());
CREATE POLICY "ingredients_update" ON ingredients
  FOR UPDATE USING (tenant_id = get_tenant_id());

CREATE POLICY "stock_movements_tenant" ON stock_movements
  FOR SELECT USING (tenant_id = get_tenant_id());
CREATE POLICY "stock_movements_insert" ON stock_movements
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id());

-- Ingredientes demo (UUIDs fijos)
INSERT INTO ingredients (id, tenant_id, sucursal_id, name, unit, stock, min_stock, cost) VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Tortilla de maíz', 'pza', 450, 100, 0.80),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Carne al pastor', 'kg', 12, 5, 180.00),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Aguacate', 'kg', 8, 3, 95.00),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Tequila reposado', 'L', 4, 2, 320.00),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Cerveza corona', 'pza', 48, 24, 18.00),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Limón', 'kg', 2, 5, 25.00),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Queso Oaxaca', 'kg', 6, 2, 140.00),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Arroz', 'kg', 15, 5, 28.00),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Cilantro', 'kg', 3, 2, 35.00),
  ('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Crema', 'L', 5, 2, 42.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_movements (id, tenant_id, ingredient_id, delta, reason, reference, created_at) VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000506', -3, 'Venta ORD-demo', 'seed', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000501', -24, 'Venta ORD-demo', 'seed', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000505', 48, 'Compra inicial', 'PO-seed', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;
