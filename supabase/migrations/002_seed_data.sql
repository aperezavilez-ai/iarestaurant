-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 002: DATOS SEMILLA COMPLETOS
-- Ejecutar después de 001_initial_schema.sql
-- ================================================================

-- Actualizar tenant demo
UPDATE tenants SET name = 'IA-RESTAURANT', slug = 'ia-restaurant'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Sucursal principal
INSERT INTO sucursales (id, tenant_id, organization_id, name, address, phone, timezone, currency, tax_rate)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM organizations WHERE tenant_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
  'Sucursal Centro',
  'Av. Reforma 123, CDMX',
  '+52 55 1234 5678',
  'America/Mexico_City',
  'MXN',
  16.00
) ON CONFLICT (id) DO NOTHING;

-- Sucursal secundaria
INSERT INTO sucursales (id, tenant_id, organization_id, name, address, phone)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM organizations WHERE tenant_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
  'Sucursal Polanco',
  'Av. Presidente Masaryk 200, CDMX',
  '+52 55 8765 4321'
) ON CONFLICT (id) DO NOTHING;

-- Categorías
INSERT INTO categories (id, tenant_id, sucursal_id, name, sort_order) VALUES
  ('cat-tacos', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Tacos', 1),
  ('cat-platillos', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Platillos', 2),
  ('cat-entradas', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Entradas', 3),
  ('cat-bebidas', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Bebidas', 4),
  ('cat-cocteles', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Cocteles', 5),
  ('cat-postres', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Postres', 6)
ON CONFLICT (id) DO NOTHING;

-- Productos
INSERT INTO products (id, tenant_id, sucursal_id, category_id, name, price, cost, is_active) VALUES
  ('p1', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-tacos', 'Tacos de Pastor', 65, 22, true),
  ('p2', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-tacos', 'Tacos de Bistec', 70, 28, true),
  ('p3', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-platillos', 'Enchiladas Verdes', 80, 30, true),
  ('p4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-platillos', 'Pozole Rojo', 95, 38, true),
  ('p5', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-entradas', 'Guacamole', 55, 18, true),
  ('p6', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-bebidas', 'Agua de Jamaica', 25, 6, true),
  ('p7', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-cocteles', 'Margarita Clásica', 85, 30, true),
  ('p14', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cat-postres', 'Churros', 50, 14, false)
ON CONFLICT (id) DO NOTHING;

-- Áreas y mesas
INSERT INTO table_areas (id, tenant_id, sucursal_id, name, color, sort_order) VALUES
  ('area1', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Salón Principal', '#f59000', 1),
  ('area2', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Terraza', '#16213e', 2)
ON CONFLICT (id) DO NOTHING;
