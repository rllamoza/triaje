import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCampaigns, useCampaignStations, useActivateCampaign } from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { Select } from '../../components/ui/Input'
import type { Campaign } from '../../api/hooks'

export default function CampaignSelectPage() {
  const navigate = useNavigate()
  const { data: campaigns, isLoading } = useCampaigns()
  const setCampaign = useAuthStore((s) => s.setCampaign)
  const setStation = useAuthStore((s) => s.setStation)
  const user = useAuthStore((s) => s.user)
  const activateMutation = useActivateCampaign()

  const [selected, setSelected] = useState<Campaign | null>(null)
  const [stationId, setStationId] = useState('')

  const { data: stations } = useCampaignStations(selected?.id ?? 0)

  const handleSelect = (campaign: Campaign) => {
    setSelected(campaign)
    setStationId('')
  }

  const handleConfirm = () => {
    if (!selected) return
    setCampaign(selected.id)
    if (stationId) setStation(stationId)
    navigate('/')
  }

  if (isLoading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <Spinner size={40} label="Cargando campañas..." />
      </div>
    )
  }

  const activeCampaigns = campaigns?.filter((c) => c.status === 'active') ?? []
  const otherCampaigns  = campaigns?.filter((c) => c.status !== 'active') ?? []

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        gap: 32,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>🏕</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
          Seleccionar campaña
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Hola, {user?.nombres}. Elige la campaña en la que trabajarás hoy.
        </p>
      </motion.div>

      {/* Active campaigns */}
      {activeCampaigns.length > 0 && (
        <div style={{ width: '100%', maxWidth: 700 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            ● Campañas activas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeCampaigns.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelect(c)}
                style={{
                  background: selected?.id === c.id ? 'var(--accent-muted)' : 'var(--bg-surface)',
                  border: `2px solid ${selected?.id === c.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'all var(--ease-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
                    <Badge status="active" size="sm" dot />
                    {c.starlink_active && (
                      <span style={{ fontSize: 11, color: 'var(--info)', fontWeight: 600 }}>📡 Starlink</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    📍 {c.location_name} — {c.province}, {c.department}
                    {c.altitude_masl && ` · ${c.altitude_masl.toLocaleString()} msnm`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{c.today_count}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>atenciones hoy</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Other campaigns */}
      {otherCampaigns.length > 0 && (
        <div style={{ width: '100%', maxWidth: 700 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Otras campañas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otherCampaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                style={{
                  background: selected?.id === c.id ? 'var(--accent-muted)' : 'var(--bg-surface)',
                  border: `1px solid ${selected?.id === c.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all var(--ease-default)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: c.status === 'closed' ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.location_name}</div>
                </div>
                <Badge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Station selector */}
      {selected && stations && stations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 700 }}
        >
          <Select
            id="station-select"
            label="Estación de trabajo (opcional)"
            placeholder="— Selecciona tu estación —"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            options={stations.map((s) => ({
              value: s.code,
              label: `${s.label} (${s.type})`,
            }))}
          />
        </motion.div>
      )}

      {/* Confirm */}
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', maxWidth: 700 }}>
          <Button id="campaign-confirm-btn" fullWidth size="xl" onClick={handleConfirm}>
            Confirmar y entrar →
          </Button>
        </motion.div>
      )}

      {/* Admin can activate */}
      {user?.role === 'admin' && selected && selected.status !== 'active' && (
        <Button
          id="campaign-activate-btn"
          variant="warning"
          size="md"
          loading={activateMutation.isPending}
          onClick={() => activateMutation.mutate(selected.id)}
        >
          Activar esta campaña
        </Button>
      )}
    </div>
  )
}
