import { useEffect, useState } from 'react'
import { Plus, Users, Trash2, Loader2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { getRoleLabel } from '@/lib/utils'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useAuthStore } from '@/store/authStore'
import { userRepository } from '@/repositories/userRepository'
import { ALL_MODULES, getDefaultModuleIdsForRole } from '@/config/modules'
import { ASSIGNABLE_STAFF_ROLES, type User, type UserRole } from '@/types'
import { toast } from '@/components/ui/Toast'

const PROTECTED_ROLES = new Set(['admin_restaurant', 'admin_saas'])

export default function UsersPage() {
  const ctx = useTenantContext()
  const currentUser = useAuthStore((s) => s.user)
  const [staff, setStaff] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('cajero')
  const [modules, setModules] = useState<string[]>(getDefaultModuleIdsForRole('cajero'))

  const load = async () => {
    if (!ctx) return
    setLoading(true)
    try {
      const list = await userRepository.listStaff(ctx)
      setStaff(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [ctx])

  const onRoleChange = (next: UserRole) => {
    setRole(next)
    setModules(getDefaultModuleIdsForRole(next))
  }

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('cajero')
    setModules(getDefaultModuleIdsForRole('cajero'))
  }

  const handleCreate = async () => {
    if (!ctx || !fullName.trim() || !email.trim() || !password) {
      toast('Completa nombre, email y contraseña', 'error')
      return
    }
    if (modules.length === 0) {
      toast('Selecciona al menos un módulo', 'error')
      return
    }
    setSaving(true)
    try {
      await userRepository.createStaff(ctx, {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        allowed_modules: modules,
      })
      toast(`${fullName} dado de alta`, 'success')
      setShowCreate(false)
      resetForm()
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al crear usuario', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!ctx || !confirmDelete || !currentUser) return
    setDeletingId(confirmDelete.id)
    try {
      await userRepository.deleteStaff(ctx, confirmDelete.id, currentUser.id)
      toast(`${confirmDelete.full_name} eliminado`, 'success')
      setConfirmDelete(null)
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const moduleOptions = ALL_MODULES.filter((m) => m.roles.includes(role))

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><Users size={18} /></div>
              <h3 className="font-bold text-slate-800">Personal del restaurante</h3>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Nuevo usuario
            </Button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
            <Loader2 size={18} className="animate-spin" /> Cargando personal…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-command-border">
                <tr>
                  {['Nombre', 'Email', 'Rol', 'Estado', ''].map((h) => (
                    <th key={h || 'actions'} className="text-left px-5 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  const protectedUser = PROTECTED_ROLES.has(u.role)
                  return (
                    <tr key={u.id} className="hover:bg-command-elevated/50">
                      <td className="px-5 py-3 font-semibold text-slate-800">{u.full_name}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-sm">{u.email}</td>
                      <td className="px-5 py-3"><Badge>{getRoleLabel(u.role)}</Badge></td>
                      <td className="px-5 py-3">
                        <Badge variant={u.is_active ? 'success' : 'danger'}>
                          {u.is_active ? 'Activo' : 'Baja'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        {!isSelf && !protectedUser && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="gap-1"
                            loading={deletingId === u.id}
                            onClick={() => setConfirmDelete(u)}
                          >
                            <Trash2 size={12} /> Baja
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Alta de personal" size="lg">
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Contraseña inicial" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Rol</label>
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {ASSIGNABLE_STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Módulos y funciones</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3">
              {moduleOptions.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modules.includes(m.id)}
                    onChange={() => toggleModule(m.id)}
                    className="rounded border-slate-300"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button className="w-full" loading={saving} onClick={handleCreate}>
            Dar de alta y crear acceso
          </Button>
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar baja" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            ¿Eliminar a <strong>{confirmDelete?.full_name}</strong>? Se borrará su cuenta y perderá acceso al sistema.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" loading={!!deletingId} onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <p className="text-xs text-slate-400 text-center">Gestión de usuarios · alta, roles y baja de accesos</p>
    </div>
  )
}
