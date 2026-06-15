-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 013: INSERT mesas y áreas
-- ================================================================

CREATE POLICY "table_areas_insert" ON table_areas
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id());

CREATE POLICY "table_areas_update" ON table_areas
  FOR UPDATE USING (tenant_id = get_tenant_id());

CREATE POLICY "tables_insert" ON tables
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id());
