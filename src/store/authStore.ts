import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Tenant, Sucursal } from '@/types'
import type { AuthSession } from '@/repositories/authRepository'

interface AuthState {
  user: User | null
  tenant: Tenant | null
  sucursal: Sucursal | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setTenant: (tenant: Tenant | null) => void
  setSucursal: (sucursal: Sucursal | null) => void
  setSession: (session: AuthSession) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      sucursal: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTenant: (tenant) => set({ tenant }),
      setSucursal: (sucursal) => set({ sucursal }),
      setSession: ({ user, tenant, sucursal }) =>
        set({ user, tenant, sucursal, isAuthenticated: true }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({ user: null, tenant: null, sucursal: null, isAuthenticated: false }),
    }),
    {
      name: 'ia-restaurant-auth',
      partialize: (s) => ({ user: s.user, tenant: s.tenant, sucursal: s.sucursal, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) state.isAuthenticated = true
      },
    }
  )
)
