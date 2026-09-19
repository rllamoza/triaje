import React from 'react'

interface SpinnerProps {
  size?: number
  color?: string
  label?: string
}

export function Spinner({ size = 24, color = 'var(--accent)', label }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label ?? 'Cargando'}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: `${Math.max(2, size / 10)}px solid rgba(255,255,255,0.1)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
      {label && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  )
}

export function PageLoader({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 16,
        background: 'var(--bg-base)',
      }}
    >
      {/* Logo / brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: 'var(--accent)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          ⚕
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          Semilla Médica
        </span>
      </div>
      <Spinner size={36} label={label} />
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────────────── */
interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  )
}
