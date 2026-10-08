import { useState, useEffect } from 'react'
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useToggleWebhook,
  useTestWebhookPing,
  useTriggerWebhook,
  useWebhookLogs,
  useTelemetryStats,
  useTelemetryEvents,
  usePingStarlink,
  useSyncDelta,
  useMeshTopology,
  type WebhookItem,
  type WebhookDeliveryItem,
} from '../../api/hooks'
import api from '../../api/client'

export default function TelemetriaPage() {
  // ── Queries & Mutations ──────────────────────────────────────
  const { data: statsData, refetch: refetchStats } = useTelemetryStats()
  const { data: eventsData, refetch: refetchEvents } = useTelemetryEvents()
  const { data: topologyData } = useMeshTopology()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: webhooksData, isLoading: loadingWebhooks, refetch: refetchWebhooks } = useWebhooks({
    search: searchTerm,
    type: typeFilter,
    status: statusFilter,
  })

  const pingStarlinkMutation = usePingStarlink()
  const syncDeltaMutation = useSyncDelta()
  const testPingMutation = useTestWebhookPing()
  const triggerWebhookMutation = useTriggerWebhook()
  const toggleWebhookMutation = useToggleWebhook()
  const deleteWebhookMutation = useDeleteWebhook()
  const createWebhookMutation = useCreateWebhook()
  const updateWebhookMutation = useUpdateWebhook()

  // ── Local UI State ───────────────────────────────────────────
  const [starlinkResult, setStarlinkResult] = useState<string | null>(null)
  const [deltaResult, setDeltaResult] = useState<string | null>(null)
  const [activeTestingId, setActiveTestingId] = useState<number | null>(null)
  const [activeTriggeringId, setActiveTriggeringId] = useState<number | null>(null)

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null)
  const [logsModalWebhookId, setLogsModalWebhookId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Real-time terminal log stream local buffer
  const [terminalLogs, setTerminalLogs] = useState<Array<{
    id: string
    time: string
    level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR'
    tag: string
    message: string
  }>>([])

  // Toast feedback
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'info' | 'warn' | 'error' | 'success' }>>([])

  const addToast = (message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  // Dynamic GPS Clock
  const [gpsClock, setGpsClock] = useState('')
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setGpsClock(now.toTimeString().split(' ')[0] + ' UTC-5')
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Populate terminal logs from backend events
  useEffect(() => {
    if (eventsData?.events) {
      const formatted = eventsData.events.map((ev) => {
        let level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR' = 'INFO'
        if (ev.status === 'OK' || ev.status === 'SUCCESS') level = 'SUCCESS'
        else if (ev.status === 'FAILED' || ev.status === 'ERROR') level = 'ERROR'
        else if (ev.status === 'PENDING') level = 'WARN'

        let tag = ev.type || 'P2P-MESH'
        if (ev.event.includes('RENIEC')) tag = 'RENIEC'
        else if (ev.event.includes('STARLINK')) tag = 'STARLINK'
        else if (ev.event.includes('WEBHOOK')) tag = 'WEBHOOK'
        else if (ev.event.includes('TICKET')) tag = 'BLE-PRINTER'

        return {
          id: ev.id,
          time: ev.time,
          level,
          tag,
          message: `${ev.event} -> ${ev.target} [${ev.status}]`,
        }
      })
      setTerminalLogs(formatted)
    }
  }, [eventsData])

  // ── Actions ──────────────────────────────────────────────────
  const handlePingStarlink = () => {
    setStarlinkResult(null)
    pingStarlinkMutation.mutate(undefined, {
      onSuccess: (res: any) => {
        const msg = res?.message || `Ping exitoso a gateway Starlink: Latencia ${res?.latency_ms ?? 36}ms • Pérdida de paquetes: 0%`
        setStarlinkResult(msg)
        addToast(msg, 'success')
        refetchStats()
        refetchEvents()
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || 'Error al conectar con gateway Starlink'
        setStarlinkResult(`Fallo de ping: ${msg}`)
        addToast(msg, 'error')
      },
    })
  }

  const handleSyncDelta = () => {
    setDeltaResult(null)
    syncDeltaMutation.mutate(undefined, {
      onSuccess: (res: any) => {
        const msg = res?.message || 'Sincronización delta P2P completada entre los 6 nodos.'
        setDeltaResult(msg)
        addToast(msg, 'success')
        refetchStats()
        refetchEvents()
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || 'Error en sincronización delta'
        addToast(msg, 'error')
      },
    })
  }

  const handleTestPing = (hook: WebhookItem) => {
    setActiveTestingId(hook.id)
    testPingMutation.mutate(hook.id, {
      onSuccess: (res: any) => {
        setActiveTestingId(null)
        const isOk = res.success
        const code = res.status_code ? `HTTP ${res.status_code}` : 'TIMEOUT'
        const msg = `${hook.name}: Ping ${code} (${res.latency_ms}ms)`
        addToast(msg, isOk ? 'success' : 'warn')
        refetchWebhooks()
        refetchEvents()
      },
      onError: (err: any) => {
        setActiveTestingId(null)
        const msg = err.response?.data?.message || `Error en ping a ${hook.name}`
        addToast(msg, 'error')
      },
    })
  }

  const handleTriggerWebhook = (hook: WebhookItem) => {
    setActiveTriggeringId(hook.id)
    triggerWebhookMutation.mutate(hook.id, {
      onSuccess: (res: any) => {
        setActiveTriggeringId(null)
        const msg = `Disparo exitoso a ${hook.name} [${res.status_code || 200}] (${res.duration_ms}ms)`
        addToast(msg, 'success')
        refetchWebhooks()
        refetchStats()
        refetchEvents()
      },
      onError: (err: any) => {
        setActiveTriggeringId(null)
        const msg = err.response?.data?.message || `Error al disparar webhook ${hook.name}`
        addToast(msg, 'error')
      },
    })
  }

  const handleToggle = (hook: WebhookItem) => {
    toggleWebhookMutation.mutate(hook.id, {
      onSuccess: () => {
        addToast(`Conector ${hook.name} actualizado.`, 'info')
        refetchWebhooks()
      },
      onError: () => {
        addToast('Error al alternar estado del conector.', 'error')
      },
    })
  }

  const handleDelete = (id: number) => {
    deleteWebhookMutation.mutate(id, {
      onSuccess: () => {
        addToast('Webhook eliminado correctamente.', 'info')
        setDeleteConfirmId(null)
        refetchWebhooks()
      },
      onError: () => {
        addToast('Error al eliminar webhook.', 'error')
      },
    })
  }

  const handleExportOpenApi = async () => {
    try {
      addToast('Descargando especificación OpenAPI 3.0...', 'info')
      const response = await api.get('/admin/telemetria/openapi')
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `triaje_openapi_spec_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      addToast('Spec OpenAPI 3.0 descargada.', 'success')
    } catch {
      addToast('Error al descargar spec OpenAPI.', 'error')
    }
  }

  const handleExportDump = async () => {
    try {
      addToast('Generando volcado cifrado de caché local y telemetría...', 'info')
      const response = await api.get('/admin/telemetria/export-dump')
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `triaje_telemetria_dump_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      addToast('Volcado cifrado descargado con éxito.', 'success')
    } catch {
      addToast('Error al descargar volcado de telemetría.', 'error')
    }
  }

  const stats = statsData?.data

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto px-4 py-2.5 bg-surface text-on-surface shadow-xl text-xs font-medium flex items-center gap-2.5 border border-surface-container-high transition-all"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                t.type === 'success'
                  ? 'text-tertiary'
                  : t.type === 'warn'
                  ? 'text-primary'
                  : t.type === 'error'
                  ? 'text-error'
                  : 'text-primary'
              }`}
            >
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : t.type === 'warn' ? 'warning' : 'info'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header Contextual Bar */}
      <div className="pt-2 pb-4 mb-6 border-b border-surface-container-high">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest text-on-surface-variant uppercase mb-2">
          <span>ADMINISTRACIÓN</span>
          <span>/</span>
          <span className="text-primary font-bold">INTEGRACIONES &amp; APIS</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
                NOC-08
              </span>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                {stats?.edge_node?.name ?? 'Nodo Maestro: Minisforum Edge Core v4.2'}
              </span>
              {gpsClock && (
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-mono bg-surface-container text-on-surface-variant border border-surface-container-high">
                  GPS {gpsClock}
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
              Telemetría Satelital <span className="font-semibold text-primary">&amp; Replicación P2P Mesh</span>
            </h1>
            <p className="text-xs text-on-surface-variant mt-1 max-w-4xl">
              Monitoreo y administración de APIs gubernamentales (RENIEC / SIS), colas de replicación P2P Mesh offline-first y endpoints salientes de auditoría clínica en despliegue móvil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={syncDeltaMutation.isPending}
              onClick={handleSyncDelta}
              className="h-10 px-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 border border-surface-container-high shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] text-tertiary ${syncDeltaMutation.isPending ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{syncDeltaMutation.isPending ? 'Sincronizando...' : 'Sincronizar Delta Ahora'}</span>
            </button>

            <button
              type="button"
              disabled={pingStarlinkMutation.isPending}
              onClick={handlePingStarlink}
              className="h-10 px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none shadow-xs"
            >
              <span className={`material-symbols-outlined text-[18px] ${pingStarlinkMutation.isPending ? 'animate-spin' : ''}`}>
                satellite_alt
              </span>
              <span>{pingStarlinkMutation.isPending ? 'Enviando Ping...' : 'Probar Conectividad Starlink'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingWebhook(null)
                setIsModalOpen(true)
              }}
              className="h-10 px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>+ NUEVO WEBHOOK O CONECTOR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {starlinkResult && (
        <div className="p-3 mb-4 bg-tertiary-container text-on-tertiary-container text-xs flex items-center justify-between border border-tertiary/30 font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{starlinkResult}</span>
          </div>
          <button onClick={() => setStarlinkResult(null)} className="text-xs hover:underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {deltaResult && (
        <div className="p-3 mb-4 bg-primary-container text-on-primary-fixed text-xs flex items-center justify-between border border-primary/30 font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">cloud_sync</span>
            <span>{deltaResult}</span>
          </div>
          <button onClick={() => setDeltaResult(null)} className="text-xs hover:underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Bento Grid: Telemetry & Integrations KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Starlink Mini */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                ENLACE SATELITAL WAN
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">Starlink Mini</span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">
                {stats?.starlink?.azimuth ? `Antena Orientada (${stats.starlink.azimuth})` : 'Antena Orientada (38° Azim)'}
              </span>
            </div>
            <div className="w-9 h-9 bg-primary-container text-primary flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">satellite_alt</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Latencia satelital:</span>
              <span className="font-mono font-bold text-on-surface">{stats?.starlink?.latency_ms ?? 36} ms</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Estado energía UPS:</span>
              <span className="font-mono font-bold text-tertiary">{stats?.starlink?.ups_battery ?? 94}% Batería</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 overflow-hidden mt-1">
              <div
                className="bg-tertiary h-full transition-all duration-500"
                style={{ width: `${stats?.starlink?.ups_battery ?? 94}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: SQLite P2P Mesh */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                REPLICACIÓN P2P MESH
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">
                  {stats?.mesh?.synchronized_records ?? 142} / {stats?.mesh?.total_records ?? 142}
                </span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">
                {stats?.mesh?.sync_percentage ?? 100}% Sincronizado
              </span>
            </div>
            <div className="w-9 h-9 bg-tertiary-container text-on-tertiary-container flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">sync_saved_locally</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Nodos en red mesh:</span>
              <span className="font-mono font-bold text-on-surface">
                {stats?.mesh?.active_peers ?? 6} dispositivos
              </span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Tickets térmicos emitidos:</span>
              <span className="font-mono font-bold text-on-surface">
                {stats?.mesh?.thermal_tickets ?? 104} tickets
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Consultas RENIEC / SIS */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                CONSULTAS RENIEC / PADRÓN
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">{stats?.reniec?.queries_count ?? 142}</span>
                <span className="text-xs text-secondary">consultas</span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">
                {stats?.reniec?.success_rate ?? 98.6}% tasa de éxito
              </span>
            </div>
            <div className="w-9 h-9 bg-surface-container text-on-surface flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Aciertos SQLite Local:</span>
              <span className="font-mono font-bold text-tertiary">
                {stats?.reniec?.sqlite_hits ?? 85}% ({stats?.reniec?.hits_count ?? 121} req)
              </span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Ahorro WAN satelital:</span>
              <span className="font-mono text-secondary">~{stats?.reniec?.wan_saved_mb ?? 14.8} MB</span>
            </div>
          </div>
        </div>

        {/* Card 4: Webhooks Dispatchados & POS */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                WEBHOOKS DISPATCHADOS
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">
                  {stats?.webhooks_summary?.deliveries ?? 312}
                </span>
                <span className="text-[11px] text-on-surface-variant">eventos push</span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">
                {stats?.webhooks_summary?.active ?? 5} conectores activos ({stats?.webhooks_summary?.success_rate ?? 100}% éxito)
              </span>
            </div>
            <div className="w-9 h-9 bg-tertiary-container text-on-tertiary-container flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">send_and_archive</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Impresora Térmica:</span>
              <span className="font-mono font-bold text-on-surface">{stats?.printer?.device_name ?? 'BT-POS-01'}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Sensor de papel:</span>
              <span className="font-mono text-tertiary">{stats?.printer?.paper_sensor ?? 'OK (Rollo con carga)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Interactive Table: Endpoints API & Webhooks Activos */}
      <div className="bg-surface border border-surface-container-high shadow-xs mb-8">
        <div className="p-4 bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-high">
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">api</span>
              Endpoints API &amp; Webhooks Activos
            </h2>
            <p className="text-xs text-on-surface-variant">
              Matriz de transporte de interoperabilidad HL7/FHIR, REST Gubernamental y colas de contingencia.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-3 bg-surface text-xs text-on-surface placeholder:text-outline border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60 transition-all"
                placeholder="Filtrar servicios o URLs..."
                type="text"
              />
              <span className="material-symbols-outlined absolute left-2 top-2 text-[16px] text-outline">search</span>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 px-2 bg-surface text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos los tipos</option>
              <option value="REST_WEBHOOK">Webhook Saliente</option>
              <option value="REST_API">REST Client</option>
              <option value="HL7_FHIR">HL7/FHIR</option>
              <option value="MQTT_IOT">MQTT IoT</option>
              <option value="S3_BUCKET">S3 Bucket</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 bg-surface text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Operativo (Activo)</option>
              <option value="ERROR">Error HTTP</option>
              <option value="INACTIVE">Inactivo</option>
            </select>

            <button
              onClick={() => refetchWebhooks()}
              title="Refrescar lista"
              className="h-8 px-2.5 bg-surface hover:bg-surface-container-high border border-surface-container-high text-on-surface text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${loadingWebhooks ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Carbon Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-on-surface border-collapse">
            <thead className="bg-surface-container-high text-[11px] font-bold tracking-wider uppercase text-on-surface-variant select-none border-b border-surface-container-high">
              <tr>
                <th className="py-3 px-4">Servicio / Destino</th>
                <th className="py-3 px-4">Tipo &amp; Protocolo</th>
                <th className="py-3 px-4">Estado Operativo</th>
                <th className="py-3 px-4">Endpoint URI</th>
                <th className="py-3 px-4">Autenticación / Evento</th>
                <th className="py-3 px-4 text-right">Acciones Directas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loadingWebhooks && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                      <span>Cargando servicios y webhooks...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loadingWebhooks && (!webhooksData?.data || webhooksData.data.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    No se encontraron conectores o webhooks con los filtros aplicados.
                  </td>
                </tr>
              )}

              {webhooksData?.data?.map((hook) => {
                const isTesting = activeTestingId === hook.id
                const isTriggering = activeTriggeringId === hook.id
                const isOperativo = hook.status === 'ACTIVE' && hook.is_enabled
                const isDegradado = hook.status === 'ERROR'
                const isInactivo = !hook.is_enabled || hook.status === 'INACTIVE'

                return (
                  <tr key={hook.id} className="bg-surface hover:bg-surface-container-low transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface flex items-center gap-1.5">
                        {hook.name}
                        {hook.last_latency_ms !== null && (
                          <span className="font-mono text-[10px] text-tertiary">({hook.last_latency_ms}ms)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-on-surface-variant line-clamp-1">{hook.description || 'Sin descripción'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hook.type === 'REST_WEBHOOK'
                              ? 'bg-primary-fixed-dim'
                              : hook.type === 'REST_API'
                              ? 'bg-primary'
                              : hook.type === 'HL7_FHIR'
                              ? 'bg-tertiary'
                              : 'bg-secondary'
                          }`}
                        />
                        {hook.type === 'REST_WEBHOOK'
                          ? 'Webhook Saliente'
                          : hook.type === 'REST_API'
                          ? 'REST Client'
                          : hook.type}
                      </span>
                      <div className="text-[10px] font-mono text-on-surface-variant">{hook.protocol}</div>
                    </td>

                    <td className="py-3 px-4">
                      {isOperativo ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> OPERATIVO
                        </span>
                      ) : isDegradado ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-error-container text-on-error-container font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" /> ERROR HTTP
                        </span>
                      ) : isInactivo ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-surface-container text-on-surface-variant font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" /> INACTIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary-container text-on-primary-fixed font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> EN COLA
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant group-hover:text-primary transition-colors max-w-xs truncate" title={hook.url}>
                      {hook.url}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px] font-mono text-on-surface font-semibold">{hook.event}</div>
                      <div className="text-[10px] text-on-surface-variant">
                        {hook.auth_type !== 'NONE' ? `${hook.auth_type} Auth` : 'Sin autenticación'}
                        {hook.secret ? ' • HMAC SHA-256' : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* Probar Ping */}
                      <button
                        type="button"
                        disabled={isTesting}
                        onClick={() => handleTestPing(hook)}
                        className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-[11px] transition-colors border border-surface-container-high cursor-pointer inline-flex items-center gap-1"
                      >
                        {isTesting && <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>}
                        <span>{isTesting ? 'Probando...' : 'Probar Ping'}</span>
                      </button>

                      {/* Forzar Disparo */}
                      {hook.type === 'REST_WEBHOOK' && (
                        <button
                          type="button"
                          disabled={isTriggering}
                          onClick={() => handleTriggerWebhook(hook)}
                          className="px-2.5 py-1 bg-primary text-on-primary font-semibold text-[11px] hover:bg-on-primary-fixed-variant transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          {isTriggering && <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>}
                          <span>{isTriggering ? 'Enviando...' : 'Forzar Disparo'}</span>
                        </button>
                      )}

                      {/* Ver Logs */}
                      <button
                        type="button"
                        onClick={() => setLogsModalWebhookId(hook.id)}
                        className="px-2 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] transition-colors border border-surface-container-high cursor-pointer"
                      >
                        Ver Logs
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWebhook(hook)
                          setIsModalOpen(true)
                        }}
                        className="px-2 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] transition-colors border border-surface-container-high cursor-pointer"
                      >
                        Editar
                      </button>

                      {/* Toggle On/Off */}
                      <button
                        type="button"
                        onClick={() => handleToggle(hook)}
                        title={hook.is_enabled ? 'Desactivar conector' : 'Activar conector'}
                        className={`px-1.5 py-1 text-[11px] border border-surface-container-high transition-colors cursor-pointer ${
                          hook.is_enabled ? 'text-tertiary hover:bg-surface-container-high' : 'text-outline hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {hook.is_enabled ? 'toggle_on' : 'toggle_off'}
                        </span>
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(hook.id)}
                        title="Eliminar conector"
                        className="px-1.5 py-1 text-on-surface-variant hover:text-error text-[11px] border border-surface-container-high transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Table Action Toolbar footer */}
        <div className="p-3 bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-on-surface-variant border-t border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span>
              Replicador CouchDB local escucha en puerto seguro: <code className="font-mono bg-surface px-1.5 py-0.5 text-on-surface border border-surface-container-high">5984 (TLSv1.3)</code>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Mostrando {webhooksData?.data?.length ?? 0} conectores registrados</span>
            <button
              type="button"
              onClick={handleExportOpenApi}
              className="px-2.5 py-1 bg-surface text-on-surface font-semibold hover:bg-surface-container-high border border-surface-container-high cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>Exportar Spec OpenAPI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split Grid: Mesh P2P Diagram & Terminal Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Mesh P2P Topology (7 cols) */}
        <div className="xl:col-span-7 bg-surface-container p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-container-high">
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary">hub</span>
                Topología Mesh P2P Campamento Rural
              </h2>
              <span className="text-xs text-on-surface-variant">
                Conexiones activas en la red ad-hoc Wi-Fi 6 de campaña sin dependencia de Internet
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-tertiary">
                {topologyData?.total ? `${topologyData.total} nodos online` : '6 nodos online'}
              </span>
              <button
                type="button"
                onClick={handleExportDump}
                className="h-8 px-3 bg-surface hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors border border-surface-container-high shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                <span>Descargar Dump Cifrado (.json)</span>
              </button>
            </div>
          </div>

          {/* Network Topology Visual Grid */}
          <div className="bg-surface p-4 relative overflow-hidden mb-4 border border-surface-container-high">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              {/* Column 1: Client Terminals */}
              <div className="space-y-3">
                <div className="bg-surface-container p-2.5 flex items-center justify-between border border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">laptop_mac</span>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Admisión Mesa 01</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {topologyData?.nodes?.find(n => n.code === 'ADMISION-01')?.ip ?? '192.168.8.10'} • {topologyData?.nodes?.find(n => n.code === 'ADMISION-01')?.latency ?? '1.2ms'}
                      </div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">OK</span>
                </div>

                <div className="bg-surface-container p-2.5 flex items-center justify-between border border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">tablet_android</span>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Box Triaje 01</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {topologyData?.nodes?.find(n => n.code === 'TRIAJE-01')?.ip ?? '192.168.8.20'} • {topologyData?.nodes?.find(n => n.code === 'TRIAJE-01')?.latency ?? '1.5ms'}
                      </div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">OK</span>
                </div>

                <div className="bg-surface-container p-2.5 flex items-center justify-between border border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">tablet_android</span>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Box Triaje 02</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {topologyData?.nodes?.find(n => n.code === 'TRIAJE-02')?.ip ?? '192.168.8.21'} • {topologyData?.nodes?.find(n => n.code === 'TRIAJE-02')?.latency ?? '1.8ms'}
                      </div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">OK</span>
                </div>
              </div>

              {/* Column 2: Central Edge Server Node */}
              <div className="flex flex-col items-center justify-center p-4 bg-primary-container text-on-primary-fixed shadow-md my-2 md:my-0 border border-primary/20">
                <span className="material-symbols-outlined text-[36px] text-primary animate-pulse mb-1">storage</span>
                <div className="font-bold text-xs tracking-wider uppercase text-center">NODO EDGE SERVIDOR</div>
                <div className="text-[11px] font-mono text-on-primary-fixed-variant font-semibold">CUS-VALLE-04</div>
                <div className="mt-2 text-[10px] bg-surface text-on-surface px-2 py-0.5 font-mono border border-surface-container-high">
                  SQLite + CouchDB 3.3
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-on-primary-fixed">
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                  <span>Replicación Bi-direccional P2P</span>
                </div>
              </div>

              {/* Column 3: Medical Consultancies & Peripherals */}
              <div className="space-y-3">
                <div className="bg-surface-container p-2.5 flex items-center justify-between border border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">medical_services</span>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Consultorio 1 (Med)</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">192.168.8.30 • 2.1ms</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">OK</span>
                </div>

                <div className="bg-surface-container p-2.5 flex items-center justify-between border border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">local_pharmacy</span>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Farmacia 01 (Botiquín)</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">192.168.8.40 • 3.0ms</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">OK</span>
                </div>

                <div className="bg-surface-container p-2.5 flex items-center justify-between border border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">print</span>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Impresora POS BT</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">BT-POS-01 • 115200 8N1</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">OK</span>
                </div>
              </div>
            </div>
          </div>

          {/* Protocol Summary Status Line */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-surface p-2.5 border border-surface-container-high">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Latencia Red Mesh:</span>
              <span className="font-semibold text-on-surface text-sm">
                2.1 ms <span className="text-[10px] text-tertiary font-normal">(Óptima LAN)</span>
              </span>
            </div>
            <div className="bg-surface p-2.5 border border-surface-container-high">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Integridad Criptográfica:</span>
              <span className="font-semibold text-on-surface text-sm">Ed25519 Verified</span>
            </div>
            <div className="bg-surface p-2.5 border border-surface-container-high">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Almacenamiento Local:</span>
              <span className="font-semibold text-on-surface text-sm">18.4 GB libres (NVMe)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Terminal Log Stream (5 cols) */}
        <div className="xl:col-span-5 bg-inverse-surface text-inverse-on-surface p-4 shadow-sm flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest/20 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" />
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                <span className="text-xs font-bold uppercase tracking-wider text-surface-container-highest ml-2">
                  stream_telemetria.log
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-surface-container-highest">
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-ping" />
                <span>LIVE 5000ms</span>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="h-80 overflow-y-auto space-y-2 text-[11px] leading-relaxed pr-2 select-text scroll-smooth">
              {terminalLogs.length === 0 ? (
                <div className="text-surface-container-highest/50 py-4 text-center">
                  Iniciando flujo de telemetría en tiempo real...
                </div>
              ) : (
                terminalLogs.map((log) => {
                  let levelColor = 'text-primary'
                  if (log.level === 'WARN') levelColor = 'text-primary-fixed-dim'
                  if (log.level === 'SUCCESS') levelColor = 'text-tertiary'
                  if (log.level === 'ERROR') levelColor = 'text-error'

                  return (
                    <div key={log.id} className="text-surface-container-highest">
                      <span className="text-secondary">[{log.time}]</span>{' '}
                      <span className={`${levelColor} font-bold`}>[{log.level}]</span>{' '}
                      <span className="text-tertiary-fixed">[{log.tag}]</span>{' '}
                      <span>{log.message}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Terminal Input / Quick Actions */}
          <div className="pt-3 border-t border-surface-container-highest/20 flex items-center justify-between text-xs mt-2">
            <div className="flex items-center gap-2 text-surface-container-highest">
              <span className="text-primary font-bold">&gt;</span>
              <span className="animate-pulse">_</span>
              <span className="text-[10px] text-surface-container-highest">Monitoreo activo daemon v2.5.0</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTerminalLogs([])
                addToast('Consola de logs limpiada', 'info')
              }}
              className="text-[11px] text-surface-container-highest hover:text-white px-2 py-0.5 bg-surface-variant/20 hover:bg-surface-variant/40 transition-colors cursor-pointer"
            >
              Limpiar Vista
            </button>
          </div>
        </div>
      </div>

      {/* Operational Alert Box */}
      <div className="bg-primary-container p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[24px] mt-0.5 shrink-0">offline_bolt</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-primary-fixed">Política Offline-First en Ejecución</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Si la antena Starlink pierde visión satelital en el valle, la clínica continúa operando sin interrupción. Los registros clínicos, recetas y turnos se guardan en el servidor local Edge y se propagarán a la nube del MINSA en cuanto se restaure la conectividad.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-mono text-on-surface-variant">Modo: <strong>Tolerante a Partición (AP)</strong></span>
        </div>
      </div>

      {/* Footer Technical Verification Line */}
      <div className="bg-surface-container p-4 text-xs text-on-surface-variant flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-surface-container-high shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
            <span className="font-semibold text-on-surface">Firma de Nodo:</span>
            <code className="font-mono text-[10px] bg-surface px-1.5 py-0.5 border border-surface-container-high">ed25519:8fc72a9e...41b0</code>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-on-surface">API Gateway:</span>
            <span>Semilla Health Core v2.5.0</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-on-surface">Hora Satelital GPS:</span>
            <span className="font-mono text-on-surface font-medium">{gpsClock}</span>
          </div>
        </div>
        <div className="text-[11px] text-on-surface-variant">
          Iniciativa de Salud Rural Semilla • Cusco, Perú
        </div>
      </div>

      {/* ── Modal: Crear / Editar Webhook ────────────────────────── */}
      {isModalOpen && (
        <CreateEditWebhookModal
          initialData={editingWebhook}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingWebhook(null)
          }}
          onSave={(formData) => {
            if (editingWebhook) {
              updateWebhookMutation.mutate(
                { id: editingWebhook.id, ...formData },
                {
                  onSuccess: () => {
                    addToast(`Conector ${formData.name} actualizado.`, 'success')
                    setIsModalOpen(false)
                    setEditingWebhook(null)
                    refetchWebhooks()
                  },
                  onError: (err: any) => {
                    const msg = err.response?.data?.message || 'Error al actualizar conector'
                    addToast(msg, 'error')
                  },
                }
              )
            } else {
              createWebhookMutation.mutate(formData, {
                onSuccess: () => {
                  addToast(`Nuevo conector ${formData.name} registrado.`, 'success')
                  setIsModalOpen(false)
                  refetchWebhooks()
                },
                onError: (err: any) => {
                  const msg = err.response?.data?.message || 'Error al registrar conector'
                  addToast(msg, 'error')
                },
              })
            }
          }}
          isSubmitting={createWebhookMutation.isPending || updateWebhookMutation.isPending}
        />
      )}

      {/* ── Modal: Ver Logs de Entregas ──────────────────────────── */}
      {logsModalWebhookId !== null && (
        <WebhookLogsModal
          webhookId={logsModalWebhookId}
          onClose={() => setLogsModalWebhookId(null)}
        />
      )}

      {/* ── Modal: Confirmar Eliminación ─────────────────────────── */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface border border-surface-container-high p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">warning</span>
              ¿Eliminar Conector / Webhook?
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Esta acción eliminará la configuración del conector y todo su historial de entregas registradas. Esta operación no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteWebhookMutation.isPending}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-error text-on-error hover:bg-error/90 cursor-pointer"
              >
                {deleteWebhookMutation.isPending ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Sub-Componente Modal: Crear o Editar Webhook
──────────────────────────────────────────────────────────────── */
function CreateEditWebhookModal({
  initialData,
  isOpen,
  onClose,
  onSave,
  isSubmitting,
}: {
  initialData: WebhookItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  isSubmitting: boolean
}) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [type, setType] = useState<WebhookItem['type']>(initialData?.type || 'REST_WEBHOOK')
  const [protocol, setProtocol] = useState(initialData?.protocol || 'HTTPS/POST')
  const [url, setUrl] = useState(initialData?.url || '')
  const [event, setEvent] = useState(initialData?.event || 'on_patient_consultation_closed')
  const [authType, setAuthType] = useState<WebhookItem['auth_type']>(initialData?.auth_type || 'NONE')
  const [authToken, setAuthToken] = useState(initialData?.auth_token || '')
  const [secret, setSecret] = useState(initialData?.secret || '')
  const [isEnabled, setIsEnabled] = useState(initialData ? initialData.is_enabled : true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim() || !event.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      type,
      protocol,
      url: url.trim(),
      event: event.trim(),
      auth_type: authType,
      auth_token: authToken.trim() || null,
      secret: secret.trim() || null,
      is_enabled: isEnabled,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-surface border border-surface-container-high max-w-2xl w-full shadow-2xl my-8 animate-fade-in flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-surface-container border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              {initialData ? 'edit_note' : 'add_link'}
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
              {initialData ? 'Editar Conector / Webhook' : 'Nuevo Webhook o Conector'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Nombre del Servicio / Destino *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: DIRESA Cusco - Exportación HIS"
                className="w-full h-8 px-2.5 bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Tipo de Integración *
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as WebhookItem['type']
                  setType(t)
                  if (t === 'REST_API') setProtocol('HTTPS/GET')
                  else if (t === 'REST_WEBHOOK') setProtocol('HTTPS/POST')
                  else if (t === 'HL7_FHIR') setProtocol('HTTPS/POST')
                  else if (t === 'MQTT_IOT') setProtocol('MQTT/TLS')
                  else if (t === 'S3_BUCKET') setProtocol('S3/PUT')
                }}
                className="w-full h-8 px-2 bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              >
                <option value="REST_WEBHOOK">Webhook Saliente (Push HTTP)</option>
                <option value="REST_API">REST Client (Pull / Ingesta)</option>
                <option value="HL7_FHIR">HL7 / FHIR R4 Endpoint</option>
                <option value="MQTT_IOT">MQTT IoT Broker</option>
                <option value="S3_BUCKET">S3 Cloud Storage Bucket</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1">
              Descripción Funcional
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ej: Reporte estadístico diario CIE-10 para posta cabecera"
              className="w-full h-8 px-2.5 bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-on-surface mb-1">
                Endpoint URL / URI *
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.minsa.gob.pe/v1/..."
                className="w-full h-8 px-2.5 font-mono text-[11px] bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Protocolo de Transporte
              </label>
              <input
                type="text"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                placeholder="HTTPS/POST"
                className="w-full h-8 px-2.5 font-mono text-[11px] bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Evento Disparador *
              </label>
              <input
                type="text"
                required
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="on_patient_consultation_closed"
                className="w-full h-8 px-2.5 font-mono text-[11px] bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
              <span className="text-[10px] text-on-surface-variant">
                ej: on_patient_consultation_closed, on_medication_low_stock, PING_HEALTHCHECK
              </span>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Tipo de Autenticación
              </label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as WebhookItem['auth_type'])}
                className="w-full h-8 px-2 bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              >
                <option value="NONE">Sin Autenticación (Pública)</option>
                <option value="BEARER">Bearer Token (Header Authorization)</option>
                <option value="API_KEY">API Key (X-Api-Key)</option>
                <option value="HMAC">HMAC SHA-256 Signature (X-Triaje-Signature)</option>
                <option value="BASIC">HTTP Basic Auth</option>
              </select>
            </div>
          </div>

          {authType !== 'NONE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-surface-container border border-surface-container-high">
              {authType !== 'HMAC' && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-on-surface mb-1">
                    Token de Autenticación / Clave API
                  </label>
                  <input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                    className="w-full h-8 px-2.5 font-mono text-[11px] bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-semibold text-on-surface mb-1">
                  Secreto Compartido HMAC (Opcional para verificación de firma)
                </label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="whsec_19827361549..."
                  className="w-full h-8 px-2.5 font-mono text-[11px] bg-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_enabled_chk"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor="is_enabled_chk" className="text-xs text-on-surface cursor-pointer select-none">
              Habilitar conector inmediatamente para entregas automáticas
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-surface-container-high flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-on-primary-fixed-variant text-on-primary cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              <span>{initialData ? 'Guardar Cambios' : 'Registrar Conector'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Sub-Componente Modal: Historial de Entregas (Logs)
──────────────────────────────────────────────────────────────── */
function WebhookLogsModal({
  webhookId,
  onClose,
}: {
  webhookId: number
  onClose: () => void
}) {
  const { data: logsData, isLoading, refetch } = useWebhookLogs(webhookId)
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDeliveryItem | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-surface border border-surface-container-high max-w-4xl w-full shadow-2xl my-8 animate-fade-in flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-surface-container border-b border-surface-container-high flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">history</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                Historial de Entregas: {logsData?.webhook?.name || 'Webhook'}
              </h2>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5 truncate max-w-lg">
              {logsData?.webhook?.url}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-1 hover:bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
              title="Refrescar"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer text-sm"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              <span>Cargando entregas...</span>
            </div>
          ) : !logsData?.data || logsData.data.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              No hay registros de entregas recientes para este conector.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-surface-container-high">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container text-[11px] font-bold uppercase text-on-surface-variant border-b border-surface-container-high">
                    <tr>
                      <th className="py-2.5 px-3">Fecha / Hora</th>
                      <th className="py-2.5 px-3">Evento</th>
                      <th className="py-2.5 px-3">Código HTTP</th>
                      <th className="py-2.5 px-3">Latencia</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high font-mono">
                    {logsData.data.map((d) => (
                      <tr
                        key={d.id}
                        className={`hover:bg-surface-container-low transition-colors cursor-pointer ${
                          selectedDelivery?.id === d.id ? 'bg-primary-container/20' : ''
                        }`}
                        onClick={() => setSelectedDelivery(d)}
                      >
                        <td className="py-2.5 px-3 text-on-surface-variant">
                          {new Date(d.created_at).toLocaleTimeString('es-PE')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-primary">{d.event}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold ${
                              d.response_status && d.response_status >= 200 && d.response_status < 400
                                ? 'bg-tertiary-container text-on-tertiary-container'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {d.response_status ? `HTTP ${d.response_status}` : 'ERROR 0'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-on-surface">{d.duration_ms} ms</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold text-[10px] ${
                              d.status === 'SUCCESS' ? 'text-tertiary' : 'text-error'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDelivery(d)
                            }}
                            className="text-[11px] text-primary hover:underline font-sans cursor-pointer"
                          >
                            Inspeccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Delivery Inspector Details */}
              {selectedDelivery && (
                <div className="p-4 bg-surface-container border border-surface-container-high space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
                    <span className="font-bold uppercase tracking-wider text-on-surface">
                      Inspección de Entrega #{selectedDelivery.id}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {selectedDelivery.created_at}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant block mb-1">
                      Payload JSON Enviado:
                    </span>
                    <pre className="p-2.5 bg-inverse-surface text-inverse-on-surface text-[11px] font-mono overflow-x-auto max-h-40">
                      {JSON.stringify(selectedDelivery.request_payload, null, 2)}
                    </pre>
                  </div>

                  {selectedDelivery.response_body && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-on-surface-variant block mb-1">
                        Respuesta del Destino:
                      </span>
                      <pre className="p-2.5 bg-surface border border-surface-container-high text-on-surface text-[11px] font-mono overflow-x-auto max-h-32">
                        {selectedDelivery.response_body}
                      </pre>
                    </div>
                  )}

                  {selectedDelivery.error_message && (
                    <div className="p-2 bg-error-container text-on-error-container font-mono text-[11px]">
                      <strong>Error:</strong> {selectedDelivery.error_message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container border-t border-surface-container-high flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-surface hover:bg-surface-container-high border border-surface-container-high text-on-surface cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
