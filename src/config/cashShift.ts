import type { UserRole } from '@/types'

/**
 * Roles operativos que deben abrir turno de caja antes de cobrar/POS.
 * admin_restaurant y admin_saas NO: entran a revisar, configurar y supervisar.
 */
export const SHIFT_REQUIRED_ROLES: UserRole[] = [
  'gerente',
  'supervisor',
  'cajero',
]

export function requiresCashShift(role?: UserRole): boolean {
  return !!role && SHIFT_REQUIRED_ROLES.includes(role)
}
