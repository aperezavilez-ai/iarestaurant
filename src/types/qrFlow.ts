export type QROrderStatus =
  | 'enviado'
  | 'validado'
  | 'rechazado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'

export type ValidationMode = 'automatico' | 'validacion'

export interface QROrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export interface QROrder {
  id: string
  table_id: string
  table_number: number
  area: string
  waiter_id: string
  waiter_name: string
  items: QROrderItem[]
  status: QROrderStatus
  subtotal: number
  tax: number
  total: number
  folio: string
  kitchen_order_id?: string
  created_at: string
  validated_at?: string
  rejected_reason?: string
}

export type WaiterAlertType =
  | 'nuevo_pedido_qr'
  | 'pedido_validado'
  | 'pedido_listo'
  | 'solicitud_ayuda'
  | 'solicitud_cuenta'
  | 'solicitud_servicio'

export interface WaiterAlert {
  id: string
  type: WaiterAlertType
  table_number: number
  order_id?: string
  message: string
  read: boolean
  created_at: string
}
