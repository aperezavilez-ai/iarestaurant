import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { tableService } from '@/services/tableService'
import { localDb } from '@/lib/localDb'
import { opsBroadcast } from '@/services/opsBroadcast'
import { inventoryRepository } from '@/repositories/inventoryRepository'
import { crmRepository } from '@/repositories/crmRepository'
import { whatsappService } from '@/services/whatsappService'
import { emailService } from '@/services/emailService'
import { withLocalFirst, withHybridList } from './base'
import { isSupabaseConfigured } from '@/lib/config'
import { generateFolio } from '@/lib/utils'
import { TAX_RATE } from '@/data/constants'
import { buildEqualSplitParts, buildItemSplitParts, allPartsPaid, validateItemSplit, type ItemSplitInput } from '@/lib/splitBill'
import type { OrderSplitMode } from '@/types'
import type { Order, OrderItem, Payment, PaymentMethod, RestaurantTable } from '@/types'
import type { TenantContext } from '@/types/context'

export type SplitBillInput =
  | { mode: 'equal'; labels: string[] }
  | { mode: 'items'; parts: ItemSplitInput[] }

async function resolveTableCustomer(ctx: TenantContext, tableId?: string) {
  if (!tableId) return { customerId: undefined as string | undefined, customerName: undefined as string | undefined }
  const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
  const table = tables.find(t => t.id === tableId)
  if (!table?.customer_id) return { customerId: undefined, customerName: undefined }
  return { customerId: table.customer_id, customerName: table.customer_name }
}

function freeTable(table: RestaurantTable): RestaurantTable {
  return {
    ...table,
    status: 'libre',
    current_order_id: undefined,
    opened_at: undefined,
    customer_id: undefined,
    customer_name: undefined,
  }
}

function notifyPaymentComplete(ctx: TenantContext, folio: string, total: number) {
  void whatsappService.sendAlert(ctx, {
    type: 'payment_complete',
    title: 'Cobro registrado',
    message: `${folio} — $${total.toFixed(2)} MXN`,
  }).catch(() => {})
  void emailService.sendAlert(ctx, {
    type: 'payment_complete',
    title: 'Cobro registrado',
    message: `${folio} — $${total.toFixed(2)} MXN`,
  }).catch(() => {})
}

function buildPaymentsForAmount(
  orderId: string,
  tenantId: string,
  amount: number,
  method: PaymentMethod,
  now: string,
  options?: {
    cashReceived?: number
    mixedCash?: number
    mixedCard?: number
    reference?: string
  }
): Payment[] {
  if (method === 'mixto' && options?.mixedCash != null && options?.mixedCard != null) {
    return [
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: tenantId,
        method: 'efectivo',
        amount: options.mixedCash,
        created_at: now,
        reference: options.reference ? `${options.reference}:efectivo` : 'mixto-efectivo',
      },
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: tenantId,
        method: 'tarjeta',
        amount: options.mixedCard,
        created_at: now,
        reference: options.reference ? `${options.reference}:tarjeta` : 'mixto-tarjeta',
      },
    ]
  }
  const change =
    method === 'efectivo' && options?.cashReceived
      ? Math.max(0, options.cashReceived - amount)
      : 0
  return [
    {
      id: crypto.randomUUID(),
      order_id: orderId,
      tenant_id: tenantId,
      method,
      amount,
      change_amount: change,
      created_at: now,
      reference: options?.reference,
    },
  ]
}

async function pushOrderRemote(
  order: Order,
  items: OrderItem[],
  payments?: Payment[],
  tablePatch?: RestaurantTable
) {
  if (!isSupabaseConfigured()) return
  try {
    await orderService.createOrder(order, items)
    if (payments) {
      for (const p of payments) await paymentService.createPayment(p)
    }
    if (tablePatch) {
      await tableService.updateTableStatus(
        tablePatch.id,
        tablePatch.status,
        tablePatch.current_order_id
      )
    }
  } catch {
    await localDb.enqueueSync({ table: 'orders', operation: 'insert', payload: order as never })
    for (const item of items) {
      await localDb.enqueueSync({ table: 'order_items', operation: 'insert', payload: item as never })
    }
    if (payments) {
      for (const p of payments) {
        await localDb.enqueueSync({ table: 'payments', operation: 'insert', payload: p as never })
      }
    }
  }
}

export interface CartLine {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  notes?: string
}

export const orderRepository = {
  async getActiveOrders(ctx: TenantContext): Promise<Order[]> {
    const orders = await withHybridList(
      () => localDb.getActiveOrders(ctx.tenantId, ctx.sucursalId),
      () => orderService.getActiveOrders(ctx.tenantId, ctx.sucursalId)
    )
    return orders.filter((o) => o.status !== 'cobrada' && o.status !== 'cancelada')
  },

  async getAllOrders(ctx: TenantContext): Promise<Order[]> {
    return withHybridList(
      () => localDb.getOrders(ctx.tenantId, ctx.sucursalId),
      () => orderService.getOrderHistory(ctx.tenantId, ctx.sucursalId, 200)
    )
  },

  async createOrderWithPayment(
    ctx: TenantContext,
    lines: CartLine[],
    method: PaymentMethod,
    options?: {
      cashReceived?: number
      tableId?: string
      discount?: number
      guests?: number
      mixedCash?: number
      mixedCard?: number
      promoCode?: string
      customerId?: string
      customerName?: string
    }
  ): Promise<{ order: Order; payment: Payment; payments?: Payment[] }> {
    const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)
    const discount = Math.min(subtotal, options?.discount ?? 0)
    const taxRate = ctx.taxRate ?? TAX_RATE
    const taxable = Math.max(0, subtotal - discount)
    const tax = taxable * taxRate
    const total = taxable + tax
    const folio = generateFolio()
    const orderId = crypto.randomUUID()
    const now = new Date().toISOString()
    const tableCustomer = await resolveTableCustomer(ctx, options?.tableId)
    const customerId = options?.customerId || tableCustomer.customerId
    const customerName = options?.customerName || tableCustomer.customerName

    const order: Order = {
      id: orderId,
      tenant_id: ctx.tenantId,
      sucursal_id: ctx.sucursalId,
      table_id: options?.tableId,
      folio,
      status: 'cobrada',
      cashier_id: ctx.userId,
      customer_id: customerId,
      customer_name: customerName,
      subtotal,
      tax,
      discount,
      total,
      guests: options?.guests ?? 1,
      notes: options?.promoCode ? `Promo: ${options.promoCode}` : undefined,
      created_at: now,
      updated_at: now,
    }

    const items: OrderItem[] = lines.map((l) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: l.product_id,
      product_name: l.product_name,
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.unit_price * l.quantity,
      notes: l.notes,
      status: 'entregado' as const,
    }))

    const change = method === 'efectivo' && options?.cashReceived
      ? Math.max(0, options.cashReceived - total)
      : 0

    const payments: Payment[] = []

    if (method === 'mixto' && options?.mixedCash != null && options?.mixedCard != null) {
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method: 'efectivo',
        amount: options.mixedCash,
        created_at: now,
        reference: 'mixto-efectivo',
      })
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method: 'tarjeta',
        amount: options.mixedCard,
        created_at: now,
        reference: 'mixto-tarjeta',
      })
    } else {
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method,
        amount: total,
        change_amount: change,
        created_at: now,
      })
    }

    const payment = payments[0]

    await localDb.saveOrder({ ...order, items }, items)
    for (const p of payments) await localDb.savePayment(p)
    await inventoryRepository.deductForOrder(ctx, lines, folio)
    if (customerId) await crmRepository.recordSale(ctx, customerId, total)
    notifyPaymentComplete(ctx, folio, total)
    opsBroadcast.notify()

    if (options?.tableId) {
      const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
      const table = tables.find(t => t.id === options.tableId)
      if (table) {
        const freed = freeTable(table)
        await localDb.updateTable(freed)
        await pushOrderRemote(order, items, payments, freed)
      } else {
        await pushOrderRemote(order, items, payments)
      }
    } else {
      await pushOrderRemote(order, items, payments)
    }

    return { order: { ...order, items }, payment, payments }
  },

  async completeOrderPayment(
    ctx: TenantContext,
    orderId: string,
    method: PaymentMethod,
    options?: {
      cashReceived?: number
      mixedCash?: number
      mixedCard?: number
      discount?: number
      customerId?: string
    }
  ): Promise<{ order: Order; payment: Payment; payments?: Payment[] }> {
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const found = orders.find(o => o.id === orderId)
    if (!found) throw new Error('Orden no encontrada')
    if (found.status === 'cobrada') throw new Error('Esta orden ya fue cobrada')
    if (found.status === 'cancelada') throw new Error('Esta orden está cancelada')
    if (found.split_config?.parts?.length) {
      throw new Error('Cuenta dividida: cobra cada parte por separado desde Mesas o POS')
    }

    const discount = Math.min(found.subtotal, options?.discount ?? found.discount ?? 0)
    const total = found.total
    const now = new Date().toISOString()
    const effectiveCustomerId = options?.customerId || found.customer_id

    const order: Order = {
      ...found,
      status: 'cobrada',
      cashier_id: ctx.userId,
      customer_id: effectiveCustomerId || found.customer_id,
      discount,
      total,
      updated_at: now,
    }

    const change = method === 'efectivo' && options?.cashReceived
      ? Math.max(0, options.cashReceived - total)
      : 0

    const payments: Payment[] = []

    if (method === 'mixto' && options?.mixedCash != null && options?.mixedCard != null) {
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method: 'efectivo',
        amount: options.mixedCash,
        created_at: now,
        reference: 'mixto-efectivo',
      })
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method: 'tarjeta',
        amount: options.mixedCard,
        created_at: now,
        reference: 'mixto-tarjeta',
      })
    } else {
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method,
        amount: total,
        change_amount: change,
        created_at: now,
      })
    }

    const payment = payments[0]
    const items = found.items || []

    await localDb.updateOrder(order)
    for (const p of payments) await localDb.savePayment(p)
    opsBroadcast.notify()

    let tablePatch: RestaurantTable | undefined
    if (order.table_id) {
      const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
      const table = tables.find(t => t.id === order.table_id)
      if (table) {
        tablePatch = freeTable(table)
        await localDb.updateTable(tablePatch)
        opsBroadcast.notify()
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await orderService.updateOrderStatus(orderId, 'cobrada')
        for (const p of payments) await paymentService.createPayment(p)
        if (tablePatch) {
          await tableService.updateTableStatus(tablePatch.id, tablePatch.status, undefined)
        }
      } catch {
        await localDb.enqueueSync({ table: 'orders', operation: 'update', payload: order as never })
        for (const p of payments) {
          await localDb.enqueueSync({ table: 'payments', operation: 'insert', payload: p as never })
        }
      }
    }

    if (options?.customerId) {
      await crmRepository.recordSale(ctx, options.customerId, total)
    } else if (found.customer_id) {
      await crmRepository.recordSale(ctx, found.customer_id, total)
    }
    notifyPaymentComplete(ctx, order.folio, total)

    return { order: { ...order, items }, payment, payments }
  },

  async sendToKitchen(ctx: TenantContext, lines: CartLine[], tableId?: string, customerId?: string): Promise<Order> {
    const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)
    const taxRate = ctx.taxRate ?? TAX_RATE
    const tax = subtotal * taxRate
    const total = subtotal + tax
    const orderId = crypto.randomUUID()
    const now = new Date().toISOString()
    const tableCustomer = await resolveTableCustomer(ctx, tableId)
    const resolvedCustomerId = customerId || tableCustomer.customerId

    const order: Order = {
      id: orderId,
      tenant_id: ctx.tenantId,
      sucursal_id: ctx.sucursalId,
      table_id: tableId,
      folio: generateFolio(),
      status: 'en_preparacion',
      waiter_id: ctx.userId,
      customer_id: resolvedCustomerId,
      customer_name: resolvedCustomerId ? tableCustomer.customerName : undefined,
      subtotal,
      tax,
      discount: 0,
      total,
      guests: 1,
      created_at: now,
      updated_at: now,
    }

    const items: OrderItem[] = lines.map((l) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: l.product_id,
      product_name: l.product_name,
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.unit_price * l.quantity,
      notes: l.notes,
      status: 'pendiente' as const,
    }))

    await localDb.saveOrder({ ...order, items }, items)
    await inventoryRepository.deductForOrder(ctx, lines, order.folio)
    opsBroadcast.notify()

    let tablePatch: RestaurantTable | undefined
    if (tableId) {
      const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
      const table = tables.find((t) => t.id === tableId)
      if (table) {
        tablePatch = {
          ...table,
          status: 'ocupada',
          current_order_id: orderId,
          opened_at: table.opened_at || now,
        }
        await localDb.updateTable(tablePatch)
        opsBroadcast.notify()
      }
    }

    await pushOrderRemote(order, items, undefined, tablePatch)

    return { ...order, items }
  },

  async addItemsToTableAccount(
    ctx: TenantContext,
    tableId: string,
    lines: CartLine[],
  ): Promise<Order> {
    const table = (await localDb.getTables(ctx.tenantId, ctx.sucursalId)).find((t) => t.id === tableId)
    if (!table) throw new Error('Mesa no encontrada')
    if (!lines.length) throw new Error('No hay productos para agregar')

    const activeOrders = await localDb.getActiveOrders(ctx.tenantId, ctx.sucursalId)
    const baseOrder = activeOrders
      .filter((o) => o.table_id === tableId && o.status !== 'cobrada' && o.status !== 'cancelada')
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0]

    if (!baseOrder) {
      const created = await this.sendToKitchen(ctx, lines, tableId, table.customer_id)
      return created
    }

    const now = new Date().toISOString()
    const newItems: OrderItem[] = lines.map((l) => ({
      id: crypto.randomUUID(),
      order_id: baseOrder.id,
      product_id: l.product_id,
      product_name: l.product_name,
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.unit_price * l.quantity,
      notes: l.notes,
      status: 'listo',
    }))

    for (const item of newItems) await localDb.updateOrderItem(item)

    const mergedItems = [...(baseOrder.items || []), ...newItems]
    const subtotal = mergedItems.reduce((s, i) => s + i.subtotal, 0)
    const discount = baseOrder.discount || 0
    const taxable = Math.max(0, subtotal - discount)
    const tax = taxable * (ctx.taxRate ?? TAX_RATE)
    const total = taxable + tax

    const updated: Order = {
      ...baseOrder,
      subtotal,
      tax,
      total,
      items: mergedItems,
      updated_at: now,
    }

    await localDb.updateOrder(updated)
    await inventoryRepository.deductForOrder(ctx, lines, updated.folio)

    const tablePatch: RestaurantTable = {
      ...table,
      status: 'ocupada',
      current_order_id: updated.id,
      opened_at: table.opened_at || now,
    }
    await localDb.updateTable(tablePatch)
    opsBroadcast.notify()

    if (isSupabaseConfigured()) {
      try {
        await orderService.insertOrderItems(newItems)
        await orderService.updateOrderTotals(updated.id, {
          subtotal: updated.subtotal,
          tax: updated.tax,
          discount: updated.discount,
          total: updated.total,
          updated_at: updated.updated_at,
        })
        await tableService.updateTableStatus(tablePatch.id, tablePatch.status, tablePatch.current_order_id)
      } catch {
        for (const item of newItems) {
          await localDb.enqueueSync({ table: 'order_items', operation: 'insert', payload: item as never })
        }
        await localDb.enqueueSync({ table: 'orders', operation: 'update', payload: updated as never })
      }
    }

    return updated
  },

  async updateItemStatus(itemId: string, status: OrderItem['status']): Promise<void> {
    const item = await localDb.findOrderItem(itemId)
    if (!item) return
    const updated = { ...item, status }
    await localDb.updateOrderItem(updated)
    opsBroadcast.notify()
    try {
      await orderService.updateItemStatus(itemId, status)
    } catch { /* sync */ }
  },

  async getOrder(ctx: TenantContext, orderId: string): Promise<Order | null> {
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    return orders.find((o) => o.id === orderId) ?? null
  },

  async setupSplitBill(ctx: TenantContext, orderId: string, input: SplitBillInput): Promise<Order> {
    const order = await this.getOrder(ctx, orderId)
    if (!order) throw new Error('Orden no encontrada')
    if (order.status === 'cobrada') throw new Error('Orden ya cobrada')

    let parts
    let mode: OrderSplitMode

    if (input.mode === 'equal') {
      if (input.labels.length < 2) throw new Error('Indica al menos 2 comensales')
      parts = buildEqualSplitParts(order.total, input.labels)
      mode = 'equal'
    } else {
      const items = order.items || []
      const err = validateItemSplit(items, input.parts)
      if (err) throw new Error(err)
      parts = buildItemSplitParts(order, input.parts)
      mode = 'items'
    }

    const now = new Date().toISOString()
    const updated: Order = {
      ...order,
      status: 'cobro_parcial',
      split_config: { mode, parts, created_at: now },
      updated_at: now,
    }

    await localDb.updateOrder(updated)
    opsBroadcast.notify()

    if (order.table_id) {
      const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
      const table = tables.find((t) => t.id === order.table_id)
      if (table) {
        const patched = { ...table, status: 'cobro_pendiente' as const }
        await localDb.updateTable(patched)
        try {
          await tableService.updateTableStatus(patched.id, 'cobro_pendiente', table.current_order_id)
        } catch {
          /* sync */
        }
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await orderService.updateOrderPatch(orderId, {
          status: 'cobro_parcial',
          split_config: updated.split_config,
          updated_at: now,
        })
      } catch {
        await localDb.enqueueSync({ table: 'orders', operation: 'update', payload: updated as never })
      }
    }

    return updated
  },

  async paySplitPart(
    ctx: TenantContext,
    orderId: string,
    partId: string,
    method: PaymentMethod,
    options?: {
      cashReceived?: number
      mixedCash?: number
      mixedCard?: number
      customerId?: string
    }
  ): Promise<{ order: Order; payment: Payment; payments: Payment[]; completed: boolean }> {
    const order = await this.getOrder(ctx, orderId)
    if (!order?.split_config?.parts?.length) {
      throw new Error('Esta orden no tiene cuenta dividida')
    }

    const part = order.split_config.parts.find((p) => p.id === partId)
    if (!part) throw new Error('Parte no encontrada')
    if (part.paid_at) throw new Error(`${part.label} ya fue cobrada`)

    const now = new Date().toISOString()
    const payments = buildPaymentsForAmount(
      orderId,
      ctx.tenantId,
      part.amount,
      method,
      now,
      {
        cashReceived: options?.cashReceived,
        mixedCash: options?.mixedCash,
        mixedCard: options?.mixedCard,
        reference: `split:${partId}`,
      }
    )

    const updatedParts = order.split_config.parts.map((p) =>
      p.id === partId ? { ...p, paid_at: now } : p
    )
    const completed = allPartsPaid(updatedParts)

    const updated: Order = {
      ...order,
      status: completed ? 'cobrada' : 'cobro_parcial',
      cashier_id: completed ? ctx.userId : order.cashier_id,
      split_config: completed ? null : { ...order.split_config, parts: updatedParts },
      updated_at: now,
    }

    for (const p of payments) await localDb.savePayment(p)
    await localDb.updateOrder(updated)
    opsBroadcast.notify()

    let tablePatch: RestaurantTable | undefined
    if (completed && order.table_id) {
      const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
      const table = tables.find((t) => t.id === order.table_id)
      if (table) {
        tablePatch = freeTable(table)
        await localDb.updateTable(tablePatch)
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await orderService.updateOrderPatch(orderId, {
          status: updated.status,
          split_config: updated.split_config,
          cashier_id: updated.cashier_id,
          updated_at: now,
        })
        for (const p of payments) await paymentService.createPayment(p)
        if (tablePatch) {
          await tableService.updateTableStatus(tablePatch.id, tablePatch.status, undefined)
        }
      } catch {
        await localDb.enqueueSync({ table: 'orders', operation: 'update', payload: updated as never })
        for (const p of payments) {
          await localDb.enqueueSync({ table: 'payments', operation: 'insert', payload: p as never })
        }
      }
    }

    if (completed) {
      const customerId = options?.customerId || order.customer_id
      if (customerId) await crmRepository.recordSale(ctx, customerId, order.total)
      notifyPaymentComplete(ctx, order.folio, order.total)
    }

    return {
      order: updated,
      payment: payments[0],
      payments,
      completed,
    }
  },

  /** @deprecated Usar setupSplitBill */
  async splitBill(ctx: TenantContext, orderId: string, parts: number): Promise<{ perPerson: number; total: number }> {
    const order = await this.getOrder(ctx, orderId)
    if (!order) throw new Error('Orden no encontrada')
    const labels = Array.from({ length: parts }, (_, i) => `Persona ${i + 1}`)
    const built = buildEqualSplitParts(order.total, labels)
    const perPerson = built[0]?.amount ?? 0
    return { perPerson, total: order.total }
  },

  async updateOrderStatus(orderId: string, status: Order['status'], ctx?: TenantContext): Promise<void> {
    if (!ctx) return
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const updated = { ...order, status, updated_at: new Date().toISOString() }
    await localDb.updateOrder(updated)
    opsBroadcast.notify()
    try {
      await orderService.updateOrderStatus(orderId, status)
    } catch { /* sync */ }
  },
}
