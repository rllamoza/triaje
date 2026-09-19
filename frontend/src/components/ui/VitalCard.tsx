
interface VitalCardProps {
  label: string
  value: string | number | null
  unit?: string
  status?: 'normal' | 'warning' | 'danger' | 'unknown'
  min?: number
  max?: number
  icon?: string
}

const statusColors = {
  normal:  { color: 'var(--success)', bg: 'var(--success-muted)',  border: 'rgba(34,197,94,0.3)' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245,158,11,0.3)' },
  danger:  { color: 'var(--danger)',  bg: 'var(--danger-muted)',  border: 'rgba(239,68,68,0.35)' },
  unknown: { color: 'var(--text-muted)', bg: 'var(--bg-elevated)', border: 'var(--border)' },
}

export function VitalCard({ label, value, unit, status = 'unknown', min, max, icon }: VitalCardProps) {
  const s = statusColors[status]

  return (
    <div
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform var(--ease-default)',
      }}
    >
      {/* Status dot */}
      {status !== 'unknown' && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 8px ${s.color}`,
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {value !== null && value !== undefined ? (
          <>
            <span style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
              {value}
            </span>
            {unit && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 18, color: 'var(--text-disabled)' }}>—</span>
        )}
      </div>

      {(min !== undefined || max !== undefined) && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Rango: {min ?? '—'} – {max ?? '—'} {unit}
        </div>
      )}
    </div>
  )
}

/* ── Vital status helper ─────────────────────────────────────── */
export function getVitalStatus(
  value: number | null | undefined,
  ranges: { min?: number; max?: number; warning?: [number, number]; danger?: [number, number] } | undefined,
): 'normal' | 'warning' | 'danger' | 'unknown' {
  if (value == null || !ranges) return 'unknown'
  if (ranges.danger) {
    const [lo, hi] = ranges.danger
    if ((lo != null && value >= lo) || (hi != null && value > hi)) return 'danger'
  }
  if (ranges.warning) {
    const [lo, hi] = ranges.warning
    if ((lo != null && value >= lo) || (hi != null && value > hi)) return 'warning'
  }
  if (ranges.min != null && value < ranges.min) return 'danger'
  if (ranges.max != null && value > ranges.max) return 'warning'
  return 'normal'
}
