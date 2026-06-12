import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { authRepository } from '@/repositories/authRepository'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Grid3X3,
  Users, Settings, LogOut, ChefHat, CreditCard, BarChart3,
  Building2, Package, ChevronRight
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, roles: ['admin_saas','admin_restaurant','gerente','supervisor'] },
  { label: 'Punto de Venta', path: '/app/pos', icon: ShoppingCart, roles: ['cajero','mesero','supervisor','gerente','admin_restaurant'] },
  { label: 'Mesas', path: '/app/tables', icon: Grid3X3, roles: ['mesero','cajero','supervisor','capitan','gerente','admin_restaurant'] },
  { label: 'Cocina (KDS)', path: '/app/kitchen', icon: ChefHat, roles: ['cocina','supervisor','gerente','admin_restaurant'] },
  { label: 'Catálogo', path: '/app/catalog', icon: Package, roles: ['admin_restaurant','gerente','supervisor'] },
  { label: 'Caja', path: '/app/cash', icon: CreditCard, roles: ['cajero','gerente','supervisor','admin_restaurant'] },
  { label: 'Reportes', path: '/app/reports', icon: BarChart3, roles: ['gerente','admin_restaurant','admin_saas'] },
  { label: 'Usuarios', path: '/app/users', icon: Users, roles: ['admin_restaurant','gerente'] },
  { label: 'Sucursales', path: '/app/branches', icon: Building2, roles: ['admin_restaurant','admin_saas'] },
  { label: 'Configuración', path: '/app/settings', icon: Settings, roles: ['admin_restaurant','admin_saas'] },
]

export function Sidebar() {
  const { user, tenant, logout } = useAuthStore()
  const visible = NAV_ITEMS.filter(i => user?.role && i.roles.includes(user.role))

  return (
    <aside className="h-screen w-64 flex flex-col gradient-dark text-white shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shrink-0">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">{tenant?.name || 'IA-RESTAURANT'}</p>
            <p className="text-white/40 text-xs">SaaS POS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
              isActive
                ? 'bg-brand-500 text-white'
                : 'text-white/60 hover:bg-white/8 hover:text-white'
            )}
          >
            <item.icon size={17} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center shrink-0 text-white font-bold text-sm">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'Usuario'}</p>
            <p className="text-white/40 text-xs truncate capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={() => { authRepository.signOut(); logout() }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all" title="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
