import { userService } from '@/services/userService'
import { isSupabaseConfigured } from '@/lib/config'
import { useStaffStore } from '@/store/staffStore'
import type { User, UserRole } from '@/types'
import type { TenantContext } from '@/types/context'

export const userRepository = {
  async listStaff(ctx: TenantContext): Promise<User[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await userService.listByTenant(ctx.tenantId)
        if (remote.length) {
          useStaffStore.getState().hydrate(remote)
          return remote
        }
      } catch {
        /* fallback local */
      }
    }
    return useStaffStore.getState().staff
  },

  async createStaff(
    ctx: TenantContext,
    data: {
      email: string
      password: string
      full_name: string
      role: UserRole
      allowed_modules: string[]
    }
  ): Promise<User> {
    if (isSupabaseConfigured()) {
      const user = await userService.createStaff({
        ...data,
        sucursal_id: ctx.sucursalId,
      })
      useStaffStore.getState().hydrate(
        [...useStaffStore.getState().staff.filter((u) => u.id !== user.id), user]
      )
      return user
    }

    const user: User = {
      id: crypto.randomUUID(),
      tenant_id: ctx.tenantId,
      email: data.email.trim().toLowerCase(),
      full_name: data.full_name,
      role: data.role,
      sucursal_id: ctx.sucursalId,
      is_active: true,
      allowed_modules: data.allowed_modules,
      created_at: new Date().toISOString(),
    }
    useStaffStore.getState().addLocal(user)
    return user
  },

  async deleteStaff(ctx: TenantContext, userId: string, currentUserId: string): Promise<void> {
    if (userId === currentUserId) throw new Error('No puedes eliminar tu propia cuenta')

    if (isSupabaseConfigured()) {
      await userService.deleteStaff(userId)
    }
    useStaffStore.getState().removeLocal(userId)
  },
}
