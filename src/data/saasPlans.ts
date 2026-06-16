export interface SaasPlan {
  id: 'basico' | 'profesional' | 'enterprise'
  label: string
  priceMxn: number
  period: string
  maxUsers: number
  maxBranches: number
  maxTables: number
  maxProducts: number
  maxDevices: number
  features: string[]
}

export const SAAS_PLANS: SaasPlan[] = [
  {
    id: 'basico',
    label: 'Básico',
    priceMxn: 990,
    period: 'mes',
    maxUsers: 5,
    maxBranches: 1,
    maxTables: 20,
    maxProducts: 50,
    maxDevices: 3,
    features: ['POS', 'Mesas', 'Cocina KDS', 'Reportes básicos'],
  },
  {
    id: 'profesional',
    label: 'Profesional',
    priceMxn: 2490,
    period: 'mes',
    maxUsers: 20,
    maxBranches: 5,
    maxTables: 50,
    maxProducts: 200,
    maxDevices: 8,
    features: ['Todo Básico', 'Inventario', 'CRM', 'Menú QR', 'Multi sucursal'],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    priceMxn: 4990,
    period: 'mes',
    maxUsers: 100,
    maxBranches: 50,
    maxTables: 500,
    maxProducts: 5000,
    maxDevices: 25,
    features: ['Todo Profesional', 'CFDI', 'Integraciones', 'API', 'Soporte prioritario'],
  },
]
