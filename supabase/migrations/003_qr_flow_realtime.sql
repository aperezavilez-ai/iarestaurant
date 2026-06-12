-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 003: FLUJO QR + ALERTAS + REALTIME
-- Ejecutar después de 002_seed_data.sql
-- ================================================================

-- Pedidos desde QR (comensal)
CREATE TABLE IF NOT EXISTS qr_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id     UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES tables(id),
  table_number    INT NOT NULL,
  area            TEXT,
  waiter_id       UUID REFERENCES users(id),
  waiter_name     TEXT,
  items           JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'enviado'
    CHECK (status IN ('enviado','validado','rechazado','en_preparacion','listo','entregado')),
  subtotal        NUMERIC(10,2) DEFAULT 0,
  tax             NUMERIC(10,2) DEFAULT 0,
  total           NUMERIC(10,2) DEFAULT 0,
  folio           TEXT NOT NULL,
  kitchen_order_id UUID,
  rejected_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  validated_at    TIMESTAMPTZ
);

-- Alertas para meseros (QR, solicitudes, pedidos listos)
CREATE TABLE IF NOT EXISTS waiter_alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sucursal_id   UUID REFERENCES sucursales(id),
  type          TEXT NOT NULL
    CHECK (type IN ('nuevo_pedido_qr','pedido_validado','pedido_listo','solicitud_ayuda','solicitud_cuenta','solicitud_servicio')),
  table_number  INT NOT NULL,
  order_id      UUID,
  message       TEXT NOT NULL,
  read          BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración por tenant (modo validación QR)
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  qr_validation   TEXT DEFAULT 'validacion' CHECK (qr_validation IN ('validacion','automatico')),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tenant_settings (tenant_id, qr_validation)
VALUES ('00000000-0000-0000-0000-000000000001', 'validacion')
ON CONFLICT (tenant_id) DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant ON qr_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_orders_status ON qr_orders(status);
CREATE INDEX IF NOT EXISTS idx_qr_orders_table ON qr_orders(table_number);
CREATE INDEX IF NOT EXISTS idx_waiter_alerts_tenant ON waiter_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_waiter_alerts_read ON waiter_alerts(read);

-- RLS
ALTER TABLE qr_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qr_orders_tenant" ON qr_orders
  USING (tenant_id = get_tenant_id());

CREATE POLICY "waiter_alerts_tenant" ON waiter_alerts
  USING (tenant_id = get_tenant_id());

CREATE POLICY "tenant_settings_tenant" ON tenant_settings
  USING (tenant_id = get_tenant_id());

-- Permitir inserción anónima de pedidos QR (comensal sin login)
-- Solo para qr_orders con tenant conocido — en producción usar Edge Function + API key
CREATE POLICY "qr_orders_anon_insert" ON qr_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "waiter_alerts_anon_insert" ON waiter_alerts
  FOR INSERT WITH CHECK (true);

-- REALTIME: En Supabase Dashboard → Database → Publications
-- Habilitar replicación para: qr_orders, waiter_alerts, orders, order_items
