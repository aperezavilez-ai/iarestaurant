export type PaymentGatewayId = 'mercadopago' | 'stripe' | 'clip'

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
  credentialsHelpUrl?: string
  /** Si IA·RESTAURANT puede generar links desde POS */
  supportsPaymentLinks: boolean
  accountNote: string
}

/** Cobros de comensales: IA·RESTAURANT solo conecta — el dinero va a la cuenta del restaurante. */
export const PAYMENT_BRIDGE_NOTE =
  'Para cobrar a tus comensales, IA·RESTAURANT actúa solo como puente: te ayudamos a conectar Mercado Pago, Stripe o Clip. El dinero se cobra y deposita en tu cuenta del proveedor. Nosotros no recibimos, retenemos ni somos responsables de esos cobros.'

export const PAYMENT_LINK_ONLY_NOTE =
  'Mercado Pago y Stripe permiten generar links de pago desde POS. Con Clip usas tu terminal o app Clip (cobro directo en tu cuenta Clip). No hay cargo automático en tarjeta desde IA·RESTAURANT.'

/** Stripe de la plataforma: dueños de negocio pagan su plan IA·RESTAURANT (no es pasarela de comensales). */
export const SAAS_STRIPE_NOTE =
  'El pago de tu plan IA·RESTAURANT (mensual o anual) se procesa con Stripe directamente a la plataforma IA·RESTAURANT. Eso es independiente de conectar tu propia cuenta Stripe para cobrar a comensales.'

export const SAAS_BILLING_NOTE =
  'Administra tu suscripción al software en Suscripciones. Las pasarelas de esta pantalla son solo para que tus clientes te paguen en el restaurante.'

export const PAYMENT_GATEWAYS: PaymentGatewayDef[] = [
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    tagline: 'Links de pago en México',
    description:
      'Conecta tu cuenta de negocio en Mercado Pago. Desde POS generamos un link de checkout; el pago lo procesa MP y el dinero va a tu cuenta.',
    region: 'México',
    accent: '#009EE3',
    features: ['Link de pago', 'Tarjeta y transferencia', 'OXXO y QR MP', 'Depósito a tu cuenta MP'],
    signupUrl: 'https://www.mercadopago.com.mx/herramientas-para-vender',
    docsUrl: 'https://www.mercadopago.com.mx/developers/es/docs',
    credentialsHelpUrl: 'https://www.mercadopago.com.mx/developers/panel/app',
    supportsPaymentLinks: true,
    accountNote: 'Tu cuenta Mercado Pago — IA·RESTAURANT no toca el dinero.',
  },
  {
    id: 'stripe',
    name: 'Stripe (tu restaurante)',
    tagline: 'Payment Links de tu negocio',
    description:
      'Conecta tu cuenta Stripe de negocio (distinta al pago de tu plan IA·RESTAURANT). Generamos Payment Links; Stripe cobra al comensal y deposita en tu banco.',
    region: 'Global · MX',
    accent: '#635BFF',
    features: ['Payment Links', 'Tarjetas internacionales', 'Dashboard Stripe', 'Depósito a tu banco'],
    signupUrl: 'https://dashboard.stripe.com/register',
    docsUrl: 'https://docs.stripe.com/payments/payment-links',
    credentialsHelpUrl: 'https://dashboard.stripe.com/apikeys',
    supportsPaymentLinks: true,
    accountNote: 'Tu cuenta Stripe de restaurante — no es el cobro de tu plan IA·RESTAURANT.',
  },
  {
    id: 'clip',
    name: 'Clip',
    tagline: 'Terminal y cobro presencial',
    description:
      'Conecta tu cuenta Clip para cobrar con terminal móvil o links desde la app Clip. IA·RESTAURANT te guía el registro; el cobro lo haces en Clip y el dinero va a tu cuenta.',
    region: 'México',
    accent: '#FF6B00',
    features: ['Terminal Clip', 'Link en app Clip', 'Cobro con tarjeta', 'Depósito a tu banco'],
    signupUrl: 'https://www.clip.mx/',
    docsUrl: 'https://ayuda.clip.mx/',
    supportsPaymentLinks: false,
    accountNote: 'Tu cuenta Clip — cobras con terminal o app Clip, no desde links de IA·RESTAURANT.',
  },
]

export const CONNECT_STEPS = [
  { step: 1, title: 'Crea tu cuenta', detail: 'Regístrate en Mercado Pago, Stripe (tu negocio) o Clip con los datos de tu restaurante.' },
  { step: 2, title: 'Conecta en Pasarelas', detail: 'MP y Stripe: pega credenciales API. Clip: confirma la conexión y usa terminal o app Clip para cobrar.' },
  { step: 3, title: 'Cobra en POS', detail: 'MP/Stripe: Tarjeta → “Generar link de pago”. Clip: cobra con tu terminal Clip y confirma en caja.' },
] as const
