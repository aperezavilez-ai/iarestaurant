import type {
  Ingredient, Supplier, PurchaseOrder, Customer, Promotion, Invoice,
  Reservation, DeliveryOrder, SubscriptionPlan, Permission, Notification,
  QRSession, Integration, SupportTicket, Employee, WorkflowRule, MarketplaceModule,
  SaaSMetric, ProductVariant,
} from '@/types/demo'
import { DEMO_TENANT_ID } from '@/lib/config'

const T = DEMO_TENANT_ID

export const DEMO_VARIANTS: ProductVariant[] = [
  { id: 'v1', product_id: 'p1', name: 'Sencillo', price_modifier: 0, is_active: true },
  { id: 'v2', product_id: 'p1', name: 'Doble', price_modifier: 25, is_active: true },
  { id: 'v3', product_id: 'p1', name: 'Triple', price_modifier: 45, is_active: true },
  { id: 'v4', product_id: 'p11', name: 'Clásica', price_modifier: 0, is_active: true },
  { id: 'v5', product_id: 'p11', name: 'Frozen', price_modifier: 15, is_active: true },
]

export const DEMO_INGREDIENTS: Ingredient[] = [
  { id: '00000000-0000-0000-0000-000000000501', tenant_id: T, name: 'Tortilla de maíz', unit: 'pza', stock: 450, min_stock: 100, cost: 0.8 },
  { id: '00000000-0000-0000-0000-000000000502', tenant_id: T, name: 'Carne al pastor', unit: 'kg', stock: 12, min_stock: 5, cost: 180 },
  { id: '00000000-0000-0000-0000-000000000503', tenant_id: T, name: 'Aguacate', unit: 'kg', stock: 8, min_stock: 3, cost: 95 },
  { id: '00000000-0000-0000-0000-000000000504', tenant_id: T, name: 'Tequila reposado', unit: 'L', stock: 4, min_stock: 2, cost: 320 },
  { id: '00000000-0000-0000-0000-000000000505', tenant_id: T, name: 'Cerveza corona', unit: 'pza', stock: 48, min_stock: 24, cost: 18 },
  { id: '00000000-0000-0000-0000-000000000506', tenant_id: T, name: 'Limón', unit: 'kg', stock: 2, min_stock: 5, cost: 25 },
  { id: '00000000-0000-0000-0000-000000000507', tenant_id: T, name: 'Queso Oaxaca', unit: 'kg', stock: 6, min_stock: 2, cost: 140 },
  { id: '00000000-0000-0000-0000-000000000508', tenant_id: T, name: 'Arroz', unit: 'kg', stock: 15, min_stock: 5, cost: 28 },
]

export const DEMO_SUPPLIERS: Supplier[] = [
  { id: 'sup1', tenant_id: T, name: 'Distribuidora La Central', contact: 'Roberto Díaz', phone: '55 1111 2222', email: 'ventas@lacentral.mx', is_active: true },
  { id: 'sup2', tenant_id: T, name: 'Carnes Premium MX', contact: 'Ana Morales', phone: '55 3333 4444', email: 'pedidos@carnespremium.mx', is_active: true },
  { id: 'sup3', tenant_id: T, name: 'Bebidas del Norte', contact: 'Luis Vega', phone: '55 5555 6666', email: 'info@bebidasnorte.mx', is_active: true },
]

export const DEMO_PURCHASES: PurchaseOrder[] = [
  { id: 'po1', tenant_id: T, supplier_id: 'sup2', supplier_name: 'Carnes Premium MX', total: 5400, status: 'recibida', created_at: '2026-06-08T10:00:00Z' },
  { id: 'po2', tenant_id: T, supplier_id: 'sup3', supplier_name: 'Bebidas del Norte', total: 2200, status: 'pendiente', created_at: '2026-06-10T14:30:00Z' },
  { id: 'po3', tenant_id: T, supplier_id: 'sup1', supplier_name: 'Distribuidora La Central', total: 1800, status: 'parcial', created_at: '2026-06-09T09:15:00Z' },
]

export const DEMO_CUSTOMERS: Customer[] = [
  { id: 'c1', tenant_id: T, name: 'María González', email: 'maria@email.com', phone: '55 9876 5432', visits: 24, points: 480, total_spent: 12400, segment: 'vip', created_at: '2025-11-01' },
  { id: 'c2', tenant_id: T, name: 'Carlos Ruiz', email: 'carlos@email.com', phone: '55 8765 4321', visits: 8, points: 120, total_spent: 3200, segment: 'frecuente', created_at: '2026-01-15' },
  { id: 'c3', tenant_id: T, name: 'Laura Méndez', phone: '55 7654 3210', visits: 1, points: 20, total_spent: 485, segment: 'nuevo', created_at: '2026-06-10' },
  { id: 'c4', tenant_id: T, name: 'Jorge Herrera', email: 'jorge@email.com', phone: '55 6543 2109', visits: 15, points: 310, total_spent: 7800, segment: 'frecuente', created_at: '2025-08-20' },
]

export const DEMO_PROMOTIONS: Promotion[] = [
  { id: 'pr1', tenant_id: T, name: '2x1 Tacos Martes', type: '2x1', value: 0, active: true, schedule: 'Martes 14:00-20:00' },
  { id: 'pr2', tenant_id: T, name: 'Combo Familiar', type: 'combo', value: 15, active: true },
  { id: 'pr3', tenant_id: T, name: 'Happy Hour Cocteles', type: 'happy_hour', value: 20, active: true, schedule: 'Lun-Vie 17:00-19:00' },
  { id: 'pr4', tenant_id: T, name: '10% Clientes VIP', type: 'porcentaje', value: 10, active: true },
]

export const DEMO_INVOICES: Invoice[] = [
  { id: 'inv1', tenant_id: T, folio: 'FAC-2026-000142', order_folio: 'ORD-20260610-0089', rfc: 'GOML850101ABC', razon_social: 'María González', uso_cfdi: 'G03', subtotal: 1068.97, tax: 171.03, total: 1240, status: 'timbrada', uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', created_at: '2026-06-10T21:30:00Z', stamped_at: '2026-06-10T21:31:00Z' },
  { id: 'inv2', tenant_id: T, folio: 'FAC-2026-000143', order_folio: 'ORD-20260611-0001', rfc: 'RUZC900215XYZ', razon_social: 'Carlos Ruiz', uso_cfdi: 'G03', subtotal: 418.1, tax: 66.9, total: 485, status: 'timbrada', uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', created_at: '2026-06-11T14:15:00Z', stamped_at: '2026-06-11T14:16:00Z' },
  { id: 'inv3', tenant_id: T, folio: 'FAC-2026-000144', order_folio: 'ORD-20260611-0005', rfc: 'PENDIENTE', uso_cfdi: 'G03', subtotal: 275.86, tax: 44.14, total: 320, status: 'pendiente', created_at: '2026-06-11T16:00:00Z' },
]

const _today = new Date().toISOString().slice(0, 10)
const _tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })()

export const DEMO_RESERVATIONS: Reservation[] = [
  { id: 'res1', tenant_id: T, customer_name: 'Familia Pérez', guests: 6, date: _today, time: '20:00', table_number: 3, status: 'confirmada', created_at: new Date().toISOString() },
  { id: 'res2', tenant_id: T, customer_name: 'Ana Torres', guests: 2, date: _today, time: '21:30', table_number: 12, status: 'confirmada', created_at: new Date().toISOString() },
  { id: 'res3', tenant_id: T, customer_name: 'Grupo Empresarial', guests: 10, date: _tomorrow, time: '13:00', status: 'pendiente', created_at: new Date().toISOString() },
]

export const DEMO_DELIVERIES: DeliveryOrder[] = [
  { id: 'del1', tenant_id: T, customer_name: 'Pedro Sánchez', address: 'Calle Reforma 45, Col. Centro', total: 385, status: 'en_camino', driver: 'Miguel R.', created_at: '2026-06-11T15:00:00Z' },
  { id: 'del2', tenant_id: T, customer_name: 'Sofía López', address: 'Av. Insurgentes 890, Del Valle', total: 520, status: 'preparando', created_at: '2026-06-11T15:30:00Z' },
  { id: 'del3', tenant_id: T, customer_name: 'Roberto Díaz', address: 'Calle Juárez 12, Roma Norte', total: 290, status: 'entregado', driver: 'Miguel R.', created_at: '2026-06-11T13:00:00Z' },
]

export const DEMO_PLANS: SubscriptionPlan[] = [
  { id: 'plan1', name: 'basico', price: 990, max_users: 5, max_branches: 1, max_tables: 20, max_products: 50, features: ['POS', 'Mesas', 'Cocina', 'Reportes básicos'] },
  { id: 'plan2', name: 'profesional', price: 2490, max_users: 20, max_branches: 5, max_tables: 50, max_products: 200, features: ['Todo Básico', 'Inventario', 'CRM', 'QR Comensal', 'IA Copiloto', 'Multi sucursal'] },
  { id: 'plan3', name: 'enterprise', price: 4990, max_users: 100, max_branches: 50, max_tables: 500, max_products: 5000, features: ['Todo Profesional', 'CFDI', 'Franquicias', 'API', 'BI Avanzado', 'IA-Support', 'White Label'] },
]

export const DEMO_PERMISSIONS: Permission[] = [
  { id: 'perm1', module: 'Ventas / POS', create: true, read: true, update: true, delete: false, authorize: true },
  { id: 'perm2', module: 'Inventario', create: true, read: true, update: true, delete: false, authorize: true },
  { id: 'perm3', module: 'Clientes / CRM', create: true, read: true, update: true, delete: false, authorize: false },
  { id: 'perm4', module: 'Facturación CFDI', create: false, read: true, update: false, delete: false, authorize: true },
  { id: 'perm5', module: 'Reportes', create: false, read: true, update: false, delete: false, authorize: false },
  { id: 'perm6', module: 'Configuración', create: true, read: true, update: true, delete: true, authorize: true },
]

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', tenant_id: T, channel: 'push', title: 'Pedido listo — Mesa 5', message: 'Tacos de Pastor + Guacamole listos para servir', status: 'enviada', created_at: '2026-06-11T15:45:00Z' },
  { id: 'n2', tenant_id: T, channel: 'whatsapp', title: 'Reserva confirmada', message: 'Familia Pérez — 6 personas a las 20:00', status: 'enviada', created_at: '2026-06-11T10:00:00Z' },
  { id: 'n3', tenant_id: T, channel: 'interno', title: 'Stock bajo: Limón', message: 'Existencia: 2 kg — Mínimo: 5 kg', status: 'pendiente', created_at: '2026-06-11T14:00:00Z' },
]

export const DEMO_QR_SESSIONS: QRSession[] = [
  { id: 'qr1', table_number: 5, area: 'Salón Principal', waiter: 'Mesero Demo', status: 'activa', expires_at: '2026-06-11T22:00:00Z' },
  { id: 'qr2', table_number: 12, area: 'Terraza', waiter: 'Mesero Demo', status: 'activa', expires_at: '2026-06-11T21:30:00Z' },
  { id: 'qr3', table_number: 3, area: 'Salón Principal', waiter: 'Mesero Demo', status: 'cerrada', expires_at: '2026-06-10T23:00:00Z' },
]

export const DEMO_INTEGRATIONS: Integration[] = [
  { id: 'int1', name: 'WhatsApp Business', category: 'Comunicación', status: 'disponible', icon: '💬' },
  { id: 'int2', name: 'Stripe', category: 'Pagos', status: 'disponible', icon: '💳' },
  { id: 'int3', name: 'Mercado Pago', category: 'Pagos', status: 'disponible', icon: '🛒' },
  { id: 'int4', name: 'PAC Facturación CFDI', category: 'Facturación', status: 'disponible', icon: '📄' },
  { id: 'int5', name: 'Uber Eats', category: 'Delivery', status: 'próximamente', icon: '🛵' },
  { id: 'int6', name: 'Rappi', category: 'Delivery', status: 'próximamente', icon: '🏍️' },
  { id: 'int7', name: 'Impresora Térmica ESC/POS', category: 'Hardware', status: 'conectado', icon: '🖨️' },
]

export const DEMO_TICKETS: SupportTicket[] = [
  { id: 'tk1', tenant_id: T, subject: 'Configurar impresora de cocina', priority: 'media', status: 'en_progreso', created_at: '2026-06-10T11:00:00Z' },
  { id: 'tk2', tenant_id: T, subject: 'Duda sobre facturación CFDI', priority: 'baja', status: 'abierto', created_at: '2026-06-11T09:30:00Z' },
]

export const DEMO_EMPLOYEES: Employee[] = [
  { id: 'emp1', tenant_id: T, full_name: 'Mesero Demo', role: 'mesero', shift: 'Matutino', attendance: 'presente', hours_week: 40 },
  { id: 'emp2', tenant_id: T, full_name: 'Cocina Demo', role: 'cocina', shift: 'Matutino', attendance: 'presente', hours_week: 44 },
  { id: 'emp3', tenant_id: T, full_name: 'Cajero Demo', role: 'cajero', shift: 'Vespertino', attendance: 'presente', hours_week: 40 },
  { id: 'emp4', tenant_id: T, full_name: 'Sofía Ramírez', role: 'supervisor', shift: 'Matutino', attendance: 'retardo', hours_week: 42 },
]

export const DEMO_WORKFLOWS: WorkflowRule[] = [
  { id: 'wf1', name: 'Inventario bajo → Notificar gerente', trigger: 'stock < mínimo', condition: 'ingrediente activo', action: 'Enviar notificación push', active: true },
  { id: 'wf2', name: 'Venta > $2,000 → Autorización', trigger: 'venta completada', condition: 'total > 2000', action: 'Solicitar autorización supervisor', active: true },
  { id: 'wf3', name: 'Cliente VIP llega → Alerta mesero', trigger: 'check-in cliente', condition: 'segmento = vip', action: 'Notificar mesero asignado', active: true },
]

export const DEMO_MARKETPLACE: MarketplaceModule[] = [
  { id: 'mp1', name: 'WhatsApp Notificaciones', author: 'IA·RESTAURANT', price: 299, category: 'Comunicación', installed: false },
  { id: 'mp2', name: 'BI Avanzado Pro', author: 'IA·RESTAURANT', price: 599, category: 'Analítica', installed: false },
  { id: 'mp3', name: 'Delivery Hub', author: 'Partner MX', price: 449, category: 'Delivery', installed: false },
  { id: 'mp4', name: 'IA-Support Premium', author: 'IA·RESTAURANT', price: 799, category: 'Inteligencia Artificial', installed: true },
]

export const DEMO_SAAS_METRICS: SaaSMetric[] = [
  { label: 'MRR', value: '$48,200', trend: '+12%' },
  { label: 'ARR', value: '$578,400', trend: '+12%' },
  { label: 'Restaurantes activos', value: '127', trend: '+8' },
  { label: 'Churn mensual', value: '2.1%', trend: '-0.3%' },
  { label: 'LTV', value: '$14,800', trend: '+5%' },
  { label: 'CAC', value: '$1,200', trend: '-8%' },
]

export const DEMO_AUDIT_LOGS = [
  { id: 'a1', user: 'Alfonso', action: 'INSERT', table: 'orders', detail: 'ORD-20260611-0001 — $485', time: '2026-06-11 14:12' },
  { id: 'a2', user: 'Cajero Demo', action: 'UPDATE', table: 'cash_registers', detail: 'Apertura caja — $2,000', time: '2026-06-11 08:00' },
  { id: 'a3', user: 'Mesero Demo', action: 'UPDATE', table: 'tables', detail: 'Mesa 5 → Ocupada', time: '2026-06-11 14:00' },
  { id: 'a4', user: 'Cocina Demo', action: 'UPDATE', table: 'order_items', detail: 'Tacos Pastor → Listo', time: '2026-06-11 14:25' },
  { id: 'a5', user: 'Alfonso', action: 'UPDATE', table: 'products', detail: 'Churros → Inactivo', time: '2026-06-10 18:30' },
]

export const PRODUCTION_CENTERS = [
  { id: 'cocina_caliente', label: 'Cocina Caliente', color: '#F97316', products: ['Tacos', 'Platillos', 'Entradas'] },
  { id: 'cocina_fria', label: 'Cocina Fría', color: '#22C55E', products: ['Ensaladas', 'Entradas frías'] },
  { id: 'barra', label: 'Barra', color: '#8B5CF6', products: ['Cocteles', 'Bebidas', 'Cerveza'] },
  { id: 'cafeteria', label: 'Cafetería', color: '#92400E', products: ['Café', 'Té'] },
  { id: 'postres', label: 'Postres', color: '#EC4899', products: ['Postres'] },
]
