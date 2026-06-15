export type PaymentGatewayId = 'mercadopago' | 'clip' | 'stripe'

export interface PaymentGatewayDef {
  id: PaymentGatewayId
  name: string
  tagline: string
  description: string
  region: string
  accent: string
  features: string[]
  signupUrl: string
  docsUrl: string
  /** Aclaración: cuenta del restaurante, no suscripción IA·RESTAURANT */
  accountNote: string
}

/** Pasarelas para que el restaurante cobre a sus comensales — NO suscripción SaaS */
export const PAYMENT_GATEWAYS: PaymentGatewayDef[] = [
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    tagline: 'Cobros locales en México',
    description:
      'Abre tu cuenta de negocio en Mercado Pago para recibir pagos de tus comensales con tarjeta, transferencia, OXXO y QR. El dinero va directo a tu cuenta.',
    region: 'México',
    accent: '#009EE3',
    features: ['Link de pago', 'QR en mesa', 'Terminal Point', 'Comisiones en MXN'],
    signupUrl: 'https://www.mercadopago.com.mx/herramientas-para-vender',
    docsUrl: 'https://www.mercadopago.com.mx/developers/es/docs',
    accountNote: 'Cuenta de tu restaurante en Mercado Pago — no es el pago de tu plan IA·RESTAURANT.',
  },
  {
    id: 'clip',
    name: 'Clip',
    tagline: 'Terminal y cobro presencial',
    description:
      'Clip es muy usado en restaurantes mexicanos para cobrar con terminal móvil y links. Regístrate con tu RFC o negocio; los depósitos llegan a tu cuenta Clip.',
    region: 'México',
    accent: '#FF6B00',
    features: ['Terminal Clip', 'Link de pago', 'Cobro con tarjeta', 'Depósitos a tu banco'],
    signupUrl: 'https://www.clip.mx/',
    docsUrl: 'https://ayuda.clip.mx/',
    accountNote: 'Tu cuenta Clip para cobrar en caja o mesa — independiente de IA·RESTAURANT.',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    tagline: 'Tarjetas y pagos en línea',
    description:
      'Crea una cuenta Stripe de negocio para Payment Links, checkout y tarjetas internacionales. Los fondos se depositan en la cuenta bancaria que configures en Stripe.',
    region: 'Global · MX',
    accent: '#635BFF',
    features: ['Payment Links', 'Tarjetas internacionales', 'Dashboard de cobros', 'API para integraciones'],
    signupUrl: 'https://dashboard.stripe.com/register',
    docsUrl: 'https://docs.stripe.com/payments/payment-links',
    accountNote:
      'Importante: esta es tu cuenta Stripe para cobrar a comensales. No confundir con el cobro de mensualidad/anualidad del software IA·RESTAURANT (eso se gestiona aparte en Suscripciones).',
  },
]

export const SAAS_BILLING_NOTE =
  'El pago de tu plan IA·RESTAURANT (mensual o anual) es un proceso distinto y no pasa por estas pasarelas. Aquí solo configuras cómo tus clientes te pagan en el restaurante.'
