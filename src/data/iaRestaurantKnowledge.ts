/**
 * Base de conocimiento IA·RESTAURANT (0–100%).
 * Alimenta IA-Support: guía operativa, módulos y flujos reales.
 */

export type KnowledgeArea =
  | 'intro'
  | 'login'
  | 'turno'
  | 'pos'
  | 'mesas'
  | 'cocina'
  | 'caja'
  | 'catalogo'
  | 'qr'
  | 'impresoras'
  | 'correo'
  | 'suscripciones'
  | 'seguridad'
  | 'roles'
  | 'ia'
  | 'contingencia'

export interface KnowledgeChunk {
  id: string
  area: KnowledgeArea
  title: string
  keywords: string[]
  content: string
  /** Rutas de la app para orientar al usuario */
  paths?: string[]
}

export const IA_RESTAURANT_KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: 'intro-01',
    area: 'intro',
    title: 'Qué es IA·RESTAURANT',
    keywords: ['que es', 'qué es', 'sistema', 'plataforma', 'ia restaurant', 'iarestaurant', 'para que sirve'],
    content:
      'IA·RESTAURANT es el sistema operativo del restaurante: POS, mesas, cocina (KDS), caja con turnos, menú QR, catálogo, reportes, seguridad de equipos, correos (Resend), suscripciones Stripe e impresoras térmicas. Producción: https://www.iarestaurant.mx',
    paths: ['/app/dashboard'],
  },
  {
    id: 'login-01',
    area: 'login',
    title: 'Cómo entrar',
    keywords: ['login', 'entrar', 'acceso', 'correo', 'contraseña', 'iniciar sesión'],
    content:
      'Entra en /login con tu correo de rol. Admin propietario: alfonsoavilery@icloud.com. El admin NO necesita abrir turno de caja para revisar; cajero/gerente/supervisor sí antes de cobrar.',
    paths: ['/login'],
  },
  {
    id: 'turno-01',
    area: 'turno',
    title: 'Apertura y cierre de turno',
    keywords: ['turno', 'abrir turno', 'corte z', 'corte x', 'fondo', 'caja cerrada', 'stale'],
    content:
      'Turno obligatorio solo para cajero, gerente y supervisor. Abrir: hora + fondo en efectivo. Durante el día: Corte X (parcial). Al salir: Corte Z con conteo físico. Un turno de días anteriores sin cerrar bloquea a roles de caja hasta Corte Z. Admin revisa sin abrir turno.',
    paths: ['/app/cash/shift', '/app/cash'],
  },
  {
    id: 'pos-01',
    area: 'pos',
    title: 'Cobrar en POS',
    keywords: ['pos', 'cobrar', 'ticket', 'efectivo', 'tarjeta', 'mixto', 'venta'],
    content:
      'POS → agregar productos → Cobrar → efectivo, tarjeta o mixto. Requiere turno abierto (roles de caja). Ticket intenta impresora térmica; si no hay, usa impresión del navegador. División de cuenta se cobra por partes desde Mesas.',
    paths: ['/app/pos'],
  },
  {
    id: 'mesas-01',
    area: 'mesas',
    title: 'Mesas y piso',
    keywords: ['mesa', 'piso', 'mesero', 'dividir', 'cuenta', 'comensal'],
    content:
      'Mesas & Piso: plano, tomar pedido, liberar mesa. Dividir cuenta: partes iguales o por ítems; cobrar cada parte en POS. Mesero móvil: /mesero',
    paths: ['/app/tables', '/mesero'],
  },
  {
    id: 'cocina-01',
    area: 'cocina',
    title: 'Cocina KDS',
    keywords: ['cocina', 'kds', 'pedido listo', 'comanda'],
    content:
      'Cocina KDS muestra órdenes en tiempo real. Marca platillos listos; puede disparar alerta email/WhatsApp si está configurado. Cocina NO pide apertura de turno.',
    paths: ['/app/kitchen'],
  },
  {
    id: 'caja-01',
    area: 'caja',
    title: 'Caja y movimientos',
    keywords: ['caja', 'efectivo', 'entrada', 'salida', 'movimientos', 'cuadre'],
    content:
      'Caja: resumen del turno, entradas/salidas de efectivo, Corte X/Z. Cuadre: ventas del turno = suma de pagos; diferencia = contado − esperado.',
    paths: ['/app/cash', '/app/cash/shift'],
  },
  {
    id: 'catalogo-01',
    area: 'catalogo',
    title: 'Catálogo y menú',
    keywords: ['catalogo', 'catálogo', 'producto', 'menu', 'menú', 'categoría', 'precio'],
    content:
      'Catálogo: productos, categorías, precios e imágenes. Lo que actives aparece en POS y en menú QR del comensal.',
    paths: ['/app/catalog'],
  },
  {
    id: 'qr-01',
    area: 'qr',
    title: 'Menú QR comensal',
    keywords: ['qr', 'comensal', 'escanear', 'pedido mesa', 'celular'],
    content:
      'QR por mesa → comensal pide desde el celular → pedido a cocina/caja. Genera/regenera QR en módulo Menú QR. PWA comensal: /comensal?mesa=N',
    paths: ['/app/qr', '/comensal'],
  },
  {
    id: 'impresoras-01',
    area: 'impresoras',
    title: 'Impresoras térmicas',
    keywords: ['impresora', 'ticket', 'bluetooth', 'wifi', 'epson', 'star', 'térmica'],
    content:
      'Operación → Impresión: Epson, Star, Bixolon, Citizen, Xprinter por Bluetooth o WiFi (misma red LAN). Config por equipo (navegador). Prueba antes de rush.',
    paths: ['/app/printing'],
  },
  {
    id: 'correo-01',
    area: 'correo',
    title: 'Correos Resend',
    keywords: ['correo', 'email', 'resend', 'alerta', 'notificación'],
    content:
      'Ajustes → Correo: activar alertas (pago, pedido listo) y enviar prueba. Requiere dominio verificado y RESEND_API_KEY en Vercel.',
    paths: ['/app/settings'],
  },
  {
    id: 'subs-01',
    area: 'suscripciones',
    title: 'Planes Arranque y Comando',
    keywords: ['plan', 'suscripcion', 'suscripción', 'stripe', 'arranque', 'comando', 'precio'],
    content:
      'Plan Arranque (basico) ~$699/mes · Plan Comando (profesional) ~$999/mes · también anual. Checkout Stripe en Suscripciones. Webhook sincroniza el plan del tenant.',
    paths: ['/app/subscriptions'],
  },
  {
    id: 'seguridad-01',
    area: 'seguridad',
    title: 'Equipos y seguridad',
    keywords: ['equipo', 'dispositivo', 'autorizar', 'seguridad', 'ip', 'pendiente'],
    content:
      'Seguridad → Equipos: aprobar/revocar tablets y PCs. Admin/gerente auto-aprueban su propio equipo. IP allowlist opcional. Límite de equipos según plan.',
    paths: ['/app/security'],
  },
  {
    id: 'roles-01',
    area: 'roles',
    title: 'Roles del equipo',
    keywords: ['rol', 'cajero', 'mesero', 'cocina', 'gerente', 'admin', 'permisos'],
    content:
      'Admin restaurante: configura y revisa sin turno obligatorio. Gerente/supervisor/cajero: turno + POS/caja. Mesero: mesas. Cocina: KDS. Alta de personal en Equipo.',
    paths: ['/app/users'],
  },
  {
    id: 'ia-01',
    area: 'ia',
    title: 'Copiloto IA e IA-Support',
    keywords: ['ia', 'copiloto', 'asistente', 'ayuda', 'como funciona', 'enseñar', 'guia', 'guía'],
    content:
      'Copiloto IA (panel derecho) muestra insights de operación en vivo. IA-Support responde con la guía completa del sistema (módulos, turnos, POS, QR, etc.) y orienta a la pantalla correcta.',
    paths: ['/app/ia', '/app/dashboard'],
  },
  {
    id: 'contingencia-01',
    area: 'contingencia',
    title: 'Problemas frecuentes',
    keywords: ['error', 'no imprime', 'no cobra', 'sin red', 'offline', 'problema', 'falla'],
    content:
      'No cobra → abrir/cerrar turno (roles caja). No imprime → /app/printing o permitir pop-ups. Sin red → opera local y sync al volver. Equipo pendiente → Seguridad → Equipos. Anotar hora y mensaje F12.',
    paths: ['/app/cash/shift', '/app/printing', '/app/security'],
  },
]

export const AREA_LABELS: Record<KnowledgeArea, string> = {
  intro: 'Introducción',
  login: 'Acceso',
  turno: 'Turnos de caja',
  pos: 'POS / ventas',
  mesas: 'Mesas & piso',
  cocina: 'Cocina KDS',
  caja: 'Caja',
  catalogo: 'Catálogo',
  qr: 'Menú QR',
  impresoras: 'Impresión',
  correo: 'Correo',
  suscripciones: 'Suscripciones',
  seguridad: 'Seguridad',
  roles: 'Roles',
  ia: 'Asistente IA',
  contingencia: 'Contingencia',
}
