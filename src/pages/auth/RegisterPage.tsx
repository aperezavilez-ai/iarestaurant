import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/brand/Logo'
import { toast } from '@/components/ui/Toast'
import { authRepository } from '@/repositories/authRepository'
import { isSupabaseConfigured } from '@/lib/config'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const remote = isSupabaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (remote) {
        await authRepository.signUp(email, password, fullName, restaurant)
        toast('Cuenta creada — revisa tu correo para activar el acceso', 'success')
      } else {
        await new Promise(r => setTimeout(r, 800))
        toast('Registro demo completado — usa credenciales demo para entrar', 'success')
      }
      navigate('/login')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al registrar', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-command-bg ops-grid-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fadeUp">
        <div className="text-center mb-8"><Logo size="md" showTagline /></div>
        <div className="glass-panel rounded-2xl p-8 bg-white shadow-panel">
          <h2 className="text-xl font-black text-slate-800 mb-1">Crear cuenta</h2>
          <p className="text-sm text-slate-500 mb-6">
            Registra tu restaurante en IA·RESTAURANT
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre del restaurante" placeholder="Mi Restaurante" icon={<Building2 size={16} />} value={restaurant} onChange={e => setRestaurant(e.target.value)} required />
            <Input label="Tu nombre" placeholder="Juan Pérez" icon={<User size={16} />} value={fullName} onChange={e => setFullName(e.target.value)} required />
            <Input label="Correo" type="email" placeholder="tu@restaurante.com" icon={<Mail size={16} />} value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" placeholder="••••••••" icon={<Lock size={16} />} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Crear cuenta
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
