-- Configuración de alertas por email (Resend)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS email_config JSONB;
