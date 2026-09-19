import React from 'react'

type AlertType = 'info' | 'success' | 'warning' | 'error'

const alertStyles: Record<AlertType, { bg: string; border: string; color: string; icon: string }> = {
  info:    { bg: 'var(--info-muted)',    border: 'rgba(56,189,248,0.35)',  color: 'var(--info)',    icon: 'ℹ' },
  success: { bg: 'var(--success-muted)', border: 'rgba(34,197,94,0.35)',   color: 'var(--success)', icon: '✓' },
  warning: { bg: 'var(--warning-muted)', border: 'rgba(245,158,11,0.35)',  color: 'var(--warning)', icon: '⚠' },
  error:   { bg: 'var(--danger-muted)',  border: 'rgba(239,68,68,0.35)',   color: 'var(--danger)',  icon: '✕' },
}

interface AlertProps {
  type?: AlertType
  title?: string
  children: React.ReactNode
  onClose?: () => void
}

export function Alert({ type = 'info', title, children, onClose }: AlertProps) {
  const s = alertStyles[type]
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        gap: 12,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        alignItems: 'flex-start',
      }}
    >
      <span style={{ color: s.color, fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 600, color: s.color, fontSize: 14, marginBottom: children ? 4 : 0 }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: s.color,
            cursor: 'pointer',
            fontSize: 16,
            flexShrink: 0,
            opacity: 0.7,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

/* ── Toast notification (simple) ───────────────────────────────── */
interface ToastProps {
  message: string
  type?: AlertType
  onClose: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const s = alertStyles[type]
  return (
    <div
      className="animate-slide-right"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-elevated)',
        border: `1px solid ${s.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: 280,
        maxWidth: 400,
      }}
    >
      <span style={{ color: s.color, fontSize: 16 }}>{s.icon}</span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
      >
        ×
      </button>
    </div>
  )
}
