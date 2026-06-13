-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 005: RLS tenants (login admin fallaba)
-- Sin política SELECT en tenants, getTenant() devolvía vacío tras login
-- ================================================================

CREATE POLICY "tenant_read_own" ON tenants
  FOR SELECT USING (id = get_tenant_id());
