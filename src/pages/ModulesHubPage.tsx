import { NavLink } from 'react-router-dom'
import { ALL_MODULES, MODULE_GROUPS, userCanAccessModule } from '@/config/modules'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Layers } from 'lucide-react'

import { PageBack } from '@/components/layout/PageBack'

export default function ModulesHubPage() {
  const { user } = useAuthStore()
  const visible = ALL_MODULES.filter((m) => user && userCanAccessModule(user, m))

  return (
    <div className="space-y-8 animate-fadeUp">
      <PageBack to="/app/dashboard" label="Centro de mando" />
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers size={20} className="text-brand-600" />
          <Badge variant="success">Demo completo</Badge>
        </div>
        <h2 className="text-2xl font-black text-slate-800">Todos los módulos IA·RESTAURANT</h2>
        <p className="text-sm text-slate-500 mt-1">
          {visible.length} módulos disponibles para tu rol
        </p>
      </div>

      {MODULE_GROUPS.map(group => {
        const mods = visible.filter(m => m.group === group)
        if (!mods.length) return null
        return (
          <div key={group}>
            <h3 className="text-xs font-mono text-orange-600 uppercase tracking-[0.2em] mb-3">{group}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {mods.map(mod => (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) => cn(
                    'glass-panel rounded-xl p-4 bg-white border transition-all hover:shadow-glow hover:border-brand-300',
                    isActive ? 'border-brand-400 shadow-glow' : 'border-command-border'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-brand-50 text-brand-600 shrink-0">
                      <mod.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-800 truncate">{mod.label}</p>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0">F{mod.phase}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mod.description}</p>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
