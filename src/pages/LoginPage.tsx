import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/brand/Logo'
import { useAuthStore } from '@/store/authStore'
import { authRepository } from '@/repositories/authRepository'
import { bootstrapService } from '@/services/bootstrapService'
import { isSupabaseConfigured } from '@/lib/config'
import { toast } from '@/components/ui/Toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bootLine, setBootLine] = useState(0)
  const { setSession } = useAuthStore()
  const navigate = useNavigate()
  const demoUsers = authRepository.getDemoCredentials()

  const bootMessages = [
    'Inicializando centro de mando...',
    'Conectando módulos operativos...',
    'Motor IA listo · Monitoreo activo',
    'Sistema en línea · Esperando acceso',
  ]

  useEffect(() => {
    const t = setInterval(() => setBootLine(l => (l + 1) % bootMessages.length), 2000)
    return () => clearInterval(t)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const session = await authRepository.signIn(email, password)
      setSession(session)
      toast(`Sistema activo — Bienvenido ${session.user.full_name}`, 'success')
      navigate('/app/dashboard')
      if (isSupabaseConfigured()) {
        void bootstrapService.pullFromRemote({
          tenantId: session.tenant.id,
          sucursalId: session.sucursal.id,
          userId: session.user.id,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Credenciales incorrectas'
      toast(msg.length < 120 ? msg : 'Acceso denegado — verifica credenciales', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-command-bg ops-grid-bg flex">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <Logo size="lg" showTagline />
        <div className="space-y-8 max-w-lg">
          <h2 className="text-4xl font-black text-slate-800 leading-tight">
            El sistema que<br />
            <span className="text-gradient-warm">piensa</span> con tu<br />
            restaurante.
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Centro de mando gastronómico con IA operativa. POS, piso, cocina y análisis en una sola plataforma.
          </p>
          <div className="glass-panel rounded-2xl p-6 space-y-4 bg-white">
            <div className="flex items-center gap-2 text-orange-600 text-xs font-mono uppercase tracking-widest">
              <Zap size={14} />
              {bootMessages[bootLine]}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Mesas', val: '14 activas' },
                { label: 'Cocina', val: '3 órdenes' },
                { label: 'Ventas', val: 'En vivo' },
              ].map(n => (
                <div key={n.label} className="bg-command-elevated rounded-xl p-3 border border-command-border text-center">
                  <p className="text-[10px] text-slate-500 uppercase">{n.label}</p>
                  <p className="text-sm font-mono font-bold text-brand-600 mt-1">{n.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-xs font-mono">
          IA·RESTAURANT v1.0
        </p>
        <div className="absolute inset-0 pointer-events-none opacity-30">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full border-2 border-brand-400"
              style={{ left: `${15 + i * 14}%`, top: `${30 + (i % 3) * 20}%` }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:max-w-md lg:flex-none lg:w-[480px] border-l border-command-border bg-white/60">
        <div className="w-full max-w-sm animate-fadeUp">
          <div className="lg:hidden mb-8">
            <Logo size="md" showTagline />
          </div>
          <div className="glass-panel rounded-2xl p-8 shadow-panel bg-white">
            <h2 className="text-xl font-black text-slate-800 mb-1">Acceso al sistema</h2>
            <p className="text-sm text-slate-500 mb-6">Identifícate para entrar al centro de mando</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Correo"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@restaurante.com"
                icon={<Mail size={16} />}
                required
              />
              <Input
                label="Contraseña"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock size={16} />}
                endIcon={showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                onEndIconClick={() => setShowPass(!showPass)}
                endIconLabel={showPass ? 'Ocultar' : 'Mostrar'}
                required
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Entrar al centro de mando
              </Button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-4">
              <Link to="/register" className="text-brand-600 font-semibold hover:underline">Crear cuenta</Link>
              {' · '}
              <Link to="/forgot-password" className="text-brand-600 font-semibold hover:underline">¿Olvidaste tu contraseña?</Link>
            </p>
            <div className="mt-6 pt-6 border-t border-command-border">
              <p className="text-[10px] text-slate-500 text-center mb-3 uppercase tracking-wider">Accesos demo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoUsers.map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => { setEmail(u.email); setPassword(u.password) }}
                    className="text-left p-2.5 rounded-xl border border-command-border hover:border-brand-400 hover:bg-brand-50 transition-all"
                  >
                    <p className="text-xs font-semibold text-slate-700 capitalize">{u.role.replace('_', ' ')}</p>
                    <p className="text-[10px] text-slate-600 font-mono break-all leading-snug mt-0.5">{u.email}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Admin: <span className="font-mono text-slate-600">admin@iarestaurant.mx</span>
              </p>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-mono lg:hidden mt-6 text-center">
            IA·RESTAURANT v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
