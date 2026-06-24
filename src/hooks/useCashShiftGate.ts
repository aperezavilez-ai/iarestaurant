import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useTenantContext } from '@/hooks/useTenantContext'
import { requiresCashShift } from '@/config/cashShift'
import { cashRepository } from '@/repositories/cashRepository'
import { onShiftChanged } from '@/lib/shiftEvents'
import type { CashRegister } from '@/types'

export function useCashShiftGate() {
  const ctx = useTenantContext()
  const userRole = useAuthStore((s) => s.user?.role)
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [stale, setStale] = useState(false)
  const [checking, setChecking] = useState(true)
  const mountedRef = useRef(true)

  const mustOpenShift = requiresCashShift(userRole)

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!ctx || !mustOpenShift) {
      setRegister(null)
      setStale(false)
      setChecking(false)
      return null
    }
    if (!options?.silent) setChecking(true)
    try {
      const state = await cashRepository.getActiveShift(ctx)
      if (!mountedRef.current) return state.register
      setRegister(state.register)
      setStale(state.stale)
      return state.register
    } finally {
      if (mountedRef.current) setChecking(false)
    }
  }, [ctx, mustOpenShift])

  useEffect(() => {
    mountedRef.current = true
    refresh()
    return () => { mountedRef.current = false }
  }, [refresh])

  useEffect(() => {
    const onFocus = () => { void refresh({ silent: true }) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  useEffect(() => onShiftChanged(() => { void refresh({ silent: true }) }), [refresh])

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
