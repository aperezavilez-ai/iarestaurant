-- Stripe SaaS: suscripción del plan IA·RESTAURANT (dueño → plataforma)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON tenants(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
