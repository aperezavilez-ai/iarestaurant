-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 017: Área cocina en categorías + ajustes
-- ================================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS kitchen_center TEXT;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS whatsapp_alerts TEXT,
  ADD COLUMN IF NOT EXISTS reports_email TEXT;

UPDATE categories SET kitchen_center = 'barra_caliente'
  WHERE kitchen_center IS NULL AND name IN ('Tacos', 'Platillos', 'Entradas');

UPDATE categories SET kitchen_center = 'barra_fria'
  WHERE kitchen_center IS NULL AND name IN ('Cocteles');

UPDATE categories SET kitchen_center = 'bebidas'
  WHERE kitchen_center IS NULL AND name IN ('Bebidas');

UPDATE categories SET kitchen_center = 'postres'
  WHERE kitchen_center IS NULL AND name IN ('Postres');
