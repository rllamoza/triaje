import { useState, useMemo } from 'react'
import { useStockPublico, type StockPublicoMedicamento } from '../../api/hooks'
import { Link } from 'react-router-dom'

export default function StockPublicoPage() {
  const [refreshInterval, setRefreshInterval] = useState<number>(4000)
  const { data, isLoading, isFetching, isError, error, refetch } = useStockPublico(refreshInterval)

  // Filtros locales
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'disponible' | 'bajo' | 'agotado'>('todos')
  const [selectedVia, setSelectedVia] = useState<string>('todas')
  const [selectedClasificacion, setSelectedClasificacion] = useState<string>('todas')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [copiedLink, setCopiedLink] = useState(false)

  // Vías únicas
  const availableVias = useMemo(() => {
    if (!data?.data) return []
    const set = new Set<string>()
    data.data.forEach((m) => {
      if (m.via_administracion) set.add(m.via_administracion)
    })
    return Array.from(set)
  }, [data?.data])

  // Clasificaciones terapéuticas únicas
  const availableClasificaciones = useMemo(() => {
    if (!data?.data) return []
    const set = new Set<string>()
    data.data.forEach((m) => {
      if (m.clasificacion && m.clasificacion.trim()) {
        set.add(m.clasificacion.trim())
      }
    })
    return Array.from(set).sort()
  }, [data?.data])

  // Filtrado reactivo
  const filteredMeds = useMemo(() => {
    if (!data?.data) return []
    const q = searchTerm.toLowerCase().trim()

    return data.data.filter((m) => {
      // Estado
      if (selectedStatus !== 'todos' && m.status_stock !== selectedStatus) {
        return false
      }
      // Vía
      if (selectedVia !== 'todas' && m.via_administracion?.toLowerCase() !== selectedVia.toLowerCase()) {
        return false
      }
      // Clasificación
      if (selectedClasificacion !== 'todas' && (m.clasificacion || '').toLowerCase() !== selectedClasificacion.toLowerCase()) {
        return false
      }
      // Búsqueda
      if (!q) return true
      return (
        (m.nombre_generico || '').toLowerCase().includes(q) ||
        (m.nombre_comercial || '').toLowerCase().includes(q) ||
        (m.concentracion || '').toLowerCase().includes(q) ||
        (m.forma_farmaceutica || '').toLowerCase().includes(q) ||
        (m.codigo || '').toLowerCase().includes(q) ||
        (m.clasificacion || '').toLowerCase().includes(q) ||
        (m.uso || '').toLowerCase().includes(q)
      )
    })
  }, [data?.data, searchTerm, selectedStatus, selectedVia, selectedClasificacion])

  // Copiar link público
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // Pantalla completa
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const campaign = data?.campaign
  const stats = data?.stats ?? { disponibles: 0, bajos: 0, agotados: 0 }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Barra Superior de Monitoreo en Vivo */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Título e Identidad */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <span className="material-symbols-outlined text-2xl">local_pharmacy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Farmacia en Vivo <span className="text-emerald-600 font-extrabold">• Stock de Medicamentos</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>{campaign?.name || 'Campaña Médica Activa'} {campaign?.location_name ? `• ${campaign.location_name}` : ''}</span>
                {data?.timestamp && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">• Sinc: {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                )}
              </p>
            </div>
          </div>

          {/* Acciones y Estado de Sincronización */}
          <div className="flex items-center gap-2 text-xs">
            {/* Auto-refresco select */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-sm text-slate-500">sync</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Refresco:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value={3000}>Cada 3 seg</option>
                <option value={5000}>Cada 5 seg</option>
                <option value={10000}>Cada 10 seg</option>
                <option value={0}>Pausado</option>
              </select>
            </div>

            {/* Botón Refrescar Manual */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Actualizar stock ahora"
              className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className={`material-symbols-outlined text-sm ${isFetching ? 'animate-spin text-emerald-600' : ''}`}>
                refresh
              </span>
              <span className="hidden sm:inline font-medium">Actualizar</span>
            </button>

            {/* Copiar Enlace Público */}
            <button
              onClick={handleCopyLink}
              title="Copiar enlace para médicos y personal de salud"
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-md flex items-center gap-1 cursor-pointer font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {copiedLink ? 'check' : 'share'}
              </span>
              <span className="hidden sm:inline">{copiedLink ? '¡Enlace Copiado!' : 'Compartir Pantalla'}</span>
            </button>

            {/* Pantalla Completa */}
            <button
              onClick={toggleFullScreen}
              title="Alternar Pantalla Completa"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">fullscreen</span>
            </button>

            {/* Enlace al Sistema Principal */}
            <Link
              to="/farmacia"
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-md font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span className="hidden sm:inline">Sistema</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full flex-1">
        {/* Tarjetas KPI de Estado de Stock (Compactas en celular) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Total */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="material-symbols-outlined text-xs sm:text-sm text-primary shrink-0">medication</span>
              <span className="truncate">Catálogo Total</span>
            </div>
            <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
              {data?.total ?? 0}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              {data?.unidades_totales ?? 0} <span className="hidden sm:inline">unidades físicas</span><span className="sm:hidden">unid.</span>
            </div>
          </div>

          {/* Disponibles */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="material-symbols-outlined text-xs sm:text-sm text-emerald-600 shrink-0">check_circle</span>
              <span className="truncate">Disponibles</span>
            </div>
            <div className="text-xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">
              {stats.disponibles}
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 truncate">
              <span className="hidden sm:inline">Stock óptimo para recetar</span><span className="sm:hidden">Óptimo</span>
            </div>
          </div>

          {/* Por Agotarse */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="material-symbols-outlined text-xs sm:text-sm text-amber-600 shrink-0">warning</span>
              <span className="truncate">Stock Crítico</span>
            </div>
            <div className="text-xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
              {stats.bajos}
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 truncate">
              <span className="hidden sm:inline">Próximos a agotarse</span><span className="sm:hidden">Por agotarse</span>
            </div>
          </div>

          {/* Agotados */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="material-symbols-outlined text-xs sm:text-sm text-rose-600 shrink-0">block</span>
              <span className="truncate">Agotados</span>
            </div>
            <div className="text-xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-1">
              {stats.agotados}
            </div>
            <div className="text-[10px] sm:text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5 font-semibold truncate">
              ⚠️ <span className="hidden sm:inline">No prescribir</span><span className="sm:hidden">Cero</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Controles de Vista */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Input de Búsqueda rápida */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nombre Genérico, Comercial, Código, Clasificación..."
                className="w-full h-9 sm:h-10 pl-10 pr-9 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Conmutador de modo de visualización */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">grid_view</span>
                  <span>Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">table_rows</span>
                  <span>Tabla</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros rápidos: Estado, Vía y Clasificación */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            {/* Fila 1: Píldoras de Estado */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Estado:</span>
                <button
                  onClick={() => setSelectedStatus('todos')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    selectedStatus === 'todos'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todos ({data?.data?.length ?? 0})
                </button>
                <button
                  onClick={() => setSelectedStatus('disponible')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    selectedStatus === 'disponible'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  Disponibles ({stats.disponibles})
                </button>
                <button
                  onClick={() => setSelectedStatus('bajo')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    selectedStatus === 'bajo'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                  }`}
                >
                  Bajo Stock ({stats.bajos})
                </button>
                <button
                  onClick={() => setSelectedStatus('agotado')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    selectedStatus === 'agotado'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                  }`}
                >
                  Agotados ({stats.agotados})
                </button>
              </div>

              {/* Botón resetear filtros si hay alguno activo */}
              {(selectedStatus !== 'todos' || selectedVia !== 'todas' || selectedClasificacion !== 'todas' || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedStatus('todos')
                    setSelectedVia('todas')
                    setSelectedClasificacion('todas')
                    setSearchTerm('')
                  }}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-xs">clear_all</span>
                  Restablecer filtros
                </button>
              )}
            </div>

            {/* Fila 2: Filtro por Clasificación Terapéutica */}
            {availableClasificaciones.length > 0 && (
              <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 max-w-full">
                <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1 shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">category</span>
                  Clasificación:
                </span>
                <button
                  onClick={() => setSelectedClasificacion('todas')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 cursor-pointer ${
                    selectedClasificacion === 'todas'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
                {availableClasificaciones.map((clasif) => (
                  <button
                    key={clasif}
                    onClick={() => setSelectedClasificacion(clasif)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 cursor-pointer ${
                      selectedClasificacion === clasif
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {clasif}
                  </button>
                ))}
              </div>
            )}

            {/* Fila 3: Filtro por Vía de Administración */}
            {availableVias.length > 0 && (
              <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 max-w-full">
                <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1 shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-indigo-500">route</span>
                  Vía:
                </span>
                <button
                  onClick={() => setSelectedVia('todas')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 cursor-pointer ${
                    selectedVia === 'todas'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
                {availableVias.map((via) => (
                  <button
                    key={via}
                    onClick={() => setSelectedVia(via)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase shrink-0 cursor-pointer ${
                      selectedVia === via
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {via}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerta de Error de Conexión */}
        {isError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">sync_problem</span>
              <span>
                No se pudo sincronizar el inventario: {(error as any)?.message || 'Sin conexión'}.
                Reintentando automáticamente cada {refreshInterval ? `${refreshInterval / 1000}s` : 'instante'}...
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido: Listado de Fármacos */}
        {isLoading && (
          <div className="p-12 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600 mb-2">
              progress_activity
            </span>
            <p className="text-sm">Cargando inventario de farmacia en tiempo real...</p>
          </div>
        )}

        {!isLoading && filteredMeds.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inventory_2</span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No se encontraron medicamentos con los filtros seleccionados
            </p>
            <p className="text-xs text-slate-400 mt-1">Pruebe limpiando el término de búsqueda o cambiando el filtro de estado.</p>
          </div>
        )}

        {/* VISTA 1: TARJETAS VISUALES (IDEAL PARA DOCTORES Y PANTALLAS GRANDES) */}
        {!isLoading && viewMode === 'grid' && filteredMeds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMeds.map((m) => (
              <MedicamentoStockCard key={m.id} item={m} />
            ))}
          </div>
        )}

        {/* VISTA 2: TABLA DETALLADA DE ALTA DENSIDAD */}
        {!isLoading && viewMode === 'table' && filteredMeds.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3">Medicamento</th>
                    <th className="py-3 px-3">Concentración</th>
                    <th className="py-3 px-3">Forma / Vía</th>
                    <th className="py-3 px-3">Clasificación / Uso</th>
                    <th className="py-3 px-4 text-right">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredMeds.map((m) => {
                    const isAgotado = (m.stock_actual ?? 0) <= 0
                    const isBajo = !isAgotado && (m.stock_actual ?? 0) <= (m.stock_minimo ?? 10)

                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors ${
                          isAgotado
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                            : isBajo
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isAgotado && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                              Agotado
                            </span>
                          )}
                          {isBajo && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-white">
                              Bajo Stock
                            </span>
                          )}
                          {!isAgotado && !isBajo && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600 text-white">
                              Disponible
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                          <div>{m.nombre_generico}</div>
                          {m.nombre_comercial && (
                            <div className="text-[11px] text-slate-500 font-normal italic">
                              Comercial: {m.nombre_comercial}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {m.concentracion || '---'}
                        </td>
                        <td className="py-2.5 px-3 font-sans capitalize text-slate-600 dark:text-slate-400">
                          {m.forma_farmaceutica || '---'} {m.via_administracion ? `• ${m.via_administracion}` : ''}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                          {m.clasificacion || m.uso ? `${m.clasificacion || ''} ${m.uso ? `(${m.uso})` : ''}` : '---'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`text-base font-black ${
                              isAgotado
                                ? 'text-rose-600 dark:text-rose-400'
                                : isBajo
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {m.stock_actual ?? 0}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans ml-1">un.</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Pie de Página Minimalista */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-400">
        Brigada Médica &amp; Farmacia • Sistema de Triaje Clínico • Actualización Automática cada 4 segundos
      </footer>
    </div>
  )
}

function MedicamentoStockCard({ item }: { item: StockPublicoMedicamento }) {
  const stock = item.stock_actual ?? 0
  const min = item.stock_minimo ?? 10
  const isAgotado = stock <= 0
  const isBajo = !isAgotado && stock <= min

  return (
    <div
      className={`rounded-xl p-4 transition-all duration-200 relative border flex flex-col justify-between ${
        isAgotado
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 shadow-sm'
          : isBajo
          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs'
      }`}
    >
      <div>
        {/* Cabecera de la tarjeta: Badge de Estado */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {isAgotado ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-rose-600 text-white flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">close</span>
              AGOTADO
            </span>
          ) : isBajo ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-white flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span>
              BAJO STOCK
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check</span>
              DISPONIBLE
            </span>
          )}

          {item.via_administracion && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {item.via_administracion}
            </span>
          )}
        </div>

        {/* Nombre y Concentración */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
          {item.nombre_generico}
        </h3>

        {item.nombre_comercial && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">
            {item.nombre_comercial}
          </p>
        )}

        <div className="mt-2 text-xs flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
          {item.concentracion && (
            <span className="font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {item.concentracion}
            </span>
          )}
          {item.forma_farmaceutica && (
            <span className="capitalize">{item.forma_farmaceutica}</span>
          )}
        </div>

        {/* Clasificación terapéutica / Uso */}
        {(item.clasificacion || item.uso) && (
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">category</span>
            <span className="truncate">
              {item.clasificacion || ''} {item.uso ? `• ${item.uso}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bloque Inferior: Indicador Gigante de Stock */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-end justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
            Stock en Carpa
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-black font-mono tracking-tight ${
                isAgotado
                  ? 'text-rose-600 dark:text-rose-400'
                  : isBajo
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {stock}
            </span>
            <span className="text-xs font-semibold text-slate-500">unidades</span>
          </div>
        </div>

        {isAgotado ? (
          <div className="text-[10px] font-bold text-rose-600 uppercase text-right leading-tight">
            NO RECETAR<br />
            (Sin Stock)
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 text-right">
            Mín: {min} un.
          </div>
        )}
      </div>
    </div>
  )
}

