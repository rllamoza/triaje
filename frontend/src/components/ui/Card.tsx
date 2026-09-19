import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  glass?: boolean
  padding?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

const paddings = { sm: '12px 16px', md: '20px 24px', lg: '28px 32px' }

export function Card({
  children,
  title,
  subtitle,
  icon,
  actions,
  glass = false,
  padding = 'md',
  className = '',
  style,
  onClick,
}: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: glass ? 'rgba(17,19,32,0.7)' : 'var(--bg-surface)',
        backdropFilter: glass ? 'blur(12px)' : undefined,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'border-color var(--ease-default), box-shadow var(--ease-default)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--border-focus)'
          e.currentTarget.style.boxShadow = 'var(--shadow-glow-blue)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {(title || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: paddings[padding],
            borderBottom: '1px solid var(--border)',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && (
              <span style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0 }}>
                {icon}
              </span>
            )}
            <div>
              {title && (
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: paddings[padding] }}>{children}</div>
    </div>
  )
}

/* ── StatCard ─────────────────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: string
  trend?: string
}

export function StatCard({ label, value, icon, color = 'var(--accent)', trend }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color, opacity: 0.8, display: 'flex' }}>{icon}</span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {trend && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trend}</div>}
    </div>
  )
}
