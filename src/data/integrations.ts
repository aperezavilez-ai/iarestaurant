import type { PaymentGatewayId } from '@/data/paymentGateways'

export type IntegrationStatus = 'active' | 'configured' | 'setup' | 'coming_soon'

export interface IntegrationDef {
  id: string
  name: string
  category: string
  icon: string
  description: string
  /** Ruta interna de la app */
  path: string
  /** Enlace externo opcional (crear cuenta en el proveedor) */
  externalUrl?: string
  status: IntegrationStatus
  statusLabel: string
  gatewayId?: PaymentGatewayId
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'Comunicación',
    icon: '💬',
    description: 'Configura el número para alertas de reservas, pedidos listos y avisos al equipo.',
    path: '/app/settings#notificaciones',
    externalUrl: 'https://business.whatsapp.com/',
    status: 'setup',
    statusLabel: 'Configurar',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    category: 'Pagos',
    icon: '🛒',
    description: 'Conecta tu cuenta MP y genera links de pago desde POS. El dinero va directo a tu cuenta — IA·RESTAURANT solo es puente.',
    path: '/app/payment-gateways?gw=mercadopago',
    externalUrl: 'https://www.mercadopago.com.mx/herramientas-para-vender',
    status: 'setup',
    statusLabel: 'Conectar cuenta',
    gatewayId: 'mercadopago',
  },
  {
    id: 'stripe',
    name: 'Stripe (tu restaurante)',
    category: 'Pagos',
    icon: '💳',
    description: 'Conecta tu cuenta Stripe de negocio para Payment Links a comensales. Distinto del Stripe de tu plan IA·RESTAURANT.',
    path: '/app/payment-gateways?gw=stripe',
    externalUrl: 'https://dashboard.stripe.com/register',
    status: 'setup',
    statusLabel: 'Conectar cuenta',
    gatewayId: 'stripe',
  },
  {
    id: 'clip',
    name: 'Clip',
    category: 'Pagos',
    icon: '📱',
    description: 'Conecta tu cuenta Clip para terminal y cobro presencial. El dinero va a tu cuenta Clip — IA·RESTAURANT solo guía la conexión.',
    path: '/app/payment-gateways?gw=clip',
    externalUrl: 'https://www.clip.mx/',
    status: 'setup',
    statusLabel: 'Conectar cuenta',
    gatewayId: 'clip',
  },
  {
    id: 'saas-stripe',
    name: 'Stripe (plan IA·RESTAURANT)',
    category: 'Suscripción',
    icon: '💜',
    description: 'Dueños de negocio pagan su plan mensual/anual con Stripe directamente a la plataforma IA·RESTAURANT.',
    path: '/app/subscriptions',
    externalUrl: 'https://stripe.com',
    status: 'active',
    statusLabel: 'Facturación SaaS',
  },
  {
    id: 'cfdi',
    name: 'PAC Facturación CFDI',
    category: 'Facturación',
    icon: '📄',
    description: 'Genera facturas desde órdenes cobradas, timbra y descarga XML/PDF.',
    path: '/app/invoicing',
    status: 'active',
    statusLabel: 'Activo',
  },
  {
    id: 'delivery',
    name: 'Delivery manual',
    category: 'Delivery',
    icon: '🛵',
    description: 'Registra pedidos a domicilio, asigna repartidor y envía a cocina. Sin conexión a apps externas.',
    path: '/app/delivery',
    status: 'active',
    statusLabel: 'Activo',
  },
  {
    id: 'printer',
    name: 'Impresora y tickets',
    category: 'Hardware',
    icon: '🖨️',
    description: 'Imprime tickets, QR por mesa y comandas desde Caja y el módulo de impresión.',
    path: '/app/printing',
    status: 'active',
    statusLabel: 'Activo',
  },
  {
    id: 'qr',
    name: 'Menú QR comensal',
    category: 'Comensal',
    icon: '📲',
    description: 'QR por mesa para que el comensal pida desde el celular.',
    path: '/app/qr',
    status: 'active',
    statusLabel: 'Activo',
  },
]

export function integrationStatusVariant(status: IntegrationStatus): 'success' | 'info' | 'warning' | 'default' {
  if (status === 'active' || status === 'configured') return 'success'
  if (status === 'setup') return 'info'
  if (status === 'coming_soon') return 'warning'
  return 'default'
}
