-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 001: ESQUEMA INICIAL MULTI-TENANT
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TABLA: tenants (Restaurantes / Clientes SaaS)
-- ================================================================
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#f59000',
  plan          TEXT DEFAULT 'basico' CHECK (plan IN ('basico','profesional','enterprise')),
  max_sucursales INT DEFAULT 1,
  max_usuarios   INT DEFAULT 5,
  max_mesas      INT DEFAULT 20,
  max_productos  INT DEFAULT 50,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: organizations (Grupo empresarial / Marca)
-- ================================================================
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  rfc           TEXT,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: sucursales
-- ================================================================
CREATE TABLE sucursales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  phone           TEXT,
  timezone        TEXT DEFAULT 'America/Mexico_City',
  currency        TEXT DEFAULT 'MXN',
  tax_rate        NUMERIC(5,2) DEFAULT 16.00,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: users (Perfil extendido — vinculado a auth.users)
-- ================================================================
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin_saas','admin_restaurant','gerente','supervisor','capitan','mesero','cajero','cocina','cliente')),
  sucursal_id  UUID REFERENCES sucursales(id),
  avatar_url   TEXT,
  is_active    BOOLEAN DEFAULT true,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: table_areas (Áreas del restaurante)
-- ================================================================
CREATE TABLE table_areas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#f59000',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true
);

-- ================================================================
-- TABLA: tables (Mesas)
-- ================================================================
CREATE TABLE tables (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id      UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  area_id          UUID NOT NULL REFERENCES table_areas(id),
  number           INT NOT NULL,
  capacity         INT DEFAULT 4,
  status           TEXT DEFAULT 'libre' CHECK (status IN ('libre','ocupada','reservada','cobro_pendiente')),
  current_order_id UUID,
  assigned_waiter_id UUID REFERENCES users(id),
  opened_at        TIMESTAMPTZ,
  UNIQUE(sucursal_id, number)
);

-- ================================================================
-- TABLA: categories (Categorías del catálogo)
-- ================================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id UUID REFERENCES sucursales(id),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#f59000',
  icon        TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true
);

-- ================================================================
-- TABLA: products (Productos del catálogo)
-- ================================================================
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id       UUID REFERENCES sucursales(id),
  category_id       UUID NOT NULL REFERENCES categories(id),
  name              TEXT NOT NULL,
  description       TEXT,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost              NUMERIC(10,2) DEFAULT 0,
  image_url         TEXT,
  sku               TEXT,
  is_active         BOOLEAN DEFAULT true,
  has_variants      BOOLEAN DEFAULT false,
  allergens         TEXT[],
  preparation_time  INT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: orders (Órdenes / Cuentas)
-- ================================================================
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id  UUID NOT NULL REFERENCES sucursales(id),
  table_id     UUID REFERENCES tables(id),
  folio        TEXT UNIQUE NOT NULL,
  status       TEXT DEFAULT 'abierta' CHECK (status IN ('abierta','en_preparacion','lista','entregada','cobrada','cancelada')),
  waiter_id    UUID REFERENCES users(id),
  cashier_id   UUID REFERENCES users(id),
  subtotal     NUMERIC(10,2) DEFAULT 0,
  tax          NUMERIC(10,2) DEFAULT 0,
  discount     NUMERIC(10,2) DEFAULT 0,
  total        NUMERIC(10,2) DEFAULT 0,
  guests       INT DEFAULT 1,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: order_items (Ítems de órdenes)
-- ================================================================
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity     INT NOT NULL DEFAULT 1,
  unit_price   NUMERIC(10,2) NOT NULL,
  subtotal     NUMERIC(10,2) NOT NULL,
  notes        TEXT,
  status       TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','preparando','listo','entregado','cancelado')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: payments (Pagos)
-- ================================================================
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  method        TEXT NOT NULL CHECK (method IN ('efectivo','tarjeta','transferencia','mixto')),
  amount        NUMERIC(10,2) NOT NULL,
  change_amount NUMERIC(10,2) DEFAULT 0,
  reference     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: cash_registers (Cortes de caja)
-- ================================================================
CREATE TABLE cash_registers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  sucursal_id      UUID NOT NULL REFERENCES sucursales(id),
  cashier_id       UUID NOT NULL REFERENCES users(id),
  opening_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_amount   NUMERIC(10,2),
  expected_amount  NUMERIC(10,2),
  difference       NUMERIC(10,2),
  status           TEXT DEFAULT 'abierta' CHECK (status IN ('abierta','cerrada')),
  opened_at        TIMESTAMPTZ DEFAULT NOW(),
  closed_at        TIMESTAMPTZ
);

-- ================================================================
-- TABLA: audit_logs (Auditoría inmutable)
-- ================================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL,
  user_id     UUID,
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ÍNDICES DE RENDIMIENTO
-- ================================================================
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_sucursales_tenant ON sucursales(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_sucursal ON orders(sucursal_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_tables_sucursal ON tables(sucursal_id);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) — AISLAMIENTO MULTI-TENANT
-- ================================================================
ALTER TABLE tenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_areas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;

-- Función para obtener tenant_id del usuario autenticado
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas RLS — cada tabla solo visible para su tenant
CREATE POLICY "tenant_isolation" ON users         USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON organizations USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON sucursales    USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON table_areas   USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON tables        USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON categories    USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON products      USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON orders        USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON order_items   USING (order_id IN (SELECT id FROM orders WHERE tenant_id = get_tenant_id()));
CREATE POLICY "tenant_isolation" ON payments      USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON cash_registers USING (tenant_id = get_tenant_id());
CREATE POLICY "tenant_isolation" ON audit_logs    USING (tenant_id = get_tenant_id());

-- ================================================================
-- TRIGGER: Auditoría automática de órdenes
-- ================================================================
CREATE OR REPLACE FUNCTION log_order_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::JSONB ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_change();

-- ================================================================
-- DATOS SEMILLA (DEMO)
-- ================================================================
INSERT INTO tenants (id, name, slug, plan, max_sucursales, max_usuarios, max_mesas, max_productos)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Restaurante', 'demo', 'profesional', 5, 20, 50, 200);

INSERT INTO organizations (tenant_id, name, rfc)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Restaurante S.A.', 'DEMO123456ABC');
