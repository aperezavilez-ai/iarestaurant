import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SEED_STAFF } from '@/data/seed'
import type { User } from '@/types'

interface StaffState {
  staff: User[]
  hydrate: (users: User[]) => void
  addLocal: (user: User) => void
  removeLocal: (id: string) => void
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      staff: [...SEED_STAFF],

      hydrate: (users) => {
        if (users.length) set({ staff: users })
      },

      addLocal: (user) => set({ staff: [...get().staff, user] }),

      removeLocal: (id) => set({ staff: get().staff.filter((u) => u.id !== id) }),
    }),
    { name: 'ia-restaurant-staff', storage: createJSONStorage(() => localStorage) }
  )
)
