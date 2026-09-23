import { useState, useEffect } from 'react'
import { useNodeStatus, useCampaigns } from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'

interface BatteryStatus {
  level: number
  charging: boolean
}

interface HardwareStatusBarProps {
  variant?: 'full' | 'compact'
  locationOverride?: string
  className?: string
}

export function HardwareStatusBar({
  variant = 'full',
  locationOverride,
  className = '',
}: HardwareStatusBarProps) {
  const { data: nodeStatus } = useNodeStatus()
  const { campaignId } = useAuthStore()
  const { data: campaigns } = useCampaigns()

  // 1. Detección de conectividad del navegador en tiempo real
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 2. Detección de Batería del Dispositivo Cliente (si el navegador la soporta)
  const [clientBattery, setClientBattery] = useState<BatteryStatus | null>(null)

  useEffect(() => {
    let batteryInstance: any = null

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      ;(navigator as any)
        .getBattery()
        .then((battery: any) => {
          batteryInstance = battery
          const updateBattery = () => {
            setClientBattery({
              level: Math.round(battery.level * 100),
              charging: battery.charging,
            })
          }
          updateBattery()
          battery.addEventListener('levelchange', updateBattery)
          battery.addEventListener('chargingchange', updateBattery)
        })
        .catch(() => {
          // Si el navegador bloquea la API de batería, usamos el fallback del backend
        })
    }

    return () => {
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange', () => {})
          batteryInstance.removeEventListener('chargingchange', () => {})
        } catch {}
      }
    }
  }, [])

  // 3. Resolución de valores finales (con prioridad de dispositivo cliente o nodo UPS)
  const batteryPct = clientBattery?.level ?? nodeStatus?.battery_pct ?? 94
  const isCharging = clientBattery?.charging ?? true
  const batteryLabel = clientBattery
    ? isCharging
      ? '[Cargando / AC]'
      : '[Batería Dispositivo]'
    : '[Respaldado UPS]'

  // Ícono de batería contextual
  const getBatteryIcon = (pct: number, charging: boolean) => {
    if (charging) return 'battery_charging_90'
    if (pct > 80) return 'battery_full'
    if (pct > 50) return 'battery_5_bar'
    if (pct > 20) return 'battery_2_bar'
    return 'battery_alert'
  }

  // 4. Ubicación dinámica de campaña
  const activeCampaign =
    campaigns?.find((c) => c.id === campaignId) ??
    campaigns?.find((c) => c.status === 'active')
  const locationText =
    locationOverride ||
    activeCampaign?.location_name ||
    'Rumichaca, Urubamba, Cusco'

  const nodeId = nodeStatus?.node_id ?? 'CUS-VALLE-04'
  const hardwareModel = nodeStatus?.hardware ?? 'Minisforum Edge Core v4.2'
  const isSynced = nodeStatus?.db_synced ?? true
  const pendingSync = nodeStatus?.pending_sync_count ?? 0

  // ── VARIANT: FULL (Exacto al diseño de Login y Maqueta Carbon) ──
  if (variant === 'full') {
    return (
      <div
        className={`w-full bg-surface-container-high py-2.5 px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-on-surface-variant select-none border-b border-surface-container-highest transition-colors ${className}`}
      >
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
          {/* Nodo Local */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="font-semibold text-on-surface uppercase tracking-wider">
              NODO LOCAL: {nodeId}
            </span>
            <span className="text-secondary hidden sm:inline">
              ({hardwareModel})
            </span>
          </div>

          {/* Batería */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`material-symbols-outlined text-sm ${
                batteryPct <= 20 ? 'text-error' : 'text-tertiary'
              }`}
            >
              {getBatteryIcon(batteryPct, isCharging)}
            </span>
            <span>
              BATERÍA: {batteryPct}% {batteryLabel}
            </span>
          </div>

          {/* Enlace y Latencia */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`material-symbols-outlined text-sm ${
                isOnline ? 'text-primary' : 'text-error'
              }`}
            >
              {isOnline ? 'satellite_alt' : 'signal_disconnected'}
            </span>
            <span>
              {isOnline
                ? `ENLACE: Starlink Mini Activo (Latencia ${nodeStatus?.latency_ms ?? 38}ms)`
                : 'ENLACE: Offline (Mesh P2P Local)'}
            </span>
          </div>

          {/* Impresora Térmica */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-sm text-on-surface">
              print
            </span>
            <span>
              IMPRESORA TÉRMICA: {nodeStatus?.printer ?? 'BT-POS-01'}{' '}
              {nodeStatus?.printer_ok ? 'Conectada' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Lado Derecho: DB Sync & Ubicación */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 ${
              isSynced
                ? 'text-tertiary bg-tertiary-container'
                : 'text-error bg-error-container'
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {isSynced ? 'sync_saved_locally' : 'sync_problem'}
            </span>
            <span className="font-sans font-medium text-xs">
              {isSynced
                ? 'DB Local 100% Sincronizada'
                : `Cola Offline: ${pendingSync} pend.`}
            </span>
          </div>
          <span className="text-secondary truncate max-w-[240px]">
            UTC-5 • {locationText}
          </span>
        </div>
      </div>
    )
  }

  // ── VARIANT: COMPACT (Para cabecera Navbar / Header) ──
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 bg-surface-container text-xs font-mono text-on-surface-variant border border-surface-container-high shrink-0 ${className}`}
      title={`Nodo: ${nodeId} (${hardwareModel}) | Batería: ${batteryPct}% ${batteryLabel} | Latencia: ${nodeStatus?.latency_ms ?? 38}ms | Ubicación: ${locationText}`}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
        <span className="font-semibold text-on-surface text-[11px]">
          {nodeId}
        </span>
      </div>

      <span className="text-outline-variant">•</span>

      {/* Batería */}
      <div className="flex items-center gap-1 shrink-0 text-[11px]">
        <span
          className={`material-symbols-outlined text-[15px] ${
            batteryPct <= 20 ? 'text-error' : 'text-tertiary'
          }`}
        >
          {getBatteryIcon(batteryPct, isCharging)}
        </span>
        <span>{batteryPct}%</span>
      </div>

      <span className="text-outline-variant hidden sm:inline">•</span>

      {/* Enlace */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 text-[11px]">
        <span
          className={`material-symbols-outlined text-[15px] ${
            isOnline ? 'text-primary' : 'text-error'
          }`}
        >
          {isOnline ? 'satellite_alt' : 'signal_disconnected'}
        </span>
        <span>{isOnline ? `${nodeStatus?.latency_ms ?? 38}ms` : 'Offline'}</span>
      </div>
    </div>
  )
}
