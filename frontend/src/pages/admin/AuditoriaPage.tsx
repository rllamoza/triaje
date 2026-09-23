import { useState, useEffect } from 'react'
import { auditApi, type AuditStatus, type AuditRecordItem, type AuditLogsResponse } from '../../api/auditApi'

export default function AuditoriaPage() {
  const [status, setStatus] = useState<AuditStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [toggling, setToggling] = useState(false)

  // Filtros
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('TODOS')
  const [httpStatus, setHttpStatus] = useState('all')
  const [page, setPage] = useState(1)

  // Logs
  const [logsData, setLogsData] = useState<AuditLogsResponse | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordItem | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Cargar estado general de audi_triaje
  const loadStatus = async () => {
    try {
      setLoadingStatus(true)
      const data = await auditApi.getStatus()
      setStatus(data)
    } catch (err) {
      console.error('Error al cargar status de auditoría:', err)
    } finally {
      setLoadingStatus(false)
    }
  }

  // Cargar registros con filtros
  const loadLogs = async () => {
    try {
      setLoadingLogs(true)
      const params: Record<string, any> = {
        page,
        per_page: 20,
      }
      if (search.trim()) params.search = search.trim()
      if (category !== 'TODOS') params.category = category
      if (httpStatus !== 'all') params.status = httpStatus

      const data = await auditApi.getLogs(params)
      setLogsData(data)
    } catch (err) {
      console.error('Error al cargar logs forenses:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [page, category, httpStatus])

  // Manejar búsqueda con enter o botón
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadLogs()
  }

  // Conmutador (Activar / Desactivar)
  const handleToggle = async () => {
    if (!status) return
    const newState = !status.enabled
    try {
      setToggling(true)
      await auditApi.toggle(newState)
      await loadStatus()
      loadLogs()
    } catch (err) {
      console.error('Error al cambiar estado de auditoría:', err)
    } finally {
      setToggling(false)
    }
  }

  // Exportar CSV
  const handleExportCsv = () => {
    const params: Record<string, any> = {}
    if (search.trim()) params.search = search.trim()
    const url = auditApi.exportCsvUrl(params)
    window.open(url, '_blank')
  }

  // Copiar JSON del registro seleccionado
  const handleCopyJson = () => {
    if (!selectedRecord) return
    navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2))
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 2000)
  }

  // Helper de icono de dispositivo
  const getDeviceIcon = (os?: string | null) => {
    const lower = (os || '').toLowerCase()
    if (lower.includes('win')) return 'desktop_windows'
    if (lower.includes('android')) return 'phone_android'
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) return 'smartphone'
    if (lower.includes('mac')) return 'laptop_mac'
    if (lower.includes('linux')) return 'terminal'
    return 'devices'
  }

  // Helper de método HTTP
  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      default:
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
    }
  }

  // Helper de estatus HTTP
  const getStatusBadgeClass = (code: number) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    }
    if (code >= 300 && code < 400) {
      return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
    }
    if (code >= 400 && code < 500) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    }
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
  }

  return (
    <div className="flex flex-col w-full pb-20 text-on-surface">
      {/* ── Encabezado de la página ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              MÓDULO DE SEGURIDAD
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className={`w-1.5 h-1.5 rounded-full ${status?.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              BD: {status?.db_name ?? 'audi_triaje'}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Auditoría Forense <span className="font-semibold text-primary">&amp; Telemetría de Dispositivos</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Registro inmutable de acciones, huella de hardware, IPs de conexión y métricas de red en base de datos dedicada.
          </p>
        </div>

        {/* Botón Switch Maestro */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-10 px-4 bg-surface hover:bg-surface-container border border-surface-container-high text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer text-on-surface shadow-xs"
            title="Exportar logs a Excel / CSV"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            disabled={toggling || loadingStatus}
            onClick={handleToggle}
            className={`h-10 px-5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer shadow-xs ${
              status?.enabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-surface-container-highest hover:bg-surface-container-high text-on-surface border border-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {status?.enabled ? 'toggle_on' : 'toggle_off'}
            </span>
            <span>
              {toggling
                ? 'Actualizando...'
                : status?.enabled
                ? 'Auditoría ACTIVADA'
                : 'Auditoría DESACTIVADA'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Bento Grid: Estado y Diagnóstico de audi_triaje ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tarjeta 1: Switch y Estado */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                ESTADO DEL MÓDULO
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${status?.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-on-surface-variant'}`}>
                  {status?.enabled ? 'En Ejecución' : 'En Pausa'}
                </span>
              </div>
            </div>
            <div className={`w-9 h-9 flex items-center justify-center ${status?.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-surface-container text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[22px]">
                {status?.enabled ? 'shield' : 'shield_with_heart'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            {status?.enabled
              ? 'El middleware registra cada petición en etapa terminate() sin latencia para el usuario.'
              : 'La captura se omite en memoria inmediatamente.'}
          </p>
        </div>

        {/* Tarjeta 2: Conexión audi_triaje */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                BASE DE DATOS DEDICADA
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-on-surface">{status?.db_name ?? 'audi_triaje'}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {status?.db_connected ? 'En línea' : 'Desconectada'}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 bg-primary-container text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container">
            <span>Espacio en disco:</span>
            <span className="font-mono font-bold text-on-surface">{status?.db_size_mb ?? 0} MB</span>
          </div>
        </div>

        {/* Tarjeta 3: Total Registros */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                VOLUMEN DE EVENTOS
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface font-mono">
                  {status?.total_records?.toLocaleString() ?? 0}
                </span>
                <span className="text-xs text-primary font-medium">totales</span>
              </div>
            </div>
            <div className="w-9 h-9 bg-surface-container text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">history</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container">
            <span>Registrados hoy:</span>
            <span className="font-mono font-bold text-primary">{status?.records_today ?? 0}</span>
          </div>
        </div>

        {/* Tarjeta 4: Errores / Alertas */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                INCIDENCIAS / HTTP 4XX-5XX
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono ${(status?.error_records ?? 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {status?.error_records ?? 0}
                </span>
                <span className="text-xs text-on-surface-variant">incidentes</span>
              </div>
            </div>
            <div className={`w-9 h-9 flex items-center justify-center ${(status?.error_records ?? 0) > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
              <span className="material-symbols-outlined text-[20px]">
                {(status?.error_records ?? 0) > 0 ? 'warning' : 'verified_user'}
              </span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container">
            <span>Última traza:</span>
            <span className="font-mono text-[11px] truncate max-w-[120px]">
              {status?.last_record?.endpoint ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Filtros Forenses ───────────────────────────── */}
      <div className="bg-surface p-4 border border-surface-container-high mb-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            {/* Input de Búsqueda */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por usuario, DNI, IP, endpoint o sistema operativo..."
                className="w-full pl-9 pr-3 py-2 bg-surface-container border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Selector de Categoría */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              aria-label="Filtrar por categoría del sistema"
              className="px-3 py-2 bg-surface-container border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value="TRIAJE">Triaje Clínico</option>
              <option value="CONSULTA">Consulta Médica</option>
              <option value="ADMISION">Admisión / Pacientes</option>
              <option value="TICKETS">Tickets Térmicos</option>
              <option value="SEGURIDAD_AUTH">Seguridad / Auth</option>
              <option value="ADMINISTRACION">Administración</option>
              <option value="GENERAL">General</option>
            </select>

            {/* Selector de Estatus */}
            <select
              value={httpStatus}
              onChange={(e) => {
                setHttpStatus(e.target.value)
                setPage(1)
              }}
              aria-label="Filtrar por estatus HTTP"
              className="px-3 py-2 bg-surface-container border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="all">Todos los Estatus</option>
              <option value="success">Solo Exitosos (2xx/3xx)</option>
              <option value="error">Solo Errores (4xx/5xx)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              <span>Filtrar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategory('TODOS')
                setHttpStatus('all')
                setPage(1)
                loadLogs()
              }}
              className="h-9 px-3 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-xs text-on-surface-variant flex items-center justify-center cursor-pointer"
              title="Limpiar filtros"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── Tabla de Logs Forenses ───────────────────────────────── */}
      <div className="bg-surface border border-surface-container-high overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container border-b border-surface-container-high text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-3">Fecha &amp; Hora</th>
                <th className="py-3 px-3">Usuario / DNI</th>
                <th className="py-3 px-3">Acción &amp; Endpoint</th>
                <th className="py-3 px-3 text-center">Estado HTTP</th>
                <th className="py-3 px-3">Dispositivo &amp; SO</th>
                <th className="py-3 px-3">Red &amp; IP</th>
                <th className="py-3 px-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loadingLogs ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl animate-spin text-primary block mb-2">
                      progress_activity
                    </span>
                    <span>Cargando registros forenses de audi_triaje...</span>
                  </td>
                </tr>
              ) : !logsData?.data?.length ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 block mb-2">
                      manage_search
                    </span>
                    <span>No se encontraron eventos de auditoría con los filtros seleccionados.</span>
                  </td>
                </tr>
              ) : (
                logsData.data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-container/50 transition-colors"
                  >
                    {/* 1. Fecha */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono text-on-surface font-medium">
                        {new Date(item.created_at).toLocaleTimeString('es-PE', { hour12: false })}
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {new Date(item.created_at).toLocaleDateString('es-PE')}
                      </div>
                    </td>

                    {/* 2. Usuario */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-on-surface truncate max-w-[180px]">
                        {item.user_name || 'Sistema / Invitado'}
                      </div>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                        {item.user_dni && <span className="font-mono">DNI: {item.user_dni}</span>}
                        {item.user_role && (
                          <span className="px-1 py-0.2 text-[9px] uppercase font-bold bg-surface-container-high text-on-surface rounded-xs">
                            {item.user_role}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Acción y Endpoint */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 font-mono text-[10px] font-bold border rounded-xs ${getMethodBadgeClass(item.method)}`}>
                          {item.method}
                        </span>
                        <span className="font-mono text-[11px] text-on-surface truncate max-w-[220px]" title={item.endpoint}>
                          {item.endpoint}
                        </span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant flex items-center gap-2">
                        <span className="uppercase font-semibold tracking-wider text-primary">
                          {item.action_category}
                        </span>
                        {item.duration_ms !== null && (
                          <span className="font-mono text-[10px]">
                            {item.duration_ms} ms
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Estado HTTP */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 font-mono font-bold text-[11px] border rounded-xs ${getStatusBadgeClass(item.status_code)}`}>
                        {item.status_code}
                      </span>
                    </td>

                    {/* 5. Dispositivo */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                          {getDeviceIcon(item.device_os)}
                        </span>
                        <span className="truncate max-w-[130px]">
                          {item.device_os || 'Desconocido'}
                        </span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant truncate max-w-[130px]">
                        {item.device_browser || 'Navegador N/D'}
                      </div>
                    </td>

                    {/* 6. Red e IP */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-on-surface">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                          router
                        </span>
                        <span>{item.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1 py-0.2 text-[9px] font-semibold uppercase rounded-xs ${
                          item.is_local_ip
                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                            : 'bg-primary-container text-on-primary-container'
                        }`}>
                          {item.is_local_ip ? 'LAN Privada' : 'WAN Pública'}
                        </span>
                        {item.network_effective_type && (
                          <span className="text-[10px] text-on-surface-variant uppercase font-mono">
                            {item.network_effective_type} {item.network_rtt_ms ? `(${item.network_rtt_ms}ms)` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. Botón Detalle */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(item)}
                        className="p-1.5 hover:bg-primary/10 text-primary transition-colors cursor-pointer rounded-xs"
                        title="Abrir caja negra forense"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          visibility
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {logsData && logsData.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface-container border-t border-surface-container-high text-xs text-on-surface-variant">
            <div>
              Mostrando del <span className="font-semibold text-on-surface">{logsData.from}</span> al{' '}
              <span className="font-semibold text-on-surface">{logsData.to}</span> de{' '}
              <span className="font-semibold text-on-surface">{logsData.total}</span> eventos
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-surface border border-surface-container-high disabled:opacity-40 hover:bg-surface-container cursor-pointer"
              >
                Anterior
              </button>
              <span className="px-3 font-mono font-semibold text-on-surface">
                {logsData.current_page} / {logsData.last_page}
              </span>
              <button
                type="button"
                disabled={page >= logsData.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 bg-surface border border-surface-container-high disabled:opacity-40 hover:bg-surface-container cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Forense: Caja Negra e Inspección Completa ───────── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="bg-surface border border-surface-container-high shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-container-high bg-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  policy
                </span>
                <div>
                  <h3 className="font-semibold text-sm text-on-surface">
                    Inspección Forense • Evento #{selectedRecord.id}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    {new Date(selectedRecord.created_at).toLocaleString('es-PE')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 bg-surface border border-surface-container-high text-xs text-on-surface hover:bg-surface-container flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copyFeedback ? 'check' : 'content_copy'}
                  </span>
                  <span>{copyFeedback ? 'Copiado' : 'Copiar JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Sección 1: Identidad y Petición */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container/50 p-4 border border-surface-container-high">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    IDENTIDAD DEL OPERADOR
                  </span>
                  <div className="space-y-1">
                    <div className="font-semibold text-on-surface text-sm">
                      {selectedRecord.user_name || 'Operador Anónimo / Petición Pública'}
                    </div>
                    <div className="text-on-surface-variant">DNI: <span className="font-mono">{selectedRecord.user_dni || '-'}</span></div>
                    <div className="text-on-surface-variant">Rol: <span className="font-semibold text-primary">{selectedRecord.user_role || '-'}</span></div>
                    <div className="text-on-surface-variant">Estación: <span className="font-mono">{selectedRecord.station || 'Por defecto'}</span></div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    PETICIÓN HTTP
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 font-mono font-bold text-[10px] border ${getMethodBadgeClass(selectedRecord.method)}`}>
                        {selectedRecord.method}
                      </span>
                      <span className={`px-1.5 py-0.2 font-mono font-bold text-[10px] border ${getStatusBadgeClass(selectedRecord.status_code)}`}>
                        HTTP {selectedRecord.status_code}
                      </span>
                      <span className="font-mono text-on-surface-variant">{selectedRecord.duration_ms} ms</span>
                    </div>
                    <div className="font-mono text-[11px] text-on-surface break-all pt-1">
                      {selectedRecord.url}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 2: Telemetría de Red y Dispositivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container/50 p-4 border border-surface-container-high">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    TELEMETRÍA DE RED &amp; CONEXIÓN
                  </span>
                  <div className="space-y-1 text-on-surface-variant">
                    <div>Dirección IP: <span className="font-mono font-bold text-on-surface">{selectedRecord.ip_address}</span> ({selectedRecord.is_local_ip ? 'LAN Privada' : 'WAN Pública'})</div>
                    {selectedRecord.hostname && <div>Hostname: <span className="font-mono text-on-surface">{selectedRecord.hostname}</span></div>}
                    <div>Tipo de enlace: <span className="font-mono text-on-surface uppercase">{selectedRecord.network_effective_type || 'Desconocido'}</span></div>
                    {selectedRecord.network_rtt_ms && <div>Latencia RTT: <span className="font-mono text-on-surface">{selectedRecord.network_rtt_ms} ms</span></div>}
                    {selectedRecord.network_downlink_mbps && <div>Velocidad estimada: <span className="font-mono text-on-surface">{selectedRecord.network_downlink_mbps} Mbps</span></div>}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    HUELLA DIGITAL DEL DISPOSITIVO
                  </span>
                  <div className="space-y-1 text-on-surface-variant">
                    <div>Dispositivo: <span className="font-semibold text-on-surface">{selectedRecord.device_type || 'Desktop'}</span></div>
                    <div>Sistema Operativo: <span className="font-semibold text-on-surface">{selectedRecord.device_os || 'N/D'}</span></div>
                    <div>Navegador: <span className="font-semibold text-on-surface">{selectedRecord.device_browser || 'N/D'}</span></div>
                    {selectedRecord.screen_resolution && <div>Resolución de pantalla: <span className="font-mono text-on-surface">{selectedRecord.screen_resolution}</span></div>}
                    {selectedRecord.client_timezone && <div>Zona horaria: <span className="font-mono text-on-surface">{selectedRecord.client_timezone}</span></div>}
                  </div>
                </div>
              </div>

              {/* Sección 3: Error Message si existe */}
              {selectedRecord.error_message && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                    MENSAJE DE EXCEPCIÓN / ERROR
                  </span>
                  <pre className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {selectedRecord.error_message}
                  </pre>
                </div>
              )}

              {/* Sección 4: Payload Sanitizado */}
              {selectedRecord.request_payload && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    PARÁMETROS Y CARGA ÚTIL ENVIADA (SANITIZADA)
                  </span>
                  <pre className="p-3 bg-surface-container font-mono text-[11px] text-on-surface border border-surface-container-high overflow-x-auto">
                    {JSON.stringify(selectedRecord.request_payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Sección 5: User-Agent Raw */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  CABECERA USER-AGENT RAW
                </span>
                <div className="p-2.5 bg-surface-container font-mono text-[10px] text-on-surface-variant break-all border border-surface-container-high">
                  {selectedRecord.user_agent || 'No enviada'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-surface-container-high bg-surface-container flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-surface hover:bg-surface-container-high border border-surface-container-high text-xs font-semibold uppercase cursor-pointer"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
