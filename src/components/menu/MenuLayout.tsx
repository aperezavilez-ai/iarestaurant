import { Outlet } from 'react-router-dom'
import { MenuSectionNav } from './MenuSectionNav'

export function MenuLayout() {
  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="bg-white rounded-2xl border border-brand-200 p-4 shadow-sm">
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest mb-3">
          Gestión del menú
        </p>
        <MenuSectionNav />
        <p className="text-xs text-slate-500 mt-3">
          <strong>Catálogo</strong> = gestión interna · <strong>Menú comensal</strong> = vista del cliente QR · <strong>Códigos QR</strong> = enlaces por mesa
        </p>
      </div>
      <Outlet />
    </div>
  )
}
