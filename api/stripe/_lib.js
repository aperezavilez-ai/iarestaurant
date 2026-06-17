import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const BILLING_ROLES = new Set(['admin_restaurant', 'admin_saas'])

export const PLAN_LIMITS = {
  basico: {
    max_usuarios: 5,
    max_sucursales: 1,
    max_mesas: 20,
    max_productos: 50,
    max_devices: 3,
  },
  profesional: {
    max_usuarios: 20,
    max_sucursales: 5,
    max_mesas: 50,
    max_productos: 200,
    max_devices: 8,
  },
  enterprise: {
    max_usuarios: 100,
    max_sucursales: 50,
    max_mesas: 500,
    max_productos: 5000,
    max_devices: 25,
  },
}

export function setCors(res, methods = 'POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
}

export function appBaseUrl() {
  const fromEnv = process.env.VITE_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel}`.replace(/\/$/, '')
  return 'http://localhost:5173'
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  return new Stripe(key)
}

export function priceIdForPlan(planId) {
  const map = {
    basico: process.env.STRIPE_PRICE_BASICO,
    profesional: process.env.STRIPE_PRICE_PROFESIONAL,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  }
  return map[planId]?.trim() || null
}

export function planFromPriceId(priceId) {
  if (!priceId) return null
  const entries = [
    ['basico', process.env.STRIPE_PRICE_BASICO],
    ['profesional', process.env.STRIPE_PRICE_PROFESIONAL],
    ['enterprise', process.env.STRIPE_PRICE_ENTERPRISE],
  ]
  const hit = entries.find(([, id]) => id?.trim() === priceId)
  return hit ? hit[0] : null
}

export async function verifyBillingUser(req) {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !serviceKey || !anonKey) {
    return { error: 'Servidor sin configurar SUPABASE_SERVICE_ROLE_KEY', status: 500 }
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado', status: 401 }
  }

  const token = authHeader.slice(7)
  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: authData, error: authErr } = await userClient.auth.getUser(token)
  if (authErr || !authData.user) return { error: 'Sesión inválida', status: 401 }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile } = await admin
    .from('users')
    .select('id, tenant_id, role, email, full_name')
    .eq('id', authData.user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Usuario sin restaurante', status: 403 }
  if (!BILLING_ROLES.has(profile.role)) {
    return { error: 'Solo el administrador del restaurante puede gestionar la suscripción', status: 403 }
  }

  const { data: tenant } = await admin
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant) return { error: 'Restaurante no encontrado', status: 404 }

  return { admin, profile, tenant, userEmail: authData.user.email || profile.email }
}

export async function applyPlanToTenant(admin, tenantId, planId, patch = {}) {
  const limits = PLAN_LIMITS[planId]
  if (!limits) throw new Error(`Plan desconocido: ${planId}`)

  const { error } = await admin
    .from('tenants')
    .update({
      plan: planId,
      ...limits,
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId)

  if (error) throw error
}

export function subscriptionStatusFromStripe(status) {
  const allowed = new Set(['trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid'])
  return allowed.has(status) ? status : 'none'
}
