import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useTenantContext } from '@/hooks/useTenantContext'
import { requiresCashShift } from '@/config/cashShift'
import { cashRepository } from '@/repositories/cashRepository'
import type { CashRegister } from '@/types'

export function useCashShiftGate() {
  const ctx = useTenantContext()
  const { user } = useAuthStore()
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [stale, setStale] = useState(false)
  const [checking, setChecking] = useState(true)

  const mustOpenShift = requiresCashShift(user?.role)

  const refresh = useCallback(async () => {
    if (!ctx || !mustOpenShift) {
      setRegister(null)
      setStale(false)
      setChecking(false)
      return null
    }
    setChecking(true)
    try {
      const state = await cashRepository.getActiveShift(ctx)
      setRegister(state.register)
      setStale(state.stale)
      return state.register
    } finally {
      setChecking(false)
    }
  }, [ctx, mustOpenShift])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const onFocus = () => { refresh() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const shiftOpen = !!register && !stale
  const blocked = mustOpenShift && !checking && !shiftOpen

  return {
    mustOpenShift,
    shiftOpen,
    blocked,
    stale,
    checking,
    register,
    refresh,
  }
}
