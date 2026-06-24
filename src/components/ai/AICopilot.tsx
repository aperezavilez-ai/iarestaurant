import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, X, Brain, AlertTriangle, Lightbulb, TrendingUp, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AIInsight } from '@/hooks/useLiveOps'

const ICONS = {
  alert: AlertTriangle,
  suggestion: Lightbulb,
  prediction: TrendingUp,
  info: Info,
}

const COLORS = {
  alert: 'text-ops-danger border-red-200 bg-red-50',
  suggestion: 'text-brand-700 border-brand-200 bg-brand-50',
  prediction: 'text-ai-600 border-sky-200 bg-sky-50',
  info: 'text-slate-600 border-command-border bg-command-elevated',
}

interface AICopilotProps {
  insights: AIInsight[]
  collapsed?: boolean
  onToggle?: () => void
}

export function AICopilot({ insights, collapsed, onToggle }: AICopilotProps) {
  const navigate = useNavigate()

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl gradient-ai text-white font-bold text-sm shadow-lg hover:scale-105 transition-transform"
      >
        <Brain size={18} />
        Copiloto IA
        {insights.some(i => i.type === 'alert') && (
          <span className="w-2 h-2 rounded-full bg-ops-danger animate-pulse-live" />
        )}
      </button>
    )
  }

  return (
    <aside className="w-80 shrink-0 border-l border-command-border bg-white flex flex-col h-full shadow-panel">
      <div className="p-4 border-b border-command-border flex items-center justify-between bg-gradient-to-r from-brand-50 to-orange-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-ai-500/10">
            <Sparkles size={16} className="text-ai-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Copiloto IA</p>
            <p className="text-[10px] text-orange-600 uppercase tracking-wider">En vivo</p>
          </div>
        </div>
        {onToggle && (
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-white text-slate-500">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {insights.map((insight) => {
          const Icon = ICONS[insight.type]
          return (
            <div
              key={insight.id}
              className={cn('p-3 rounded-xl border', COLORS[insight.type])}
            >
              <div className="flex items-start gap-2">
                <Icon size={14} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.message}</p>
                  {insight.action && (
                    <button
                      onClick={() => {
                        if (insight.action === 'Ver cocina') navigate('/app/kitchen')
                        else if (insight.action === 'Ir a POS') navigate('/app/pos')
                      }}
                      className="mt-2 flex items-center gap-1 text-[10px] font-bold text-ai-600 hover:text-ai-500 uppercase tracking-wider"
                    >
                      {insight.action} <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {insights.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-8">Sin alertas — operación estable</p>
        )}
      </div>
    </aside>
  )
}
