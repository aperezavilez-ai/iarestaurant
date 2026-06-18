import type { LucideIcon } from 'lucide-react'
import {
  Radar, ShoppingCart, Grid3X3, ChefHat, Package, Vault, BarChart3, Users,
  Building2, Settings2, Boxes, Truck, UserCircle, FileText, QrCode, Bike,
  Calendar, CreditCard, Shield, Key, Bell, Sparkles, Globe, Headphones,
  Workflow, Store, DollarSign, Brain, Lock, Printer, Cloud, Languages,
  Database, Zap, Target, BookOpen, GitBranch, Layers, Smartphone,
} from 'lucide-react'

export interface ModuleDef {
  id: string
  phase: number
  label: string
  path: string
  icon: LucideIcon
  group: string
  roles: string[]
  description: string
}

export const MODULE_GROUPS = [
  'Operación',
  'Inventario & Compras',
  'Clientes & Ventas',
  'Digital & QR',
  'Empresa & SaaS',
  'Inteligencia Artificial',
  'Seguridad & Admin',
  'Integraciones & Futuro',
] as const

/** Catálogo completo (roadmap). No mostrar en UI — usar PRODUCTION_MODULES. */
export const ALL_MODULES: ModuleDef[] = [
  // Operación core
  { id: 'dashboard', phase: 1, label: 'Centro de mando', path: '/app/dashboard', icon: Radar, group: 'Operación', roles: ['admin_saas','admin_restaurant','gerente','supervisor'], description: 'Dashboard ejecutivo con KPIs en vivo' },
  { id: 'pos', phase: 1, label: 'POS', path: '/app/pos', icon: ShoppingCart, group: 'Operación', roles: ['cajero','mesero','supervisor','gerente','admin_restaurant'], description: 'Terminal de venta con cobro mixto' },
  { id: 'sales', phase: 1, label: 'Historial ventas', path: '/app/sales', icon: FileText, group: 'Operación', roles: ['cajero','gerente','admin_restaurant'], description: 'Historial y reimpresión de tickets' },
  { id: 'tables', phase: 2, label: 'Mesas & Piso', path: '/app/tables', icon: Grid3X3, group: 'Operación', roles: ['mesero','cajero','supervisor','capitan','gerente','admin_restaurant'], description: 'Plano visual, división de cuenta, meseros' },
  { id: 'kitchen', phase: 3, label: 'Cocina KDS', path: '/app/kitchen', icon: ChefHat, group: 'Operación', roles: ['cocina','supervisor','gerente','admin_restaurant'], description: 'Kitchen Display System en tiempo real' },
  { id: 'production', phase: 21, label: 'Centros producción', path: '/app/production', icon: Layers, group: 'Operación', roles: ['cocina','gerente','admin_restaurant'], description: 'Cocina caliente, fría, barra, postres' },
  { id: 'catalog', phase: 1, label: 'Catálogo', path: '/app/catalog', icon: Package, group: 'Operación', roles: ['admin_restaurant','gerente','supervisor'], description: 'Productos, variantes y categorías' },
  { id: 'categories', phase: 1, label: 'Categorías', path: '/app/categories', icon: Package, group: 'Operación', roles: ['admin_restaurant','gerente'], description: 'Gestión de categorías del menú' },
  { id: 'cash', phase: 1, label: 'Caja', path: '/app/cash', icon: Vault, group: 'Operación', roles: ['cajero','gerente','admin_restaurant'], description: 'Apertura, corte X y corte Z' },
  { id: 'payment-gateways', phase: 1, label: 'Pasarelas', path: '/app/payment-gateways', icon: CreditCard, group: 'Clientes & Ventas', roles: ['gerente','admin_restaurant'], description: 'Enlaces MP, Stripe y Clip — cobro fuera de la app' },
  { id: 'promotions', phase: 0, label: 'Promociones', path: '/app/promotions', icon: Zap, group: 'Operación', roles: ['gerente','admin_restaurant'], description: '2x1, combos, happy hour, cupones' },
  { id: 'delivery', phase: 14, label: 'Delivery', path: '/app/delivery', icon: Bike, group: 'Operación', roles: ['gerente','supervisor','admin_restaurant'], description: 'Pedidos a domicilio y repartidores' },
  { id: 'reservations', phase: 15, label: 'Reservaciones', path: '/app/reservations', icon: Calendar, group: 'Operación', roles: ['mesero','gerente','admin_restaurant'], description: 'Calendario y lista de espera' },
  { id: 'printing', phase: 17, label: 'Impresión', path: '/app/printing', icon: Printer, group: 'Operación', roles: ['admin_restaurant','gerente'], description: 'Impresoras caja, cocina, barra' },
  // Inventario
  { id: 'inventory', phase: 4, label: 'Inventario', path: '/app/inventory', icon: Boxes, group: 'Inventario & Compras', roles: ['gerente','admin_restaurant'], description: 'Ingredientes, kardex y alertas stock' },
  { id: 'purchases', phase: 23, label: 'Compras', path: '/app/purchases', icon: Truck, group: 'Inventario & Compras', roles: ['gerente','admin_restaurant'], description: 'Órdenes de compra y proveedores' },
  { id: 'suppliers', phase: 4, label: 'Proveedores', path: '/app/suppliers', icon: Building2, group: 'Inventario & Compras', roles: ['gerente','admin_restaurant'], description: 'Directorio de proveedores' },
  // CRM
  { id: 'customers', phase: 5, label: 'Clientes CRM', path: '/app/customers', icon: UserCircle, group: 'Clientes & Ventas', roles: ['gerente','admin_restaurant'], description: 'Clientes, historial y segmentación' },
  { id: 'loyalty', phase: 5, label: 'Lealtad', path: '/app/loyalty', icon: Target, group: 'Clientes & Ventas', roles: ['gerente','admin_restaurant'], description: 'Puntos, cupones y recompensas' },
  { id: 'invoicing', phase: 6, label: 'Facturación CFDI', path: '/app/invoicing', icon: FileText, group: 'Clientes & Ventas', roles: ['cajero','gerente','admin_restaurant'], description: 'CFDI 4.0, XML, PDF' },
  { id: 'reports', phase: 7, label: 'Reportes BI', path: '/app/reports', icon: BarChart3, group: 'Clientes & Ventas', roles: ['gerente','admin_restaurant'], description: 'Analítica y exportación' },
  { id: 'finance', phase: 31, label: 'Finanzas', path: '/app/finance', icon: DollarSign, group: 'Clientes & Ventas', roles: ['gerente','admin_restaurant'], description: 'CxC, CxP, flujo de efectivo' },
  // Digital
  { id: 'qr', phase: 8, label: 'Menú QR', path: '/app/qr', icon: QrCode, group: 'Digital & QR', roles: ['admin_restaurant','gerente'], description: 'QR comensal y sesiones seguras' },
  { id: 'comensal', phase: 8, label: 'Comensal', path: '/comensal', icon: Smartphone, group: 'Digital & QR', roles: ['admin_restaurant','gerente','cliente'], description: 'Pedidos desde mesa, pago móvil' },
  { id: 'mesero-pwa', phase: 0, label: 'Mesero móvil', path: '/mesero', icon: Smartphone, group: 'Digital & QR', roles: ['mesero','capitan','supervisor'], description: 'Mesas, pedidos y notificaciones' },
  // Empresa
  { id: 'users', phase: 1, label: 'Equipo', path: '/app/users', icon: Users, group: 'Empresa & SaaS', roles: ['admin_restaurant','gerente'], description: 'Usuarios y roles' },
  { id: 'hr', phase: 24, label: 'RRHH', path: '/app/hr', icon: Users, group: 'Empresa & SaaS', roles: ['gerente','admin_restaurant'], description: 'Turnos, asistencia, comisiones' },
  { id: 'branches', phase: 0, label: 'Sucursales', path: '/app/branches', icon: Building2, group: 'Empresa & SaaS', roles: ['admin_restaurant','admin_saas'], description: 'Multi sucursal' },
  { id: 'franchise', phase: 32, label: 'Franquicias', path: '/app/franchise', icon: GitBranch, group: 'Empresa & SaaS', roles: ['admin_saas','admin_restaurant'], description: 'Regalías y catálogo corporativo' },
  { id: 'subscriptions', phase: 11, label: 'Suscripciones', path: '/app/subscriptions', icon: CreditCard, group: 'Empresa & SaaS', roles: ['admin_saas','admin_restaurant'], description: 'Plan IA·RESTAURANT — cobro con Stripe a la plataforma' },
  { id: 'saas-owner', phase: 45, label: 'Panel SaaS', path: '/app/saas', icon: Cloud, group: 'Empresa & SaaS', roles: ['admin_saas'], description: 'MRR, ARR, churn, salud plataforma' },
  { id: 'onboarding', phase: 41, label: 'Onboarding', path: '/app/onboarding', icon: BookOpen, group: 'Empresa & SaaS', roles: ['admin_restaurant'], description: 'Configuración guiada inicial' },
  { id: 'support', phase: 29, label: 'Soporte', path: '/app/support', icon: Headphones, group: 'Empresa & SaaS', roles: ['admin_restaurant','gerente'], description: 'Tickets y base de conocimiento' },
  { id: 'marketplace', phase: 28, label: 'Marketplace', path: '/app/marketplace', icon: Store, group: 'Empresa & SaaS', roles: ['admin_restaurant','admin_saas'], description: 'Módulos e integraciones' },
  // IA
  { id: 'ia-chat', phase: 31, label: 'IA-Support', path: '/app/ia', icon: Brain, group: 'Inteligencia Artificial', roles: ['admin_restaurant','gerente','supervisor'], description: 'Asistente IA por rol con RAG' },
  { id: 'automation', phase: 35, label: 'Automatizaciones', path: '/app/automation', icon: Workflow, group: 'Inteligencia Artificial', roles: ['gerente','admin_restaurant'], description: 'Workflows evento→condición→acción' },
  { id: 'bi', phase: 26, label: 'BI Avanzado', path: '/app/bi', icon: BarChart3, group: 'Inteligencia Artificial', roles: ['gerente','admin_restaurant'], description: 'KPIs, forecast y benchmarking' },
  { id: 'datawarehouse', phase: 27, label: 'Data Warehouse', path: '/app/datawarehouse', icon: Database, group: 'Inteligencia Artificial', roles: ['admin_saas'], description: 'ETL y analítica desacoplada' },
  { id: 'antifraud', phase: 44, label: 'Antifraude', path: '/app/antifraud', icon: Shield, group: 'Inteligencia Artificial', roles: ['gerente','admin_restaurant'], description: 'Detección de anomalías' },
  // Seguridad
  { id: 'audit', phase: 12, label: 'Auditoría', path: '/app/audit', icon: Shield, group: 'Seguridad & Admin', roles: ['admin_restaurant','admin_saas'], description: 'Registro inmutable de acciones' },
  { id: 'permissions', phase: 13, label: 'Permisos RBAC', path: '/app/permissions', icon: Key, group: 'Seguridad & Admin', roles: ['admin_restaurant','admin_saas'], description: 'CRUD por módulo' },
  { id: 'security', phase: 0, label: 'Seguridad', path: '/app/security', icon: Lock, group: 'Seguridad & Admin', roles: ['admin_saas','admin_restaurant'], description: 'MFA, sesiones, OWASP' },
  { id: 'notifications', phase: 0, label: 'Notificaciones', path: '/app/notifications', icon: Bell, group: 'Seguridad & Admin', roles: ['gerente','admin_restaurant'], description: 'Push, WhatsApp, email' },
  { id: 'settings', phase: 1, label: 'Configuración', path: '/app/settings', icon: Settings2, group: 'Seguridad & Admin', roles: ['admin_restaurant','admin_saas'], description: 'Sistema y restaurante' },
  { id: 'localization', phase: 0, label: 'i18n', path: '/app/localization', icon: Languages, group: 'Seguridad & Admin', roles: ['admin_saas'], description: 'Idiomas, monedas, zonas horarias' },
  { id: 'versioning', phase: 39, label: 'Versiones', path: '/app/versioning', icon: GitBranch, group: 'Seguridad & Admin', roles: ['admin_saas'], description: 'Feature flags y despliegues' },
  // Integraciones
  { id: 'integrations', phase: 42, label: 'Integraciones', path: '/app/integrations', icon: Globe, group: 'Integraciones & Futuro', roles: ['admin_restaurant','admin_saas'], description: 'WhatsApp, Stripe, delivery' },
  { id: 'api', phase: 16, label: 'API Pública', path: '/app/api', icon: Globe, group: 'Integraciones & Futuro', roles: ['admin_saas'], description: 'REST, OpenAPI, webhooks' },
  { id: 'customer-success', phase: 36, label: 'Customer Success', path: '/app/customer-success', icon: Sparkles, group: 'Integraciones & Futuro', roles: ['admin_saas'], description: 'Adopción, NPS, retención' },
]

export function userCanAccessModule(
  user: { role: string; allowed_modules?: string[] },
  module: ModuleDef
): boolean {
  if (!PRODUCTION_MODULE_IDS.has(module.id)) return false
  if (user.allowed_modules?.length) {
    return user.allowed_modules.includes(module.id)
  }
  return module.roles.includes(user.role)
}

/** Módulos con pantalla real conectada a Supabase (sin placeholders demo). */
export const PRODUCTION_MODULE_IDS = new Set([
  'dashboard', 'pos', 'sales', 'tables', 'kitchen', 'catalog', 'cash', 'payment-gateways',
  'delivery', 'reservations', 'inventory', 'purchases', 'customers', 'loyalty', 'invoicing',
  'reports', 'finance', 'qr', 'comensal', 'mesero-pwa', 'users', 'branches',
  'notifications', 'settings', 'integrations', 'printing', 'subscriptions',
  'security', 'saas-owner',
])

export const PRODUCTION_MODULES = ALL_MODULES.filter((m) => PRODUCTION_MODULE_IDS.has(m.id))

export function getDefaultModuleIdsForRole(role: string): string[] {
  return PRODUCTION_MODULES.filter((m) => m.roles.includes(role)).map((m) => m.id)
}
