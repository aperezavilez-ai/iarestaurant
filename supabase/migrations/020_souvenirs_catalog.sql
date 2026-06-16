-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 020: Catálogo Souvenirs
-- ================================================================

-- Demo tenant (IDs fijos)
INSERT INTO categories (id, tenant_id, sucursal_id, name, color, sort_order, is_active, kitchen_center) VALUES
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Souvenirs', '#a855f7', 7, true, 'souvenirs')
ON CONFLICT (id) DO UPDATE SET kitchen_center = 'souvenirs', is_active = true;

INSERT INTO products (id, tenant_id, sucursal_id, category_id, name, description, price, cost, sku, is_active) VALUES
  ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107', 'Vaso con logo', 'Artículo promocional con el logo de tu restaurante', 89, 35, 'SV-VASO', true),
  ('00000000-0000-0000-0000-000000000216', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107', 'Termo con logo', 'Artículo promocional con el logo de tu restaurante', 349, 140, 'SV-TERMO', true),
  ('00000000-0000-0000-0000-000000000217', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107', 'Playera con logo', 'Artículo promocional con el logo de tu restaurante', 299, 110, 'SV-PLAYERA', true),
  ('00000000-0000-0000-0000-000000000218', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107', 'Mandil con logo', 'Artículo promocional con el logo de tu restaurante', 249, 95, 'SV-MANDIL', true),
  ('00000000-0000-0000-0000-000000000219', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107', 'Taza con logo', 'Artículo promocional con el logo de tu restaurante', 129, 48, 'SV-TAZA', true),
  ('00000000-0000-0000-0000-000000000220', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107', 'Gorra con logo', 'Artículo promocional con el logo de tu restaurante', 199, 75, 'SV-GORRA', true)
ON CONFLICT (id) DO NOTHING;

-- Resto de tenants: categoría + productos si no existen
DO $$
DECLARE
  r RECORD;
  cat_id UUID;
BEGIN
  FOR r IN
    SELECT t.id AS tenant_id, s.id AS sucursal_id
    FROM tenants t
    JOIN LATERAL (
      SELECT id FROM sucursales WHERE tenant_id = t.id AND is_active = true ORDER BY created_at LIMIT 1
    ) s ON true
    WHERE t.id <> '00000000-0000-0000-0000-000000000001'
  LOOP
    SELECT id INTO cat_id FROM categories
    WHERE tenant_id = r.tenant_id AND lower(trim(name)) = 'souvenirs' LIMIT 1;

    IF cat_id IS NULL THEN
      cat_id := gen_random_uuid();
      INSERT INTO categories (id, tenant_id, sucursal_id, name, color, sort_order, is_active, kitchen_center)
      VALUES (cat_id, r.tenant_id, r.sucursal_id, 'Souvenirs', '#a855f7', 99, true, 'souvenirs');
    END IF;

    INSERT INTO products (tenant_id, sucursal_id, category_id, name, description, price, cost, sku, is_active)
    SELECT r.tenant_id, r.sucursal_id, cat_id, v.name, 'Artículo promocional con el logo de tu restaurante', v.price, v.cost, v.sku, true
    FROM (VALUES
      ('Vaso con logo', 89::numeric, 35::numeric, 'SV-VASO'),
      ('Termo con logo', 349, 140, 'SV-TERMO'),
      ('Playera con logo', 299, 110, 'SV-PLAYERA'),
      ('Mandil con logo', 249, 95, 'SV-MANDIL'),
      ('Taza con logo', 129, 48, 'SV-TAZA'),
      ('Gorra con logo', 199, 75, 'SV-GORRA')
    ) AS v(name, price, cost, sku)
    WHERE NOT EXISTS (
      SELECT 1 FROM products p
      WHERE p.tenant_id = r.tenant_id AND p.category_id = cat_id AND lower(trim(p.name)) = lower(trim(v.name))
    );
  END LOOP;
END $$;
