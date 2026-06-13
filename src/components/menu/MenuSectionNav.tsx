import { NavLink } from 'react-router-dom'
import { Package, Smartphone, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/app/catalog', label: 'Catálogo', icon: Package, end: true },
  { to: '/app/catalog/comensal', label: 'Menú comensal', icon: Smartphone },
  { to: '/app/qr', label: 'Códigos QR', icon: QrCode },
]

export function MenuSectionNav() {
  return (
    <nav className="flex gap-2 flex-wrap">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all',
              isActive
                ? 'bg-brand-100 text-brand-700 border-brand-300 shadow-sm'
                : 'bg-white text-slate-500 border-command-border hover:border-brand-200 hover:text-brand-600'
            )
          }
        >
          <tab.icon size={16} />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
