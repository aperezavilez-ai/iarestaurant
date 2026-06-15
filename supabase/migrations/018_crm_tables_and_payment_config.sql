-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 018: CRM en mesas/órdenes + pasarelas
-- ================================================================

ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS tables_customer_idx ON tables (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id) WHERE customer_id IS NOT NULL;
