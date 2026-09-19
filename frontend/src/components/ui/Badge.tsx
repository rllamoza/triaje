import React from 'react'

type Priority = 'rojo' | 'amarillo' | 'verde'

const priorityMap: Record<Priority, { bg: string; text: string; label: string; icon: string }> = {
  rojo:     { bg: 'bg-error text-on-error', text: 'text-error', label: 'Prioridad I — Emergencia', icon: 'priority_high' },
  amarillo: { bg: 'bg-[#f1c21b] text-[#161616]', text: 'text-[#8a6100]', label: 'Prioridad II — Urgente', icon: 'notification_important' },
  verde:    { bg: 'bg-tertiary text-on-tertiary', text: 'text-tertiary', label: 'Prioridad III — No Urgente', icon: 'health_and_safety' },
}

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  admitido:           { bg: 'bg-primary-container', text: 'text-on-primary-fixed' },
  en_espera_triaje:   { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' },
  en_triaje:          { bg: 'bg-[#ffedd5]', text: 'text-[#9a3412]' },
  en_espera_medico:   { bg: 'bg-primary-container', text: 'text-on-primary-fixed' },
  en_consulta:        { bg: 'bg-primary', text: 'text-on-primary' },
  en_farmacia:        { bg: 'bg-surface-container-high', text: 'text-on-surface' },
  finalizado:         { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  referido:           { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]' },
  active:             { bg: 'bg-tertiary', text: 'text-on-tertiary' },
  planned:            { bg: 'bg-surface-container-highest', text: 'text-on-surface' },
  closed:             { bg: 'bg-surface-container-high', text: 'text-secondary' },
}

interface BadgeProps {
  children?: React.ReactNode
  priority?: Priority
  status?: string
  role?: string
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  className?: string
}

export function Badge({ children, priority, status, role, size = 'sm', dot = false, className = '' }: BadgeProps) {
  if (priority) {
    const p = priorityMap[priority]
    const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
    return (
      <span className={`inline-flex items-center gap-1 font-bold tracking-wider uppercase rounded-none ${p.bg} ${sizeClasses} ${className}`}>
        <span className="material-symbols-outlined text-[12px]">{p.icon}</span>
        {children ?? (priority === 'rojo' ? 'P1 - Emergencia' : priority === 'amarillo' ? 'P2 - Urgente' : 'P3 - No Urgente')}
      </span>
    )
  }

  if (status && statusBadgeStyles[status]) {
    const s = statusBadgeStyles[status]
    return (
      <span className={`inline-flex items-center gap-1 font-semibold tracking-wider text-[11px] px-2 py-0.5 rounded-none ${s.bg} ${s.text} ${className}`}>
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
        {children ?? status.replace(/_/g, ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 font-medium text-[11px] px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-none border border-surface-container-high ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />}
      {children ?? role}
    </span>
  )
}

export function PriorityCard({ priority, label, count, onClick }: { priority: Priority; label?: string; count?: number; onClick?: () => void }) {
  const p = priorityMap[priority]
  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all border border-surface-container-high flex flex-col justify-between ${priority === 'rojo' ? 'bg-error-container/30 hover:bg-error-container/60' : priority === 'amarillo' ? 'bg-[#fef9c3]/50 hover:bg-[#fef9c3]' : 'bg-tertiary-container/30 hover:bg-tertiary-container/60'}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${p.text}`}>
          {label ?? (priority === 'rojo' ? 'Prioridad I' : priority === 'amarillo' ? 'Prioridad II' : 'Prioridad III')}
        </span>
        <span className={`material-symbols-outlined text-[18px] ${p.text}`}>{p.icon}</span>
      </div>
      {count !== undefined && (
        <div className="text-3xl font-mono font-bold mt-2 text-on-surface">
          {count}
        </div>
      )}
    </div>
  )
}
